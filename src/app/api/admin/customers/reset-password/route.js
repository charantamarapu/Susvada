import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest, hashPassword } = require('@/lib/auth');

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { user_id } = await request.json();
        if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

        const db = getDb();
        const customer = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(user_id, 'customer');
        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        // Generate a random temporary password
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let tempPassword = '';
        for (let i = 0; i < 8; i++) {
            tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const password_hash = hashPassword(tempPassword);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, user_id);

        return NextResponse.json({ success: true, temp_password: tempPassword });
    } catch (err) {
        console.error('Reset password error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
