"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/markdown";
import { EsvHtml } from "@/components/esv-html";
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
  function handleExport() {
    const blob = new Blob([guide], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.passage.canonical.replace(/[^a-z0-9]+/gi, "-")}-study-guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{data.passage.canonical}</CardTitle>
        </CardHeader>
        <CardContent>
          <EsvHtml html={data.passage.text} />
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
                {ref.text && <EsvHtml html={ref.text} />}
                <p className="text-sm italic">{ref.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Study Guide</h2>
          <div className="flex gap-2 print:hidden">
            <Button
              size="sm"
              onClick={handleExport}
              disabled={!guide}
              className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Export
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={!guide}
              className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Print
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
          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              Print
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
