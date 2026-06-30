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
