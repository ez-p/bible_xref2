# Bible Cross-Reference Study Guide

A stateless Next.js app that takes a Bible verse or range (and an optional study question), uses Claude to pick the most relevant cross-references, fetches all verse text from the ESV API, and streams a contextual study guide.

## Tech Stack

- **Next.js (App Router, TypeScript)** — deployable on Vercel
- **Tailwind CSS + shadcn/ui** for styling/components
- **`@anthropic-ai/sdk`** — Claude (`claude-sonnet-5`) for cross-reference selection (structured outputs) and study guide generation (streaming)
- **ESV API** for all Bible text
- No database, no auth, no server-side persistence — fully stateless

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local` in the project root (already present in this repo) with:

```bash
ANTHROPIC_API_KEY=sk-ant-...
ESV_API_TOKEN=...
```

- Get an Anthropic API key at https://console.anthropic.com/
- Get an ESV API token at https://api.esv.org/ (free for non-commercial use)

Both keys are read only in server-side Route Handlers (`src/app/api/*`) and are never sent to the client.

### 3. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

## How it works

1. **Fetch the original passage** from the ESV API (`/api/study`), with headings and verse numbers.
2. **Ask Claude for cross-references** using structured outputs (`messages.parse` + a Zod schema) — returns 5–10 references with a one-line reason each.
3. **Fetch each cross-reference's text** from the ESV API (cached in-memory per request process to avoid duplicate calls).
4. **Stream the study guide** (`/api/guide`) using `messages.stream`, rendering Markdown with four sections: Passage Summary & Context, Cross-References, Themes & Application, and Discussion/Reflection Questions.

## Build

```bash
npm run build
npm start
```

## Deploy to Vercel

```bash
npx vercel
```

Set the `ANTHROPIC_API_KEY` and `ESV_API_TOKEN` environment variables in the Vercel project settings (Project → Settings → Environment Variables). No other configuration is required.

## Project Structure

```
src/
  app/
    page.tsx               # main page
    api/
      study/route.ts       # ESV passage + Claude structured cross-refs + ESV ref text
      guide/route.ts       # streaming study-guide markdown
  components/
    study-form.tsx         # input form + orchestration
    study-results.tsx      # passage, cross-ref cards, streamed guide, copy/export
    markdown.tsx           # markdown rendering
    ui/                    # shadcn/ui components
  lib/
    esv.ts                  # ESV API client + cache
    anthropic.ts             # shared Anthropic client
    schemas.ts                # Zod schema for cross-reference structured output
    types.ts                   # shared TS types
```
