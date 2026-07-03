import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getGmailClient } from '@/lib/google';

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-long-fallback-secret-key-that-is-secure-enough';

// Helper to authenticate user from cookies
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
    const q = searchParams.get('q') || 'is:unread';
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    const gmail = await getGmailClient(userId);
    const res = await gmail.users.messages.list({
      userId: 'me',
      q,
      maxResults,
    });

    const list = res.data.messages || [];
    const emails = await Promise.all(
      list.map(async (msg) => {
        const mRes = await gmail.users.messages.get({ userId: 'me', id: msg.id || '' });
        const headers = mRes.data.payload?.headers || [];
        const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find((h) => h.name === 'Date')?.value || '';
        const snippet = mRes.data.snippet || '';
        
        return {
          id: msg.id,
          from,
          subject,
          date,
          snippet,
        };
      })
    );

    return NextResponse.json({ success: true, count: emails.length, emails });
  } catch (error: any) {
    console.error('API Gmail GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch Gmail messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gmail = await getGmailClient(userId);
    const { to, subject, body, messageId, action } = await request.json();

    if (action === 'reply' && messageId) {
      // Reply action
      const originalMsg = await gmail.users.messages.get({ userId: 'me', id: messageId });
      const headers = originalMsg.data.payload?.headers || [];
      const originalSubject = headers.find((h) => h.name === 'Subject')?.value || 'Re:';
      const subjectLine = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
      const toVal = headers.find((h) => h.name === 'From')?.value || '';
      const threadId = originalMsg.data.threadId || messageId;

      const emailContent = [
        `To: ${toVal}`,
        `Subject: =?utf-8?B?${Buffer.from(subjectLine).toString('base64')}?=`,
        `In-Reply-To: ${messageId}`,
        `References: ${messageId}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        body
      ].join('\n');

      const base64EncodedEmail = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: base64EncodedEmail,
          threadId: threadId,
        },
      });

      return NextResponse.json({ success: true, message: 'Reply sent successfully.' });
    } else if (action === 'archive' && messageId) {
      // Archive action (remove INBOX label)
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: [messageId],
          removeLabelIds: ['INBOX'],
        },
      });
      return NextResponse.json({ success: true, message: 'Message archived.' });
    } else if (action === 'delete' && messageId) {
      // Trash action
      await gmail.users.messages.trash({ userId: 'me', id: messageId });
      return NextResponse.json({ success: true, message: 'Message trashed.' });
    } else {
      // Compose action
      if (!to || !subject || !body) {
        return NextResponse.json({ error: 'Missing to, subject, or body.' }, { status: 400 });
      }

      const emailContent = [
        `To: ${to}`,
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        body
      ].join('\n');

      const base64EncodedEmail = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: base64EncodedEmail,
        },
      });

      return NextResponse.json({ success: true, message: 'Email sent successfully.' });
    }
  } catch (error: any) {
    console.error('API Gmail POST Error:', error);
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}
