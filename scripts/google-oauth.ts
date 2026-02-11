#!/usr/bin/env npx tsx
/**
 * One-time OAuth2 flow to get a refresh token for Google APIs.
 *
 * Usage: npx tsx scripts/google-oauth.ts
 *
 * Opens a browser for Google login. After consent, stores the
 * refresh token in .env as GOOGLE_REFRESH_TOKEN.
 */

import { google } from 'googleapis';
import http from 'http';
import open from 'open';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_SECRET_FILE = path.join(
  __dirname, '..',
  'client_secret_670182458553-3tdqmkjruokdv8paeiepgmd869v7ghop.apps.googleusercontent.com.json'
);

// Generous scopes for oilcloth
const SCOPES = [
  // YouTube - full access for publishing
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',

  // Gmail - send, read, compose for oilcloth's email
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',

  // Google Drive - store/share documents, assets
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',

  // Google Calendar - scheduling
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

async function main() {
  // Load client secret
  if (!fs.existsSync(CLIENT_SECRET_FILE)) {
    console.error(`Client secret not found: ${CLIENT_SECRET_FILE}`);
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CLIENT_SECRET_FILE, 'utf-8'));
  const { client_id, client_secret } = credentials.installed;

  // Use localhost redirect for desktop app
  const REDIRECT_URI = 'http://localhost:3333/oauth2callback';

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to always get refresh token
  });

  console.log('\n🔐 Google OAuth2 Authorization');
  console.log('================================');
  console.log(`\nScopes requested (${SCOPES.length}):`);
  SCOPES.forEach(s => console.log(`  • ${s.split('/').pop()}`));
  console.log('\n📋 Open this URL in your browser:\n');
  console.log(authorizeUrl);
  console.log('\n⏳ Waiting for callback on http://localhost:3333 ...\n');

  // Start local server to catch the callback
  const token = await new Promise<any>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url!, `http://localhost:3333`);
        if (url.pathname !== '/oauth2callback') return;

        const code = url.searchParams.get('code');
        if (!code) {
          res.writeHead(400);
          res.end('No authorization code received');
          reject(new Error('No authorization code'));
          return;
        }

        const { tokens } = await oauth2Client.getToken(code);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html><body style="font-family: system-ui; padding: 2em; text-align: center;">
            <h1>✅ Authorization successful</h1>
            <p>You can close this tab. Refresh token has been saved.</p>
          </body></html>
        `);

        server.close();
        resolve(tokens);
      } catch (err) {
        res.writeHead(500);
        res.end('Authorization failed');
        server.close();
        reject(err);
      }
    });

    server.listen(3333, () => {
      console.log('🖥️  Server listening. Complete the auth in your browser.');
      console.log('   (The redirect will come back to localhost:3333)\n');
    });

    // Timeout after 10 minutes for manual flow
    setTimeout(() => {
      server.close();
      reject(new Error('Authorization timed out (10 minutes)'));
    }, 10 * 60 * 1000);
  });

  if (!token.refresh_token) {
    console.error('\n❌ No refresh token received!');
    console.error('This can happen if you previously authorized this app.');
    console.error('Go to https://myaccount.google.com/permissions and revoke access,');
    console.error('then run this script again.\n');
    process.exit(1);
  }

  // Append to .env
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

  // Replace existing or append
  const vars: Record<string, string> = {
    GOOGLE_REFRESH_TOKEN: token.refresh_token,
    GOOGLE_ACCESS_TOKEN: token.access_token || '',
    GOOGLE_TOKEN_EXPIRY: token.expiry_date?.toString() || '',
    GOOGLE_CLIENT_ID: client_id,
    GOOGLE_CLIENT_SECRET: client_secret,
  };

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trimStart());

  console.log('\n✅ Authorization successful!');
  console.log('\nTokens saved to .env:');
  console.log(`  GOOGLE_REFRESH_TOKEN=${token.refresh_token.substring(0, 20)}...`);
  console.log(`  GOOGLE_CLIENT_ID=${client_id.substring(0, 20)}...`);
  console.log(`  GOOGLE_CLIENT_SECRET=***`);
  console.log('\nScopes authorized:');
  (token.scope || SCOPES.join(' ')).split(' ').forEach((s: string) => {
    console.log(`  ✓ ${s.split('/').pop()}`);
  });
  console.log('\n🔒 Move OAuth consent screen to Production mode to prevent');
  console.log('   refresh token from expiring every 7 days.\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
