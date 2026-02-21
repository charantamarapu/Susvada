import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { verifyPassword, generateToken } = require('@/lib/auth');

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user || !verifyPassword(password, user.password_hash)) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        if (user.is_blocked) {
            return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
        }

        const token = generateToken(user);

        return NextResponse.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
        });
    } catch (err) {
        console.error('Login error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
