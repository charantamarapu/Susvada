import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { hashPassword, generateToken } = require('@/lib/auth');
import crypto from 'crypto';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/auth/login?error=google_auth_failed', request.url));
    }

    if (!code) {
        return NextResponse.json({ error: 'Authorization code is missing' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    try {
        // 1. Exchange the authorization code for an access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Failed to Google exchange token:', errorData);
            return NextResponse.redirect(new URL('/auth/login?error=google_exchange_failed', request.url));
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Fetch the user's profile information
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!userResponse.ok) {
            console.error('Failed to fetch Google user profile');
            return NextResponse.redirect(new URL('/auth/login?error=google_profile_failed', request.url));
        }

        const profile = await userResponse.json();
        const email = profile.email;
        const name = profile.name;

        if (!email) {
            return NextResponse.redirect(new URL('/auth/login?error=google_email_missing', request.url));
        }

        const db = getDb();

        // 3. Find or create the user in the database
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            // Generate a secure random password since Google users don't have one
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const password_hash = hashPassword(randomPassword);

            const result = db.prepare(
                'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
            ).run(name, email, password_hash);

            user = { id: result.lastInsertRowid, email, role: 'customer', name, is_blocked: 0 };
        } else {
            if (user.is_blocked) {
                return NextResponse.redirect(new URL('/auth/login?error=account_suspended', request.url));
            }
        }

        // 4. Generate our custom JWT token
        const token = generateToken(user);

        // 5. Redirect to the success page to handle token storage on the frontend
        const successUrl = new URL('/auth/google-success', request.url);
        successUrl.searchParams.append('token', token);

        return NextResponse.redirect(successUrl.toString());

    } catch (err) {
        console.error('Google callback error:', err);
        return NextResponse.redirect(new URL('/auth/login?error=google_internal_error', request.url));
    }
}
