import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

// GET user's subscriptions
export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        const subscriptions = db.prepare(`
            SELECT s.*, p.name as product_name, p.price as product_price, p.hero_image, p.weight, p.unit, p.slug
            FROM subscriptions s
            JOIN products p ON s.product_id = p.id
            WHERE s.user_id = ? AND s.status != 'cancelled'
            ORDER BY s.created_at DESC
        `).all(user.id);

        return NextResponse.json({ subscriptions });
    } catch (err) {
        console.error('Subscriptions GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST create subscription
export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        const { product_id, frequency, quantity } = await request.json();

        if (!product_id || !frequency) {
            return NextResponse.json({ error: 'Product and frequency required' }, { status: 400 });
        }

        if (!['monthly', 'bimonthly', 'quarterly'].includes(frequency)) {
            return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
        }

        const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_subscribable = 1').get(product_id);
        if (!product) {
            return NextResponse.json({ error: 'Product not available for subscription' }, { status: 400 });
        }

        // Check if already subscribed (active or paused)
        const existing = db.prepare(
            "SELECT id FROM subscriptions WHERE user_id = ? AND product_id = ? AND status IN ('active', 'paused')"
        ).get(user.id, product_id);
        if (existing) {
            return NextResponse.json({ error: 'You already have an active subscription for this product' }, { status: 400 });
        }

        // Calculate next delivery (30 days from now for monthly, etc.)
        const now = new Date();
        const daysMap = { monthly: 30, bimonthly: 60, quarterly: 90 };
        now.setDate(now.getDate() + daysMap[frequency]);
        const nextDelivery = now.toISOString().split('T')[0];

        db.prepare(
            'INSERT INTO subscriptions (user_id, product_id, frequency, quantity, next_delivery) VALUES (?, ?, ?, ?, ?)'
        ).run(user.id, product_id, frequency, quantity || 1, nextDelivery);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Subscription POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT update subscription (pause/resume/change frequency)
export async function PUT(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        const { id, action, frequency } = await request.json();

        const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(id, user.id);
        if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

        if (action === 'pause') {
            db.prepare("UPDATE subscriptions SET status = 'paused' WHERE id = ?").run(id);
        } else if (action === 'resume') {
            db.prepare("UPDATE subscriptions SET status = 'active' WHERE id = ?").run(id);
        } else if (action === 'update' && frequency) {
            if (!['monthly', 'bimonthly', 'quarterly'].includes(frequency)) {
                return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
            }
            db.prepare('UPDATE subscriptions SET frequency = ? WHERE id = ?').run(frequency, id);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Subscription PUT error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE cancel subscription
export async function DELETE(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const db = getDb();
        const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(parseInt(id), user.id);
        if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

        db.prepare("UPDATE subscriptions SET status = 'cancelled' WHERE id = ?").run(parseInt(id));

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Subscription DELETE error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
