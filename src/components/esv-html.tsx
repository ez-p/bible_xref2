export function EsvHtml({ html }: { html: string }) {
  return (
    <div
      className="prose prose-neutral prose-sm dark:prose-invert max-w-none [&_.woc]:text-red-600 dark:[&_.woc]:text-red-500"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
