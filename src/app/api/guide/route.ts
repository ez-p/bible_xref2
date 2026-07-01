import Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODEL } from "@/lib/anthropic";
import { getSession } from "@/lib/session-store";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { GuideRequestSchema } from "@/lib/schemas";
import type { StudyData } from "@/lib/types";

export const runtime = "nodejs";

function buildPrompt({ passage, references, question }: StudyData) {
  const refsBlock = references
    .map(
      (r) => `### ${r.reference}\n${r.text}\nWhy it relates: ${r.reason}`
    )
    .join("\n\n");

  const questionBlock = question
    ? `\nThe reader has also asked this study question: "${question}"\nWeave the answer to this question throughout the relevant sections below, where it naturally fits.\n`
    : "";

  return `You are an experienced, theologically careful Bible study guide writer. Write a contextual study guide in Markdown for the passage below, using the provided cross-references.
${questionBlock}
## Original Passage: ${passage.canonical}

${passage.text}

## Cross-References

${refsBlock}

Write the study guide in Markdown with exactly these four sections, using level-2 headings ("## ") in this order:

1. **Passage Summary & Context** — historical and literary context, and a plain-language summary of the original passage.
2. **Cross-References** — for EACH cross-reference listed above, include its reference as a sub-heading, quote its verse text, and explain how it relates to the original passage. Every cross-reference must be covered.
3. **Themes & Application** — key theological themes and practical, life-application takeaways.
4. **Discussion / Reflection Questions** — a numbered list of questions suitable for personal study or small-group discussion.

Write in clear, warm, accessible prose. Do not include any text before the first heading or after the last section.`;
}

export async function POST(req: Request) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`guide:${getClientKey(req)}`);
  if (!allowed) {
    return new Response("Too many requests. Please try again shortly.", {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const parsed = GuideRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return new Response(parsed.error.issues[0]?.message ?? "Invalid request body.", { status: 400 });
  }
  const { token } = parsed.data;

  const session: StudyData | undefined = getSession(token);
  if (!session) {
    return new Response(
      "This study session has expired or wasn't found. Please generate the study guide again.",
      { status: 400 }
    );
  }

  const prompt = buildPrompt(session);

  let claudeStream;
  try {
    claudeStream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });
  } catch {
    return new Response("Failed to start study guide generation.", { status: 502 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      claudeStream.on("text", (delta) => {
        controller.enqueue(encoder.encode(delta));
      });
      claudeStream.on("end", () => {
        controller.close();
      });
      claudeStream.on("error", (err) => {
        const message =
          err instanceof Anthropic.RateLimitError
            ? "\n\n_Claude API rate limit reached while generating the guide. Please try again shortly._"
            : "\n\n_An error occurred while generating the study guide. Please try again._";
        controller.enqueue(encoder.encode(message));
        controller.close();
      });
    },
    cancel() {
      claudeStream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
