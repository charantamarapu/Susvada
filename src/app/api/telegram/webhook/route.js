import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { answerCallbackQuery, editMessageText, sendMessage, ADMIN_CHAT_ID } = require('@/lib/telegram');

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
            } else if (action === 'shipped') {
                newStatus = 'shipped';
                responseText = `🚚 Order ${orderId} marked as shipped`;
            } else if (action === 'delivered') {
                newStatus = 'delivered';
                responseText = `📦 Order ${orderId} marked as delivered`;
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
            let statusEmoji = '';
            if (action === 'confirm') statusEmoji = '✅ CONFIRMED (Processing)';
            else if (action === 'shipped') statusEmoji = '🚚 SHIPPED';
            else if (action === 'delivered') statusEmoji = '📦 DELIVERED';
            else if (action === 'reject') statusEmoji = '❌ REJECTED (Cancelled)';

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
                // Determine next possible actions for inline keyboard
                let newKeyboard = null;

                if (newStatus === 'processing') {
                    newKeyboard = {
                        inline_keyboard: [
                            [{ text: '🚚 Mark as Shipped', callback_data: `shipped_${orderId}` }]
                        ]
                    };
                } else if (newStatus === 'shipped') {
                    newKeyboard = {
                        inline_keyboard: [
                            [{ text: '📦 Mark as Delivered', callback_data: `delivered_${orderId}` }]
                        ]
                    };
                }

                await editMessageText(ADMIN_CHAT_ID, order.telegram_message_id, updatedMessage, newKeyboard);
            }

            return NextResponse.json({ ok: true });
        }

        // Handle regular messages
        if (body.message && body.message.text) {
            const chatId = body.message.chat.id.toString();
            const text = body.message.text;

            // Only respond to admin
            if (chatId !== ADMIN_CHAT_ID) {
                return NextResponse.json({ ok: true });
            }

            if (text.startsWith('/start')) {
                const welcomeText = `👋 *Welcome to Susvada Admin Bot!*

I am running and ready. You will receive notifications for new orders here.

*Available commands:*
/status - Check bot and store status`;

                const keyboard = {
                    keyboard: [
                        [{ text: '📦 View Pending Orders' }]
                    ],
                    resize_keyboard: true,
                    is_persistent: true
                };

                await sendMessage(chatId, welcomeText, keyboard);
            } else if (text === '/status') {
                await sendMessage(chatId, '✅ Bot is running and connected to the store!');
            } else if (text.includes('View Pending Orders')) {
                const db = getDb();
                const pending = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('pending_verification');
                const processing = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('processing');

                await sendMessage(chatId, `📊 *Order Status*\n\n⏳ Pending Verification: *${pending.count}*\n🔄 Orders to Ship (Processing): *${processing.count}*`);
            } else {
                await sendMessage(chatId, 'I only understand specified commands and button presses.');
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
