import { z } from "zod";

export const CrossRefs = z.object({
  references: z.array(
    z.object({
      reference: z.string().describe('e.g. "Romans 5:8" — fed straight to the ESV API'),
      reason: z.string().describe("one-line explanation of why this verse relates to the passage"),
    })
  ),
});

export type CrossRefsOutput = z.infer<typeof CrossRefs>;

const MAX_REFERENCE_LENGTH = 32;
const MAX_QUESTION_LENGTH = 512;

export const StudyRequestSchema = z.object({
  reference: z
    .string("Please enter a Bible verse or range.")
    .trim()
    .min(1, "Please enter a Bible verse or range.")
    .max(MAX_REFERENCE_LENGTH, `Verse reference is too long (max ${MAX_REFERENCE_LENGTH} characters).`),
  question: z
    .string()
    .trim()
    .max(MAX_QUESTION_LENGTH, `Study question is too long (max ${MAX_QUESTION_LENGTH} characters).`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export const GuideRequestSchema = z.object({
  token: z.string("Missing session token.").min(1, "Missing session token."),
});
