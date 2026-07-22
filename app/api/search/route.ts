import { NextRequest, NextResponse } from 'next/server';
import { search, shouldUseLLM } from '@/lib/search';
import { generateWithLLM, llmResultToEntry } from '@/lib/llm';
import type { SearchResponse, SearchResult } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 },
    );
  }

  const topK = Math.min(parseInt(searchParams.get('top') || '5', 10), 20);
  const forceLLM = searchParams.get('force_llm') === 'true';

  try {
    let results: SearchResult[] = search(query, topK);
    let llmUsed = false;

    if (forceLLM || shouldUseLLM(results)) {
      const generated = await generateWithLLM(query);
      if (generated) {
        const entry = llmResultToEntry(query, generated);
        results = [{ entry, score: 1.0, source: 'llm' }];
        llmUsed = true;
      }
    }

    const latencyMs = Date.now() - startTime;

    const response: SearchResponse = {
      query,
      results,
      llmUsed,
      latencyMs,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[search] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal search error',
        message: error instanceof Error ? error.message : 'Unknown error',
        query,
        results: [],
        llmUsed: false,
        latencyMs: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}


