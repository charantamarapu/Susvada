import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(user.id);

        return NextResponse.json({ addresses });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { label, name, phone, line1, line2, city, state, pincode, country, is_default } = await request.json();

        if (!name || !phone || !line1 || !city || !state || !pincode) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
        }

        const db = getDb();

        if (is_default) {
            db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.id);
        }

        const result = db.prepare(`
      INSERT INTO addresses (user_id, label, name, phone, line1, line2, city, state, pincode, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, label || 'Home', name, phone, line1, line2 || '', city, state, pincode, country || 'India', is_default ? 1 : 0);

        return NextResponse.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, label, name, phone, line1, line2, city, state, pincode, country, is_default } = await request.json();

        if (!id) return NextResponse.json({ error: 'Address ID required' }, { status: 400 });

        const db = getDb();
        const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, user.id);
        if (!addr) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

        if (is_default) {
            db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.id);
        }

        db.prepare(`
      UPDATE addresses SET label=?, name=?, phone=?, line1=?, line2=?, city=?, state=?, pincode=?, country=?, is_default=?
      WHERE id = ? AND user_id = ?
    `).run(label || 'Home', name, phone, line1, line2 || '', city, state, pincode, country || 'India', is_default ? 1 : 0, id, user.id);

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Address ID required' }, { status: 400 });

        const db = getDb();
        db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(parseInt(id), user.id);

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
