import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google';

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error('Failed to generate Google auth URL:', error);
    return NextResponse.json({ error: 'Auth initialization failed' }, { status: 500 });
  }
}
