import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

// GET reviews for a product (public)
export async function GET(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;

        let productId = id;
        if (isNaN(id)) {
            const product = db.prepare('SELECT id FROM products WHERE slug = ?').get(id);
            if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            productId = product.id;
        }

        const reviews = db.prepare(`
            SELECT r.id, r.rating, r.review_text, r.created_at, u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        `).all(parseInt(productId));

        const stats = db.prepare(`
            SELECT COUNT(*) as count, ROUND(AVG(rating), 1) as avg_rating
            FROM reviews WHERE product_id = ?
        `).get(parseInt(productId));

        return NextResponse.json({
            reviews,
            avg_rating: stats.avg_rating || 0,
            review_count: stats.count || 0,
        });
    } catch (err) {
        console.error('Reviews GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST a review (authenticated, must have delivered order with this product)
export async function POST(request, { params }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Please log in to write a review' }, { status: 401 });

        const db = getDb();
        const { id } = await params;

        let productId = parseInt(id);
        if (isNaN(id)) {
            const product = db.prepare('SELECT id FROM products WHERE slug = ?').get(id);
            if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            productId = product.id;
        }

        const { rating, review_text } = await request.json();

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        // Check if user has a delivered order containing this product
        const deliveredOrders = db.prepare(
            "SELECT items FROM orders WHERE user_id = ? AND status = 'delivered'"
        ).all(user.id);

        const hasPurchased = deliveredOrders.some(order => {
            const items = JSON.parse(order.items);
            return items.some(item => item.id === productId);
        });

        if (!hasPurchased) {
            return NextResponse.json({ error: 'You can only review products you have purchased and received' }, { status: 403 });
        }

        // Check if already reviewed
        const existing = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?').get(user.id, productId);
        if (existing) {
            return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
        }

        db.prepare(
            'INSERT INTO reviews (user_id, product_id, rating, review_text) VALUES (?, ?, ?, ?)'
        ).run(user.id, productId, rating, review_text || null);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Review POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
