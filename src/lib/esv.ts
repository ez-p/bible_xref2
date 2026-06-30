import type { Passage } from "@/lib/types";

const ESV_BASE = "https://api.esv.org/v3/passage/text/";

export class EsvNotFoundError extends Error {
  constructor(reference: string) {
    super(`No passage found for "${reference}"`);
    this.name = "EsvNotFoundError";
  }
}

export class EsvApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "EsvApiError";
    this.status = status;
  }
}

const cache = new Map<string, Passage>();

function cacheKey(reference: string, params: Record<string, string>) {
  return `${reference.trim().toLowerCase()}::${JSON.stringify(params)}`;
}

async function fetchFromEsv(reference: string, params: Record<string, string>): Promise<Passage> {
  const key = cacheKey(reference, params);
  const cached = cache.get(key);
  if (cached) return cached;

  const token = process.env.ESV_API_TOKEN;
  if (!token) {
    throw new EsvApiError("ESV_API_TOKEN is not configured on the server", 500);
  }

  const url = new URL(ESV_BASE);
  url.searchParams.set("q", reference);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Authorization: `Token ${token}` },
    });
  } catch {
    throw new EsvApiError("Failed to reach the ESV API", 502);
  }

  if (res.status === 429) {
    throw new EsvApiError("ESV API rate limit exceeded. Please try again shortly.", 429);
  }
  if (!res.ok) {
    throw new EsvApiError(`ESV API error (${res.status})`, res.status);
  }

  const data = await res.json();
  const passages: string[] = data.passages ?? [];
  const canonical: string = data.canonical ?? "";

  if (!canonical || passages.length === 0) {
    throw new EsvNotFoundError(reference);
  }

  const passage: Passage = {
    canonical,
    text: passages.join("\n\n").trim(),
  };

  cache.set(key, passage);
  return passage;
}

export function fetchPassageText(reference: string): Promise<Passage> {
  return fetchFromEsv(reference, {
    "include-headings": "true",
    "include-verse-numbers": "true",
    "include-footnotes": "false",
    "include-footnote-body": "false",
    "include-audio-link": "false",
    "include-passage-references": "false",
    "include-short-copyright": "false",
  });
}

export function fetchVerse(reference: string): Promise<Passage> {
  return fetchFromEsv(reference, {
    "include-headings": "false",
    "include-verse-numbers": "true",
    "include-footnotes": "false",
    "include-footnote-body": "false",
    "include-audio-link": "false",
    "include-passage-references": "false",
    "include-short-copyright": "false",
  });
}
