import { NextResponse } from 'next/server';
import { warmupDatabase } from '@/lib/db-warmup';

export async function GET() {
  try {
    await warmupDatabase();
    return NextResponse.json({ status: 'warmed up' });
  } catch (error) {
    console.error('Warmup error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
