import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

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

    let settings = await db.setting.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.setting.create({
        data: {
          userId,
          voiceOutput: true,
          autoDigest: true,
          focusMode: false,
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('API Settings GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { voiceOutput, autoDigest, focusMode, customTheme } = await request.json();

    const existing = await db.setting.findUnique({
      where: { userId },
    });

    let settings;
    if (existing) {
      settings = await db.setting.update({
        where: { userId },
        data: {
          voiceOutput: voiceOutput !== undefined ? voiceOutput : existing.voiceOutput,
          autoDigest: autoDigest !== undefined ? autoDigest : existing.autoDigest,
          focusMode: focusMode !== undefined ? focusMode : existing.focusMode,
          customTheme: customTheme !== undefined ? customTheme : existing.customTheme,
        },
      });
    } else {
      settings = await db.setting.create({
        data: {
          userId,
          voiceOutput: voiceOutput !== undefined ? voiceOutput : true,
          autoDigest: autoDigest !== undefined ? autoDigest : true,
          focusMode: focusMode !== undefined ? focusMode : false,
          customTheme: customTheme !== undefined ? customTheme : 'default',
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('API Settings POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
