import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDriveClient } from '@/lib/google';

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
    const q = searchParams.get('q') || undefined;
    const maxResults = parseInt(searchParams.get('maxResults') || '20');

    const drive = await getDriveClient(userId);
    const res = await drive.files.list({
      q,
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, createdTime, size)',
    });

    return NextResponse.json({ success: true, files: res.data.files || [] });
  } catch (error: any) {
    console.error('API Drive GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to retrieve Drive files' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    const drive = await getDriveClient(userId);
    await drive.files.delete({ fileId });

    return NextResponse.json({ success: true, message: 'File deleted.' });
  } catch (error: any) {
    console.error('API Drive DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete file' }, { status: 500 });
  }
}
