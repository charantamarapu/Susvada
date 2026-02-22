import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

// GET all reviews (admin)
export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const db = getDb();
        const reviews = db.prepare(`
            SELECT r.id, r.rating, r.review_text, r.created_at,
                   u.name as user_name, u.email as user_email,
                   p.name as product_name, p.id as product_id
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN products p ON r.product_id = p.id
            ORDER BY r.created_at DESC
        `).all();

        return NextResponse.json({ reviews });
    } catch (err) {
        console.error('Admin reviews GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE a review (admin)
export async function DELETE(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Review ID required' }, { status: 400 });

        const db = getDb();
        db.prepare('DELETE FROM reviews WHERE id = ?').run(parseInt(id));

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin review DELETE error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
