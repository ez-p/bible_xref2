# Plan: Bible Cross-Reference Study Guide (Next.js)

## Context
The repo is greenfield (`prompt.md`, `prompt2.md`, `.env.local`, `.git` only). `prompt2.md` is a complete, interviewed spec for a stateless Next.js app that takes a Bible verse/range + optional study question, uses Claude to pick 5–10 cross-references, fetches verse text from the ESV API, and streams a contextual study guide. This plan turns that spec into a concrete, buildable structure. Keys (`ANTHROPIC_API_KEY`, `ESV_API_TOKEN`) already exist in `.env.local` and must stay server-only.

Key design decisions (locked in `prompt2.md`):
- Model `claude-sonnet-5` via official `@anthropic-ai/sdk`.
- Two response shapes: **structured outputs** for the cross-reference list, **streamed markdown** for the guide.
- Stateless (no DB/auth). Tailwind + shadcn/ui. Copy + export actions. Inline verse hover preview. Lenient reference parsing via ESV.

## Tech Stack & Scaffolding
- **Scaffold:** `npx create-next-app@latest` — TypeScript, App Router, Tailwind, ESLint, `src/` dir, import alias `@/*`.
- **shadcn/ui:** `npx shadcn@latest init`, then add: `button`, `input`, `textarea`, `card`, `popover`, `skeleton`, `sonner` (toasts).
- **Extra deps:** `@anthropic-ai/sdk`, `zod`, `react-markdown`, `remark-gfm`. (shadcn pulls in `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, radix primitives.)
- Vercel-ready by default; no extra config needed.

## Project Structure
```
src/
  app/
    layout.tsx                  # root layout, fonts, <Toaster/>
    page.tsx                    # server component shell, renders <StudyForm/>
    globals.css                 # tailwind + shadcn theme tokens
    api/
      study/route.ts            # POST: ESV original + Claude structured refs + ESV ref text  -> JSON
      guide/route.ts            # POST: stream study-guide markdown (Claude streaming)
      verse/route.ts            # GET ?ref=: single-verse ESV text for hover preview -> JSON
  components/
    study-form.tsx              # client: inputs, submit, orchestrates the 3 calls, holds state
    study-results.tsx           # renders passage, cross-ref cards, streamed guide, copy/export
    verse-hover.tsx             # client: wraps a reference in a Popover, lazy-fetches /api/verse
    markdown.tsx                # react-markdown + remark-gfm wrapper w/ tailwind prose styling
    ui/                         # shadcn-generated components
  lib/
    esv.ts                      # fetchPassageText(ref) + fetchVerse(ref); ESV query params; errors
    anthropic.ts               # shared Anthropic client instance
    schemas.ts                  # Zod CrossRefs schema (shared by route + types)
    types.ts                    # StudyData / CrossReference TS types
```

## Implementation Detail

### `lib/esv.ts` — ESV API wrapper
- Base: `https://api.esv.org/v3/passage/text/`, header `Authorization: Token ${process.env.ESV_API_TOKEN}`.
- Query params for clean rendering: `include-headings=true`, `include-verse-numbers=true`, `include-footnotes=false`, `include-audio-link=false`, `include-passage-references=true`, `include-short-copyright=false`.
- `fetchPassageText(ref)` → `{ canonical: string, text: string }`; treat empty `passages[]` / empty `canonical` as "not found" and throw a typed `EsvNotFoundError`.
- `fetchVerse(ref)` → lighter call for hover preview (verse numbers off optional).
- Simple in-memory `Map` cache keyed by normalized ref to avoid duplicate fetches within the process.

### `lib/schemas.ts` — structured output schema
```ts
export const CrossRefs = z.object({
  references: z.array(z.object({
    reference: z.string(), // "Romans 5:8" — fed to ESV
    reason: z.string(),    // one-line relationship hint
  })),
});
```
Count "5–10" lives in the prompt (array length is not schema-enforceable).

### `app/api/study/route.ts` — step 2 + 3 (non-streaming JSON)
1. Parse body `{ reference, question? }`.
2. `fetchPassageText(reference)` → original passage; on `EsvNotFoundError` return `400` with a friendly message.
3. `client.messages.parse({ model: "claude-sonnet-5", max_tokens: 2000, output_config: { format: zodOutputFormat(CrossRefs) }, messages: [...] })` — prompt includes the canonical ref + passage text + "return the 5–10 most relevant cross-references." Guard `parsed_output === null`.
4. For each reference, `fetchPassageText` its text (parallel, drop any that 404).
5. Return `{ passage: {canonical, text}, references: [{reference, reason, text}], question }`.
- Wrap Claude calls; map Anthropic errors (incl. `RateLimitError`) to clean `429/500` responses. `export const runtime = "nodejs"`.

### `app/api/guide/route.ts` — step 4 (streaming markdown)
- Body: `{ passage, references, question? }` (the JSON from `/api/study`).
- `client.messages.stream({ model: "claude-sonnet-5", max_tokens: 8000, messages: [...] })` with a prompt instructing the 4 required sections (Passage summary & context; Cross-references with per-ref relationship explanation; Themes & application; Discussion/reflection questions), weaving in the question if present, output as markdown.
- Pipe text deltas into a `ReadableStream` (via `stream.on("text", ...)` or `TextEncoderStream`); return `new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } })`.

### `app/api/verse/route.ts` — hover preview
- `GET ?ref=` → `fetchVerse` → `{ canonical, text }`; 400 on not found.

### `components/study-form.tsx` (client) — orchestration + state
- Fields: reference `Input`, optional question `Textarea`, submit `Button`.
- On submit: POST `/api/study` (show skeletons) → render passage + cross-ref cards → POST `/api/guide`, read `response.body.getReader()`, append decoded chunks into streamed-guide state.
- Error states via `sonner` toasts; disable submit while loading.

### `components/study-results.tsx`
- Passage card (canonical + text).
- One `Card` per cross-reference: reference (as `<VerseHover>`), ESV text, reason.
- Streamed guide rendered through `<Markdown>`; references inside prose optionally wrapped with `<VerseHover>`.
- **Copy** button (full guide → clipboard) and **Export** (download `.md` via Blob + `URL.createObjectURL`; "Print" via `window.print()`).

### `components/verse-hover.tsx`
- shadcn `Popover`; on open, lazy-`fetch('/api/verse?ref=...')`, cache per ref in component state, show `Skeleton` while loading.

## Verification
1. `npm install` then `npm run dev`; open `http://localhost:3000`.
2. **Happy path:** enter `John 3:16`, submit → original passage renders, 5–10 cross-ref cards appear, study guide streams in with all four sections.
3. **Range:** `Romans 8:8-16` → multi-verse passage handled.
4. **With question:** add a study question → guide reflects it.
5. **Invalid input:** `asdf 99:99` → friendly "passage not found" error, no crash.
6. **Hover preview:** hover/click a reference → popover shows its ESV text.
7. **Copy/Export:** copy puts markdown on clipboard; export downloads `.md`; print opens print view.
8. **Build:** `npm run build` succeeds with no type errors.
9. **Security:** confirm no `NEXT_PUBLIC_` exposure of keys; grep client bundle for token names; all ESV/Claude calls are in `app/api/*` route handlers only.

## Notes / Risks
- ESV API has rate limits (per-token); the in-memory cache + reasonable usage should suffice for dev. Surface 429s clearly.
- `messages.parse` requires a recent `@anthropic-ai/sdk`; pin latest. Structured outputs supported on `claude-sonnet-5`.
- Streaming route must use `runtime = "nodejs"` (not edge) for the SDK.
