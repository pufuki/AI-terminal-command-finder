'use client';

import { Search, Loader2, X, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface SearchBoxProps {
  value: string;
  onChange: (v: string) => void;
  loading: boolean;
  autoFocus?: boolean;
}

export function SearchBox({ value, onChange, loading, autoFocus = true }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative w-full">
      <div
        className={cn(
          'group relative flex items-center gap-3 rounded-2xl border bg-card/80 backdrop-blur-sm px-4 py-3.5 transition-all duration-300',
          'border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20',
          'shadow-lg shadow-black/5',
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what you want to do..."
          className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search for terminal commands"
        />
        {loading && (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
        )}
        {value && !loading && (
          <button
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="hidden sm:flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-muted/50 px-1.5 py-1 text-[10px] text-muted-foreground">
          <Command className="h-3 w-3" />
          <span>K</span>
        </div>
      </div>
    </div>
  );
}
