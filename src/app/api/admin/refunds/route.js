import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function PATCH(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { refund_id } = await request.json();
        if (!refund_id) return NextResponse.json({ error: 'Refund ID required' }, { status: 400 });

        const db = getDb();
        const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(refund_id);
        if (!refund) return NextResponse.json({ error: 'Refund not found' }, { status: 404 });

        db.prepare('UPDATE refunds SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?').run('processed', refund_id);
        db.prepare('UPDATE orders SET refund_status = ? WHERE order_id = ?').run('processed', refund.order_id);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Refund update error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
