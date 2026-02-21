import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

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
