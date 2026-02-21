import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');
const { v4: uuidv4 } = require('uuid');
const { sendOrderNotification } = require('@/lib/telegram');

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        const orders = db.prepare(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
        ).all(user.id);

        const parsed = orders.map(o => ({
            ...o,
            items: JSON.parse(o.items),
            address: JSON.parse(o.address),
        }));

        return NextResponse.json({ orders: parsed });
    } catch (err) {
        console.error('Orders GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { address, delivery_date, notes, utr } = await request.json();

        if (!address) return NextResponse.json({ error: 'Delivery address required' }, { status: 400 });
        if (!utr || utr.length < 10) return NextResponse.json({ error: 'Valid UTR (min 10 digits) required' }, { status: 400 });

        const db = getDb();

        // Get cart items
        const cartItems = db.prepare(`
      SELECT ci.quantity, p.id, p.name, p.price, p.stock, p.hero_image, p.weight, p.unit
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(user.id);

        if (cartItems.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

        // Check stock
        for (const item of cartItems) {
            if (item.quantity > item.stock) {
                return NextResponse.json({ error: `${item.name} has insufficient stock` }, { status: 400 });
            }
        }

        const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const minFreeDelivery = parseFloat(db.prepare("SELECT value FROM settings WHERE key = ?").get('min_free_delivery')?.value || '500');
        const domesticShipping = parseFloat(db.prepare("SELECT value FROM settings WHERE key = ?").get('domestic_shipping')?.value || '60');
        const isInternational = address.country && address.country.toLowerCase() !== 'india';
        const intlShipping = parseFloat(db.prepare("SELECT value FROM settings WHERE key = ?").get('international_shipping')?.value || '500');

        let shipping = 0;
        if (isInternational) {
            shipping = intlShipping;
        } else if (subtotal < minFreeDelivery) {
            shipping = domesticShipping;
        }

        const total = subtotal + shipping;
        const orderId = 'SUS-' + uuidv4().split('-')[0].toUpperCase();

        const items = cartItems.map(ci => ({
            id: ci.id,
            name: ci.name,
            price: ci.price,
            quantity: ci.quantity,
            hero_image: ci.hero_image,
            weight: ci.weight,
            unit: ci.unit,
        }));

        // Insert order
        const result = db.prepare(`
      INSERT INTO orders (order_id, user_id, items, subtotal, shipping, total, utr, delivery_date, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            orderId, user.id, JSON.stringify(items), subtotal, shipping, total,
            utr, delivery_date || null, JSON.stringify(address), notes || null
        );

        // Decrease stock
        const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
        for (const item of cartItems) {
            updateStock.run(item.quantity, item.id);
        }

        // Clear cart
        db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(user.id);

        // Send Telegram notification
        const order = {
            order_id: orderId,
            items,
            subtotal,
            shipping,
            total,
            utr,
            delivery_date,
            address,
        };

        const telegramMsgId = await sendOrderNotification(order);
        if (telegramMsgId) {
            db.prepare('UPDATE orders SET telegram_message_id = ? WHERE order_id = ?').run(telegramMsgId, orderId);
        }

        return NextResponse.json({
            success: true,
            order: { order_id: orderId, total, status: 'pending_verification' }
        });
    } catch (err) {
        console.error('Order POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
