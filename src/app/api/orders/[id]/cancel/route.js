import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');
const { sendMessage, ADMIN_CHAT_ID } = require('@/lib/telegram');

export async function POST(request, { params }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const orderId = params.id;
        const { reason, payment_details } = await request.json();

        if (!reason || !payment_details) {
            return NextResponse.json({ error: 'Reason and payment details (UPI/Bank) are required' }, { status: 400 });
        }

        const db = getDb();
        const order = db.prepare('SELECT * FROM orders WHERE order_id = ? AND user_id = ?').get(orderId, user.id);

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        if (order.status === 'cancelled') return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
        if (order.status === 'shipped' || order.status === 'delivered') {
            return NextResponse.json({ error: 'Shipped orders cannot be cancelled' }, { status: 400 });
        }

        const items = JSON.parse(order.items);
        const address = JSON.parse(order.address);

        // Determine if order has pre-order/out-of-stock items or is international
        const isInternational = address.country && address.country.toLowerCase() !== 'india';

        // Find if any item was a pre-order or had stock issues at time of order
        // (For simplicity in this calculation, we parse the DB product fields)
        let hasSpecialItems = isInternational;

        for (const item of items) {
            const product = db.prepare('SELECT is_preorder FROM products WHERE id = ?').get(item.id);
            if (product && product.is_preorder) {
                hasSpecialItems = true;
                break;
            }
        }

        // Calculate refund percentage based on rules
        let refundPercentage = 0;

        if (order.status === 'pending_verification') {
            refundPercentage = 100;
        } else if (order.status === 'processing') {
            refundPercentage = 75; // 75% for processing, regardless of domestic or special
        }

        const refundAmount = (order.total * refundPercentage) / 100;

        db.transaction(() => {
            // Update order status
            db.prepare(`
                UPDATE orders 
                SET status = 'cancelled', 
                    cancel_reason = ?, 
                    refund_status = ?, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE order_id = ?
            `).run(reason, refundPercentage > 0 ? 'pending' : 'none', orderId);

            // Restore stock
            const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
            for (const item of items) {
                updateStock.run(item.quantity, item.id);
            }

            // Create refund record if eligible
            if (refundPercentage > 0) {
                db.prepare(`
                    INSERT INTO refunds (order_id, user_id, amount, percentage, payment_details) 
                    VALUES (?, ?, ?, ?, ?)
                `).run(orderId, user.id, refundAmount, refundPercentage, payment_details);
            }
        })();

        // Notify Admin via Telegram
        if (process.env.TELEGRAM_BOT_TOKEN) {
            const msg = `⚠️ *ORDER CANCELLED BY CUSTOMER*

📋 *Order:* \`${orderId}\`
👤 *Customer:* ${user.name}
📝 *Reason:* ${reason}

💸 *Refund Due:* ₹${refundAmount.toFixed(2)} (${refundPercentage}%)
🏦 *Refund Details:* \`${payment_details}\`

To process this refund, visit the Admin Dashboard.`;

            await sendMessage(ADMIN_CHAT_ID, msg);
        }

        return NextResponse.json({
            success: true,
            refund_amount: refundAmount,
            refund_percentage: refundPercentage
        });

    } catch (err) {
        console.error('Cancellation error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
