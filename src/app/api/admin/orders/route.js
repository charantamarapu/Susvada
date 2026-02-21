import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const db = getDb();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = 'SELECT * FROM orders';
        const params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const orders = db.prepare(query).all(...params);
        const parsed = orders.map(o => ({
            ...o,
            items: JSON.parse(o.items),
            address: JSON.parse(o.address),
        }));

        return NextResponse.json({ orders: parsed });
    } catch (err) {
        console.error('Admin orders error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { order_id, status } = await request.json();
        const validStatuses = ['pending_verification', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!order_id || !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid order_id or status' }, { status: 400 });
        }

        const db = getDb();
        const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(order_id);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // If cancelling, restore stock
        if (status === 'cancelled' && order.status !== 'cancelled') {
            const items = JSON.parse(order.items);
            const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
            for (const item of items) {
                updateStock.run(item.quantity, item.id);
            }
        }

        db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?').run(status, order_id);

        return NextResponse.json({ success: true, status });
    } catch (err) {
        console.error('Admin order update error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
