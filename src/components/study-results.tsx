"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/markdown";
import type { StudyData } from "@/lib/types";

export function StudyResults({
  data,
  guide,
  isStreaming,
}: {
  data: StudyData;
  guide: string;
  isStreaming: boolean;
}) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(guide);
      toast.success("Study guide copied to clipboard.");
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  }

  function handleExport() {
    const blob = new Blob([guide], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.passage.canonical.replace(/[^a-z0-9]+/gi, "-")}-study-guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{data.passage.canonical}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm leading-relaxed">{data.passage.text}</p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Cross-References</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.references.map((ref) => (
            <Card key={ref.reference}>
              <CardHeader>
                <CardTitle className="text-sm">{ref.reference}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="whitespace-pre-line text-sm text-muted-foreground">{ref.text}</p>
                <p className="text-sm italic">{ref.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Study Guide</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!guide}>
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!guide}>
              Export
            </Button>
          </div>
        </div>
        <Card>
          <CardContent>
            {guide ? (
              <Markdown>{guide}</Markdown>
            ) : isStreaming ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : null}
          </CardContent>
        </Card>
        {guide && !isStreaming && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
