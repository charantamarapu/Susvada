import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');

export async function GET(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;

        let product;
        if (isNaN(id)) {
            product = db.prepare('SELECT * FROM products WHERE slug = ?').get(id);
        } else {
            product = db.prepare('SELECT * FROM products WHERE id = ?').get(parseInt(id));
        }

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        product.images = JSON.parse(product.images || '[]');
        product.tags = JSON.parse(product.tags || '[]');

        const stats = db.prepare('SELECT COUNT(*) as review_count, ROUND(AVG(rating), 1) as avg_rating FROM reviews WHERE product_id = ?').get(product.id);
        product.avg_rating = stats.avg_rating || 0;
        product.review_count = stats.review_count || 0;

        return NextResponse.json({ product });
    } catch (err) {
        console.error('Product detail error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
