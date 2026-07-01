import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, MODEL } from "@/lib/anthropic";
import { CrossRefs, StudyRequestSchema } from "@/lib/schemas";
import { fetchPassageText, EsvNotFoundError, EsvApiError } from "@/lib/esv";
import { createSession } from "@/lib/session-store";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import type { CrossReference, StudyData } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`study:${getClientKey(req)}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = StudyRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 }
    );
  }
  const { reference, question } = parsed.data;

  let passage;
  try {
    passage = await fetchPassageText(reference);
  } catch (err) {
    if (err instanceof EsvNotFoundError) {
      return NextResponse.json(
        { error: `We couldn't find a passage for "${reference}". Try a format like "John 3:16" or "Romans 8:8-16".` },
        { status: 400 }
      );
    }
    if (err instanceof EsvApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 429 ? 429 : 502 });
    }
    return NextResponse.json({ error: "Failed to fetch the passage." }, { status: 502 });
  }

  let parsedOutput;
  try {
    const result = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are a biblical cross-reference expert. Given the following passage, identify the 5 to 10 most relevant cross-reference verses from elsewhere in the Bible — verses that illuminate, parallel, fulfill, or contrast with this passage.

Passage: ${passage.canonical}

Text:
${passage.text}

For each cross-reference, give a precise verse or short verse range reference (e.g. "Romans 5:8") that can be looked up directly, and a one-line reason explaining how it relates to the passage above. Choose between 5 and 10 references, prioritizing the most theologically and thematically relevant ones.`,
        },
      ],
      output_config: { format: zodOutputFormat(CrossRefs) },
    });
    parsedOutput = result.parsed_output;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Claude API rate limit reached. Please try again shortly." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: "Claude API error while selecting cross-references." }, { status: 502 });
    }
    return NextResponse.json({ error: "Unexpected error while selecting cross-references." }, { status: 500 });
  }

  if (!parsedOutput) {
    return NextResponse.json({ error: "Claude returned an unparseable response. Please try again." }, { status: 502 });
  }

  const references: CrossReference[] = await Promise.all(
    parsedOutput.references.map(async (ref) => {
      try {
        const text = await fetchPassageText(ref.reference);
        return { reference: text.canonical, reason: ref.reason, text: text.text };
      } catch {
        return { reference: ref.reference, reason: ref.reason, text: null };
      }
    })
  );

  const data: StudyData = {
    passage,
    references: references.filter((r) => r.text !== null),
    question,
  };

  const token = createSession(data);

  return NextResponse.json({ ...data, token });
}
