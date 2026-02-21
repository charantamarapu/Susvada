const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendOrderNotification(order) {
    if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        console.log('[Telegram] Bot token not configured, skipping notification');
        return null;
    }

    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const address = typeof order.address === 'string' ? JSON.parse(order.address) : order.address;

    const itemsList = items
        .map((item, i) => `  ${i + 1}. ${item.name} × ${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}`)
        .join('\n');

    const message = `🛒 *NEW ORDER RECEIVED*

📋 *Order ID:* \`${order.order_id}\`

*Items:*
${itemsList}

💰 *Subtotal:* ₹${order.subtotal.toFixed(2)}
🚚 *Shipping:* ₹${order.shipping.toFixed(2)}
*💵 Total:* ₹${order.total.toFixed(2)}

🔑 *UTR:* \`${order.utr || 'Not provided'}\`

👤 *Customer:* ${address.name}
📱 *Phone:* ${address.phone}
📅 *Delivery Date:* ${order.delivery_date || 'Standard'}

📍 *Address:*
${address.line1}${address.line2 ? ', ' + address.line2 : ''}
${address.city}, ${address.state} - ${address.pincode}
${address.country || 'India'}

⏳ *Status:* Pending Verification`;

    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: '✅ Confirm Payment', callback_data: `confirm_${order.order_id}` },
                { text: '❌ Reject', callback_data: `reject_${order.order_id}` },
            ],
        ],
    };

    try {
        const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                reply_markup: inlineKeyboard,
            }),
        });

        const data = await res.json();
        if (data.ok) {
            return data.result.message_id.toString();
        } else {
            console.error('[Telegram] Send failed:', data.description);
            return null;
        }
    } catch (err) {
        console.error('[Telegram] Error:', err.message);
        return null;
    }
}

async function answerCallbackQuery(callbackQueryId, text) {
    try {
        await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: text,
            }),
        });
    } catch (err) {
        console.error('[Telegram] Answer callback error:', err.message);
    }
}

async function editMessageText(chatId, messageId, newText) {
    try {
        await fetch(`${TELEGRAM_API}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: parseInt(messageId),
                text: newText,
                parse_mode: 'Markdown',
            }),
        });
    } catch (err) {
        console.error('[Telegram] Edit message error:', err.message);
    }
}

module.exports = {
    sendOrderNotification,
    answerCallbackQuery,
    editMessageText,
    ADMIN_CHAT_ID,
};
