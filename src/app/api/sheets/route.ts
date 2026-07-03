import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSheetsClient } from '@/lib/google';

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
    const spreadsheetId = searchParams.get('spreadsheetId');
    const range = searchParams.get('range');

    if (!spreadsheetId || !range) {
      return NextResponse.json({ error: 'spreadsheetId and range are required' }, { status: 400 });
    }

    const sheets = await getSheetsClient(userId);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return NextResponse.json({
      success: true,
      values: res.data.values || [],
    });
  } catch (error: any) {
    console.error('API Sheets GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to retrieve spreadsheet data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spreadsheetId, range, values } = await request.json();

    if (!spreadsheetId || !range || !values || !Array.isArray(values)) {
      return NextResponse.json({ error: 'Missing spreadsheetId, range, or cell values array' }, { status: 400 });
    }

    const sheets = await getSheetsClient(userId);
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });

    return NextResponse.json({
      success: true,
      updates: res.data.updates,
    });
  } catch (error: any) {
    console.error('API Sheets POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to append data' }, { status: 500 });
  }
}
