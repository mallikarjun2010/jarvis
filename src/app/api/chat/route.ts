import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { runAgentChat } from '@/lib/gemini';

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-long-fallback-secret-key-that-is-secure-enough';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('jarvis_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Verify Session JWT
    let decoded: any;
    try {
      decoded = jwt.verify(sessionCookie.value, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await request.json();
    const { message } = body;
    let { conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    // If no conversation ID, create a new one
    if (!conversationId) {
      const conv = await db.conversation.create({
        data: {
          userId,
          title: message.substring(0, 30) + '...',
        },
      });
      conversationId = conv.id;
    }

    // Execute the agent chat flow (which calls tools, memory, etc.)
    const agentResponse = await runAgentChat(userId, conversationId, message);

    return NextResponse.json({
      success: true,
      conversationId,
      content: agentResponse.content,
      thoughts: agentResponse.thoughts,
    });
  } catch (error: any) {
    console.error('Chat API Endpoint Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing agent.' },
      { status: 500 }
    );
  }
}

/**
 * GET handler to load message history for a given conversation.
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('jarvis_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error('Failed to retrieve chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
