import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDocsClient, getDriveClient } from '@/lib/google';

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
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    const docs = await getDocsClient(userId);
    const docRes = await docs.documents.get({ documentId });

    // Extract raw text
    let content = '';
    const bodyParts = docRes.data.body?.content || [];
    for (const item of bodyParts) {
      if (item.paragraph) {
        const elements = item.paragraph.elements || [];
        for (const el of elements) {
          if (el.textRun?.content) {
            content += el.textRun.content;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      title: docRes.data.title,
      content,
    });
  } catch (error: any) {
    console.error('API Docs GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to read document' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    const docs = await getDocsClient(userId);
    const drive = await getDriveClient(userId);

    const doc = await docs.documents.create({
      requestBody: { title },
    });

    const docId = doc.data.documentId;
    if (!docId) {
      throw new Error('Google Doc creation returned empty document ID');
    }

    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      },
    });

    const fileMeta = await drive.files.get({ fileId: docId, fields: 'webViewLink' });

    return NextResponse.json({
      success: true,
      documentId: docId,
      title,
      webViewLink: fileMeta.data.webViewLink,
    });
  } catch (error: any) {
    console.error('API Docs POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create document' }, { status: 500 });
  }
}
