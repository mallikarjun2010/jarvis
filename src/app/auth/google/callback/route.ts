import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { getOAuth2Client, getTokensFromCode } from '@/lib/google';
import { encrypt } from '@/lib/crypt';

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-long-fallback-secret-key-that-is-secure-enough';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000'}/?error=no_code`);
    }

    // 1. Get tokens from auth code
    const tokens = await getTokensFromCode(code);
    
    // 2. Fetch user profile from Google using the token
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const profile = await oauth2.userinfo.get();
    
    const email = profile.data.email;
    const name = profile.data.name || 'Mallikarjun';
    const avatar = profile.data.picture || null;

    if (!email) {
      throw new Error('Google OAuth failed to return user email.');
    }

    // 3. Upsert User in database
    let user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name,
          avatar,
          settings: {
            create: {
              voiceOutput: true,
              autoDigest: true,
            },
          },
        },
      });
    } else {
      user = await db.user.update({
        where: { id: user.id },
        data: { name, avatar },
      });
    }

    // 4. Save/Update encrypted OAuth Tokens
    const expiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

    // Delete existing tokens
    await db.oAuthToken.deleteMany({
      where: { userId: user.id },
    });

    await db.oAuthToken.create({
      data: {
        userId: user.id,
        accessToken: encrypt(tokens.access_token || ''),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expiryDate: expiry,
        scopes: tokens.scope || '',
        tokenType: tokens.token_type || 'Bearer',
      },
    });

    // 5. Generate session JWT and store in cookies
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save session in DB
    await db.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days
      },
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('jarvis_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 3600, // 7 days
    });

    await db.log.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        status: 'INFO',
        message: `User ${email} logged in successfully via OAuth.`,
      },
    });

    // Redirect to home dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000'}/`);
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000'}/?error=auth_failed&msg=${encodeURIComponent(
        error.message || ''
      )}`
    );
  }
}
