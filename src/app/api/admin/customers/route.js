import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const db = getDb();
        const customers = db.prepare(`
            SELECT 
                u.id, u.name, u.email, u.phone, u.is_blocked, u.created_at,
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.total), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            WHERE u.role = 'customer'
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `).all();

        return NextResponse.json({ customers });
    } catch (err) {
        console.error('Admin customers error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { user_id, is_blocked } = await request.json();
        if (!user_id || is_blocked === undefined) {
            return NextResponse.json({ error: 'user_id and is_blocked are required' }, { status: 400 });
        }

        const db = getDb();
        db.prepare('UPDATE users SET is_blocked = ? WHERE id = ? AND role = ?').run(is_blocked ? 1 : 0, user_id, 'customer');

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Block user error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
