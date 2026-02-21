import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, phone, subject, message } = body;

        if (!name || !email || !subject || !message) {
            return NextResponse.json({ error: 'Name, email, subject, and message are required' }, { status: 400 });
        }

        const db = getDb();
        const user = getUserFromRequest(request);

        db.prepare(
            'INSERT INTO support_tickets (user_id, name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(user?.id || null, name, email, phone || null, subject, message);

        return NextResponse.json({ success: true, message: 'Ticket submitted successfully' });
    } catch (err) {
        console.error('Support error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
