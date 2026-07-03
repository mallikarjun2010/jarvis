import { google } from 'googleapis';
import { db } from './db';
import { encrypt, decrypt } from './crypt';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000'}/auth/google/callback`;

export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
];

/**
 * Creates a raw OAuth2 Client instance.
 */
export function getOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/**
 * Generates the Google OAuth authentication URL.
 */
export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

/**
 * Exchanges the code from the OAuth callback for access/refresh tokens.
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Retrieves the user's OAuth tokens, automatically refreshing them if expired.
 */
export async function getAuthenticatedClient(userId: string) {
  const tokenRecord = await db.oAuthToken.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!tokenRecord) {
    throw new Error(`No Google OAuth credentials found for user ${userId}`);
  }

  const oauth2Client = getOAuth2Client();
  const decryptedAccessToken = decrypt(tokenRecord.accessToken);
  const decryptedRefreshToken = tokenRecord.refreshToken ? decrypt(tokenRecord.refreshToken) : null;

  oauth2Client.setCredentials({
    access_token: decryptedAccessToken,
    refresh_token: decryptedRefreshToken || undefined,
    expiry_date: tokenRecord.expiryDate.getTime(),
  });

  // Check if token is expired or close to expiry (within 5 minutes)
  const isExpired = Date.now() + 300000 >= tokenRecord.expiryDate.getTime();

  if (isExpired && decryptedRefreshToken) {
    try {
      console.log(`Refreshing access token for user ${userId}...`);
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      const newExpiry = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + (credentials.expires_in || 3600) * 1000);

      // Encrypt and update the token details in database
      await db.oAuthToken.update({
        where: { id: tokenRecord.id },
        data: {
          accessToken: encrypt(credentials.access_token || ''),
          expiryDate: newExpiry,
          // Sometimes Google doesn't return a new refresh token, so reuse the old one
          refreshToken: credentials.refresh_token ? encrypt(credentials.refresh_token) : tokenRecord.refreshToken,
        },
      });

      // Update oauth2Client credentials with newly refreshed ones
      oauth2Client.setCredentials(credentials);
      
      await db.log.create({
        data: {
          userId,
          type: 'GOOGLE_API',
          status: 'INFO',
          message: 'Google OAuth token refreshed successfully.',
        },
      });
    } catch (err: any) {
      console.error('Failed to refresh access token:', err);
      await db.log.create({
        data: {
          userId,
          type: 'GOOGLE_API',
          status: 'ERROR',
          message: `Token refresh failed: ${err.message || err}`,
        },
      });
      throw err;
    }
  }

  return oauth2Client;
}

// Service instantiations
export async function getGmailClient(userId: string) {
  const auth = await getAuthenticatedClient(userId);
  return google.gmail({ version: 'v1', auth });
}

export async function getCalendarClient(userId: string) {
  const auth = await getAuthenticatedClient(userId);
  return google.calendar({ version: 'v3', auth });
}

export async function getSheetsClient(userId: string) {
  const auth = await getAuthenticatedClient(userId);
  return google.sheets({ version: 'v4', auth });
}

export async function getDriveClient(userId: string) {
  const auth = await getAuthenticatedClient(userId);
  return google.drive({ version: 'v3', auth });
}

export async function getDocsClient(userId: string) {
  const auth = await getAuthenticatedClient(userId);
  return google.docs({ version: 'v1', auth });
}
