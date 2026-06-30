# Bible Cross-Reference Study Guide — Build Prompt

Build a contextual Bible study web application using **Next.js (App Router)** deployable on **Vercel**. The user enters a Bible verse or verse range and an optional study question; the app uses Claude to find the most relevant cross-reference verses and then generates a contextual study guide.

## Tech Stack
- **Framework:** Next.js (App Router, TypeScript), deployable on Vercel.
- **Styling:** Tailwind CSS + **shadcn/ui** components. Clean, modern, accessible, responsive.
- **LLM:** Anthropic Claude via the official `@anthropic-ai/sdk` (TypeScript). Model: **`claude-sonnet-5`**.
- **Bible text:** ESV API.
- **No database, no authentication, no server-side persistence.** The app is fully stateless.

## Environment Variables (already in `.env.local`)
- `ANTHROPIC_API_KEY` — for the Claude API.
- `ESV_API_TOKEN` — for the ESV API. Sent as `Authorization: Token <ESV_API_TOKEN>`.

Both keys are server-only — never expose them to the client. All Claude and ESV calls happen in Next.js Route Handlers (server side).

## User Input
A single-screen form:
1. **Verse / range field** — text input for a verse (e.g. `John 3:16`) or range (e.g. `Romans 8:8-16`).
2. **Study Question field** — optional free-text. Ignored when blank.
3. **Submit button** — triggers the flow below.

**Reference parsing is lenient:** pass the user's raw input straight to the ESV API, which tolerates many formats and abbreviations. Only show a clear, friendly error if the ESV API returns no passage. Do not do strict client-side format validation.

## Processing Flow
On submit:
1. **Fetch the original passage** from the ESV API (text + section headings + verse numbers).
2. **Ask Claude for cross-references.** Claude determines the most relevant cross-reference verses directly from its own knowledge (pure-AI approach — no external cross-reference dataset). Let Claude choose how many, roughly **5–10**, based on relevance to the passage.
3. **Fetch each cross-reference's text** from the ESV API.
4. **Generate the study guide** with Claude, using:
   - the original passage text,
   - the chosen cross-reference verses and their text,
   - the optional study question (only if provided).

Structure the calls so cross-reference selection and study-guide generation are clear, well-prompted steps with two distinct response shapes:

### Step 2 — cross-reference list: use Claude **structured outputs**
The reference-selection step must return machine-parseable JSON, not prose — your code loops over the result to fetch ESV text, so prose-scraping/regex is brittle and must be avoided. Use the Anthropic SDK's structured outputs (`client.messages.parse()` with a Zod schema via `zodOutputFormat`, i.e. `output_config: { format: ... }`). Define a schema like:

```ts
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const CrossRefs = z.object({
  references: z.array(
    z.object({
      reference: z.string(), // e.g. "Romans 5:8" — fed straight to the ESV API
      reason: z.string(),    // one-line why-it-relates; helps the step-4 guide
    })
  ),
});

const res = await client.messages.parse({
  model: "claude-sonnet-5",
  max_tokens: 2000,
  messages: [{ role: "user", content: /* original passage ref + text + ask for 5-10 */ }],
  output_config: { format: zodOutputFormat(CrossRefs) },
});
// res.parsed_output is typed { references: { reference, reason }[] }
```

Notes:
- `res.parsed_output` can be `null` if parsing fails — guard it and surface a clear error.
- The JSON-schema subset does **not** enforce array length (`minItems`/`maxItems`), so the "5–10" count is instructed in the prompt, not the schema.
- Do **not** combine structured outputs with citations or assistant-message prefilling (incompatible). Neither is used here.
- (Strict tool use with `strict: true` is an alternative mechanism, but structured outputs is the simpler fit for this single data-shaping step.)

### Step 4 — study guide: stream **free-form markdown** (NOT structured output)
The final guide is flowing prose meant to stream token-by-token for good UX, so it must **not** use structured outputs. Use the streaming Messages API (`client.messages.stream(...)`) and emit markdown/text that the client renders into the sections below.

## Output
Stream the study guide to the user (token-by-token via the Anthropic streaming API) so progress is visible immediately. Render the result in well-organized sections:

1. **Passage summary & context** — historical/literary context and a plain-language summary of the original passage.
2. **Cross-references** — for **each** cross-reference: its reference, the ESV verse text, and an explanation of how it relates to the original passage. (This relationship explanation is required.)
3. **Themes & application** — key theological themes and practical life-application takeaways.
4. **Discussion / reflection questions** — questions suitable for personal study or small-group discussion.

If a study question was provided, weave the answer/focus throughout the relevant sections.

### Output actions
- **Copy** button — copy the full study guide as text/markdown.
- **Export** button — export the guide (e.g. download as markdown and/or print-to-PDF).

## ESV API Usage
Read and follow the ESV passage-text API documentation at https://api.esv.org/docs/passage-text/. Base URL for text: `https://api.esv.org/v3/passage/text/`.

Use these ESV features:
- **Verse text with headings & verse numbers** — request clean passage text that includes section headings and verse numbers, for both the original passage and every cross-reference. Tune the ESV query params (e.g. include headings & verse numbers, disable footnotes/audio links you don't need) for clean rendering.
- **Inline verse hover/preview** — any Bible reference shown in the output should be hoverable/clickable to preview that verse's ESV text inline (e.g. a popover/tooltip backed by an ESV fetch), so users can explore without leaving the page.

Cache ESV responses where reasonable (e.g. in-memory/request-level) to avoid redundant calls for the same reference.

## Architecture Notes
- Put Claude and ESV calls in **server-side Route Handlers** (e.g. `/api/...`). Stream the study-guide response to the client.
- Handle and surface errors gracefully: invalid/empty references, ESV API failures, Claude API errors, and rate limits — with clear user-facing messages and retry affordances.
- Keep the UI a single clean page: input form at top, streamed results below, with the hover-preview and copy/export interactions.
- Default `max_tokens` generously and stream (use the SDK's streaming helper) since study guides can be long.

## Deliverables
- A working Next.js app runnable with `npm run dev` and deployable to Vercel.
- README with setup instructions (env vars, install, run, deploy).
