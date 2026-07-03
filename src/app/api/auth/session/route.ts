import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-long-fallback-secret-key-that-is-secure-enough';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('jarvis_session');

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(sessionCookie.value, JWT_SECRET);
    } catch (e) {
      // Invalid or expired token
      return NextResponse.json({ authenticated: false, reason: 'invalid_token' }, { status: 401 });
    }

    // Load full user details with settings and check for active API token
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: {
        settings: true,
        tokens: {
          select: {
            expiryDate: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, reason: 'user_not_found' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        settings: user.settings,
        hasGoogleAuth: user.tokens.length > 0,
      },
    });
  } catch (error: any) {
    console.error('Session API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('jarvis_session');

    if (sessionCookie) {
      // Clear cookie
      cookieStore.delete('jarvis_session');
      
      // Delete session from DB
      await db.session.deleteMany({
        where: { token: sessionCookie.value },
      });
    }

    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
