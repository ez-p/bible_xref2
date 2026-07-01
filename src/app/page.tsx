import Image from "next/image";
import { StudyForm } from "@/components/study-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
          <Image
            src="/bible-explorer.png"
            alt=""
            width={36}
            height={36}
            className="rounded-md"
          />
          Bible Contextual Study Guide
        </h1>
        <p className="text-muted-foreground">
          Enter a verse or verse range and an optional study question. Bible cross-references
          will be discovered automatically and a contextual study guide will be generated.
        </p>
      </div>
      <StudyForm />
    </main>
  );
}
