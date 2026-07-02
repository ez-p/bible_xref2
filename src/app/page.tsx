import Image from "next/image";
import { StudyForm } from "@/components/study-form";
import { HeaderMenu } from "@/components/header-menu";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
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
          <div className="print:hidden">
            <HeaderMenu />
          </div>
        </div>
        <p className="text-muted-foreground">
          Enter a verse or verse range and an optional study question. Bible cross-references
          will be discovered automatically and a contextual study guide will be generated using
          the original Bible verse, cross-referenced verses, and the optional study question.
        </p>
      </div>
      <StudyForm />
    </main>
  );
}
