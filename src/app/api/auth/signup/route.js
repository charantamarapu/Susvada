import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { hashPassword, generateToken } = require('@/lib/auth');

export async function POST(request) {
    try {
        const { name, email, password, phone } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
        }

        const db = getDb();
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        if (phone) {
            const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
            if (existingPhone) {
                return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
            }
        }

        const password_hash = hashPassword(password);
        const result = db.prepare(
            'INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)'
        ).run(name, email, password_hash, phone || null);

        const user = { id: result.lastInsertRowid, email, role: 'customer', name };
        const token = generateToken(user);

        return NextResponse.json({ token, user: { id: user.id, name, email, phone, role: 'customer' } });
    } catch (err) {
        console.error('Signup error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
