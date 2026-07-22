import { NextResponse } from 'next/server';
import { getDatasetSize } from '@/lib/search';
import { categories } from '@/lib/dataset';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    totalCommands: getDatasetSize(),
    categories,
  });
}
