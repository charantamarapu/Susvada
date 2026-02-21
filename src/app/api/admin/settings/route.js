import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const db = getDb();
        const settings = db.prepare('SELECT * FROM settings').all();
        const obj = {};
        settings.forEach(s => { obj[s.key] = s.value; });

        return NextResponse.json({ settings: obj });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const updates = await request.json();
        const db = getDb();

        const upsert = db.prepare(
            'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP'
        );

        const tx = db.transaction(() => {
            for (const [key, value] of Object.entries(updates)) {
                upsert.run(key, String(value), String(value));
            }
        });

        tx();

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
