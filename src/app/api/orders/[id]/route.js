import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request, { params }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const db = getDb();
        const order = db.prepare('SELECT * FROM orders WHERE order_id = ? AND user_id = ?').get(id, user.id);

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        order.items = JSON.parse(order.items);
        order.address = JSON.parse(order.address);

        return NextResponse.json({ order });
    } catch (err) {
        console.error('Order detail error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { action } = await request.json();

        const db = getDb();
        const order = db.prepare('SELECT * FROM orders WHERE order_id = ? AND user_id = ?').get(id, user.id);

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        if (action === 'cancel') {
            if (order.status !== 'pending_verification') {
                return NextResponse.json({ error: 'Can only cancel pending orders' }, { status: 400 });
            }
            // Restore stock
            const items = JSON.parse(order.items);
            const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
            for (const item of items) {
                updateStock.run(item.quantity, item.id);
            }
            db.prepare("UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?").run(id);
            return NextResponse.json({ success: true, status: 'cancelled' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err) {
        console.error('Order PATCH error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
