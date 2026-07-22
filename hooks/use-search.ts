'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SearchResponse } from '@/lib/types';

interface UseSearchResult {
  query: string;
  setQuery: (q: string) => void;
  data: SearchResponse | null;
  loading: boolean;
  error: string | null;
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
}

export function useSearch(): UseSearchResult {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (q: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (q.trim().length === 0) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedIndex(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&top=8`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Search failed (${res.status})`);
      }
      const json: SearchResponse = await res.json();
      setData(json);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, query.trim().length === 0 ? 0 : 200);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  return { query, setQuery, data, loading, error, selectedIndex, setSelectedIndex };
}
