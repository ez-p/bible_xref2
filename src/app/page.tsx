import { StudyForm } from "@/components/study-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bible Contextual Study Guide
        </h1>
        <p className="text-muted-foreground">
          Enter a verse or range and an optional study question. Claude will find relevant
          cross-references and generate a contextual study guide from the ESV text.
        </p>
      </div>
      <StudyForm />
    </main>
  );
}
