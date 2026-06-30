"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { StudyResults } from "@/components/study-results";
import type { StudyData } from "@/lib/types";

type Phase = "idle" | "loading-study" | "streaming-guide" | "done" | "error";

export function StudyForm() {
  const [reference, setReference] = useState("");
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [guide, setGuide] = useState("");

  const isLoading = phase === "loading-study" || phase === "streaming-guide";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim() || isLoading) return;

    setPhase("loading-study");
    setStudyData(null);
    setGuide("");

    let data: StudyData;
    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, question }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Something went wrong looking up that passage.");
        setPhase("error");
        return;
      }
      data = json;
      setStudyData(data);
    } catch {
      toast.error("Network error while fetching the passage.");
      setPhase("error");
      return;
    }

    setPhase("streaming-guide");
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        toast.error(text || "Failed to generate the study guide.");
        setPhase("error");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setGuide(acc);
      }
      setPhase("done");
    } catch {
      toast.error("Network error while generating the study guide.");
      setPhase("error");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reference" className="text-sm font-medium">
                Verse or range
              </label>
              <Input
                id="reference"
                placeholder="e.g. John 3:16 or Romans 8:8-16"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="question" className="text-sm font-medium">
                Study question <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                id="question"
                placeholder="What do you want to explore about this passage?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isLoading || !reference.trim()} className="self-start">
              {isLoading && <Loader2Icon className="animate-spin" />}
              {phase === "loading-study"
                ? "Looking up passage..."
                : phase === "streaming-guide"
                ? "Generating study guide..."
                : "Generate Study Guide"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {studyData && (
        <StudyResults
          data={studyData}
          guide={guide}
          isStreaming={phase === "streaming-guide"}
        />
      )}
    </div>
  );
}
