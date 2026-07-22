import { Terminal, Sparkles, Shield, Zap } from 'lucide-react';

const SUGGESTIONS = [
  'Delete all empty folders',
  'Find files larger than 100MB',
  'Search for a text pattern recursively',
  'Kill a process by name',
  'Show disk usage',
  'Create a git branch and switch to it',
];

interface EmptyStateProps {
  onSuggestionClick: (s: string) => void;
}

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-12 animate-fade-in-up">
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Terminal className="h-8 w-8" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10 text-violet-500 dark:text-violet-400">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-foreground">
        Describe a command in plain English
      </h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        Type what you want to accomplish and get the exact terminal command,
        explanation, and safety info instantly.
      </p>

      <div className="mt-6 grid w-full max-w-md gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground hover:shadow-sm"
          >
            <Zap className="h-3.5 w-3.5 shrink-0 text-primary/50 group-hover:text-primary transition-colors" />
            {s}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3" /> Safety badges
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> AI fallback
        </span>
        <span>200+ commands indexed</span>
      </div>
    </div>
  );
}
