import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getCalendarClient } from '@/lib/google';

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

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    
    // Default to end of today if not specified, or next 7 days
    const defaultMax = new Date();
    defaultMax.setDate(defaultMax.getDate() + 7);
    const timeMax = searchParams.get('timeMax') || defaultMax.toISOString();

    const calendar = await getCalendarClient(userId);
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = (res.data.items || []).map((evt) => ({
      id: evt.id,
      summary: evt.summary || 'No Title',
      description: evt.description || '',
      location: evt.location || '',
      start: evt.start?.dateTime || evt.start?.date,
      end: evt.end?.dateTime || evt.end?.date,
      htmlLink: evt.htmlLink,
    }));

    return NextResponse.json({ success: true, count: events.length, events });
  } catch (error: any) {
    console.error('API Calendar GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch calendar events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { summary, startTime, endTime, description, location } = await request.json();

    if (!summary || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing summary, startTime, or endTime.' }, { status: 400 });
    }

    const calendar = await getCalendarClient(userId);
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description: description || 'Created by Jarvis OS',
        location: location || '',
        start: { dateTime: startTime },
        end: { dateTime: endTime },
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: res.data.id,
        summary: res.data.summary,
        htmlLink: res.data.htmlLink,
      },
    });
  } catch (error: any) {
    console.error('API Calendar POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create calendar event' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const calendar = await getCalendarClient(userId);
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    return NextResponse.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error: any) {
    console.error('API Calendar DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete event' }, { status: 500 });
  }
}
