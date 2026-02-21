import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { answerCallbackQuery, editMessageText, ADMIN_CHAT_ID } = require('@/lib/telegram');

export async function POST(request) {
    try {
        const body = await request.json();

        // Handle callback query from inline buttons
        if (body.callback_query) {
            const query = body.callback_query;
            const data = query.data;
            const callbackQueryId = query.id;

            if (!data) {
                await answerCallbackQuery(callbackQueryId, 'Invalid action');
                return NextResponse.json({ ok: true });
            }

            const [action, ...orderParts] = data.split('_');
            const orderId = orderParts.join('_');

            if (!orderId) {
                await answerCallbackQuery(callbackQueryId, 'Invalid order ID');
                return NextResponse.json({ ok: true });
            }

            const db = getDb();
            const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);

            if (!order) {
                await answerCallbackQuery(callbackQueryId, 'Order not found');
                return NextResponse.json({ ok: true });
            }

            let newStatus;
            let responseText;

            if (action === 'confirm') {
                newStatus = 'processing';
                responseText = `✅ Payment confirmed for ${orderId}`;
            } else if (action === 'reject') {
                newStatus = 'cancelled';
                responseText = `❌ Payment rejected for ${orderId}`;

                // Restore stock on rejection
                const items = JSON.parse(order.items);
                const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
                for (const item of items) {
                    updateStock.run(item.quantity, item.id);
                }
            } else {
                await answerCallbackQuery(callbackQueryId, 'Unknown action');
                return NextResponse.json({ ok: true });
            }

            db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?').run(newStatus, orderId);

            // Answer the callback
            await answerCallbackQuery(callbackQueryId, responseText);

            // Edit original message to show result
            const statusEmoji = action === 'confirm' ? '✅ CONFIRMED' : '❌ REJECTED';
            const items = JSON.parse(order.items);
            const address = JSON.parse(order.address);

            const updatedMessage = `🛒 *ORDER ${statusEmoji}*

📋 *Order ID:* \`${orderId}\`
💵 *Total:* ₹${order.total.toFixed(2)}
🔑 *UTR:* \`${order.utr || 'N/A'}\`
👤 *Customer:* ${address.name}
📱 *Phone:* ${address.phone}

*Status updated to:* ${newStatus.toUpperCase()}`;

            if (order.telegram_message_id) {
                await editMessageText(ADMIN_CHAT_ID, order.telegram_message_id, updatedMessage);
            }

            return NextResponse.json({ ok: true });
        }

        // Handle other updates (optional)
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('Telegram webhook error:', err);
        return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }
}

// Telegram sends GET to verify webhook
export async function GET() {
    return NextResponse.json({ status: 'Webhook active' });
}
