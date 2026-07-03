import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { runMorningDigest, runEveningPrep } from '@/lib/automation';

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-long-fallback-secret-key-that-is-secure-enough';

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('jarvis_session');
  if (!sessionCookie) return null;
  try {
    const decoded: any = jwt.verify(sessionCookie.value, JWT_SECRET);
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runs = await db.automationJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const logs = await db.log.findMany({
      where: { userId, type: 'AUTOMATION' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, runs, logs });
  } catch (error) {
    console.error('API Automations GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch automation logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Automation type is required' }, { status: 400 });
    }

    let result = '';
    if (type === 'DAILY_PLAN' || type === 'morning') {
      result = await runMorningDigest(userId);
    } else if (type === 'EVENING_PREP' || type === 'evening') {
      result = await runEveningPrep(userId);
    } else {
      return NextResponse.json({ error: `Unknown automation type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Automation executed.', result });
  } catch (error: any) {
    console.error('API Automations POST Error:', error);
    return NextResponse.json({ error: error.message || 'Automation execution failed' }, { status: 500 });
  }
}
