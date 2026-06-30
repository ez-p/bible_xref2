"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

type VerseState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; canonical: string; text: string }
  | { status: "error"; message: string };

export function VerseHover({
  reference,
  children,
}: {
  reference: string;
  children?: React.ReactNode;
}) {
  const [state, setState] = useState<VerseState>({ status: "idle" });

  async function load() {
    if (state.status === "loading" || state.status === "loaded") return;
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/verse?ref=${encodeURIComponent(reference)}`);
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Failed to load verse." });
        return;
      }
      setState({ status: "loaded", canonical: data.canonical, text: data.text });
    } catch {
      setState({ status: "error", message: "Failed to load verse." });
    }
  }

  return (
    <Popover onOpenChange={(open) => open && load()}>
      <PopoverTrigger
        className="cursor-pointer underline decoration-dotted underline-offset-4 hover:text-primary"
        render={<span />}
        nativeButton={false}
        openOnHover
        delay={200}
      >
        {children ?? reference}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {state.status === "loading" && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}
        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}
        {state.status === "loaded" && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{state.canonical}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{state.text}</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
