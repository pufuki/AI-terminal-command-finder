'use client';

import { Terminal, Tag } from 'lucide-react';
import type { SearchResult } from '@/lib/types';
import { SafetyBadge } from './safety-badge';
import { CopyButton } from './copy-button';
import { cn } from '@/lib/utils';

interface CommandCardProps {
  result: SearchResult;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function CommandCard({ result, index, isSelected, onSelect }: CommandCardProps) {
  const { entry, score, source } = result;
  const isDangerous = entry.safety === 'dangerous';
  const confidencePct = Math.round(Math.min(score, 1) * 100);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative cursor-pointer rounded-xl border bg-card p-4 transition-all duration-200 animate-fade-in-up',
        isSelected
          ? 'border-primary/50 ring-1 ring-primary/30 glow-sm'
          : 'border-border hover:border-primary/30 hover:shadow-md',
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Terminal className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {entry.description}
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <Tag className="h-3 w-3" />
                {entry.category}
              </span>
              {source === 'llm' && (
                <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-500 dark:text-violet-400">
                  AI Generated
                </span>
              )}
            </div>
          </div>
        </div>
        <SafetyBadge level={entry.safety} />
      </div>

      {/* Command block */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 overflow-x-auto scrollbar-thin rounded-lg bg-zinc-950 dark:bg-black/40 px-3 py-2.5">
          <code className="font-mono text-sm text-emerald-400 whitespace-nowrap">
            <span className="text-muted-foreground/50 select-none">$ </span>
            {entry.command}
          </code>
        </div>
        <CopyButton text={entry.command} label="Copy" />
      </div>

      {/* Dangerous warning */}
      {isDangerous && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          <span className="font-semibold">⚠ Dangerous:</span>
          <span>This command can cause irreversible data loss. Review carefully before running.</span>
        </div>
      )}

      {/* Explanation */}
      {entry.explanation && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {entry.explanation}
        </p>
      )}

      {/* Flags */}
      {entry.flags && entry.flags.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Flags
          </p>
          {entry.flags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-primary">
                {flag.flag}
              </code>
              <span className="text-muted-foreground">{flag.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Example */}
      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70 mb-1">
          Example
        </p>
        <div className="overflow-x-auto scrollbar-thin rounded-lg bg-muted/50 px-3 py-2">
          <code className="font-mono text-xs text-foreground/80 whitespace-nowrap">
            {entry.example}
          </code>
        </div>
      </div>

      {/* Footer: tags + confidence */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {entry.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  confidencePct >= 70
                    ? 'bg-emerald-500'
                    : confidencePct >= 40
                      ? 'bg-amber-500'
                      : 'bg-red-500',
                )}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {confidencePct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
