import { SearchX } from 'lucide-react';

export function NoResults() {
  return (
    <div className="flex flex-col items-center text-center py-12 animate-fade-in-up">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
        <SearchX className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">No matching commands found</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Try rephrasing your query or use more specific keywords.
        If an AI backend is configured, it will be used as a fallback.
      </p>
    </div>
  );
}
