import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { saveMemory } from '@/lib/memory';

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

    const memories = await db.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, count: memories.length, memories });
  } catch (error) {
    console.error('API Memories GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, category, tags } = await request.json();

    if (!content || !category) {
      return NextResponse.json({ error: 'Content and Category are required' }, { status: 400 });
    }

    const memory = await saveMemory(userId, {
      content,
      category,
      tags,
    });

    return NextResponse.json({ success: true, memory });
  } catch (error: any) {
    console.error('API Memories POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save memory' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 });
    }

    await db.memory.deleteMany({
      where: { id, userId },
    });

    return NextResponse.json({ success: true, message: 'Memory deleted.' });
  } catch (error: any) {
    console.error('API Memories DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
