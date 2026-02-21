import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest, requireAuth } = require('@/lib/auth');

export async function GET(request) {
    try {
        const payload = getUserFromRequest(request);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(payload.id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (err) {
        console.error('Me error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const payload = requireAuth(request);
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        // Basic phone validation
        const phoneRegex = /^[0-9+\s-]{10,15}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
        }

        const db = getDb();

        // Check if phone number is already taken by another user
        const existing = db.prepare('SELECT id FROM users WHERE phone = ? AND id != ?').get(phone, payload.id);
        if (existing) {
            return NextResponse.json({ error: 'Phone number already in use' }, { status: 409 });
        }

        db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone, payload.id);

        return NextResponse.json({ success: true, message: 'Phone number updated successfully' });
    } catch (err) {
        if (err.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Update profile error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
