import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        const items = db.prepare(`
      SELECT ci.id, ci.quantity, ci.product_id,
             p.name, p.price, p.compare_price, p.hero_image, p.stock, p.weight, p.unit, p.slug
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(user.id);

        return NextResponse.json({ items });
    } catch (err) {
        console.error('Cart GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { product_id, quantity = 1 } = await request.json();
        if (!product_id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

        const db = getDb();
        const product = db.prepare('SELECT id, stock FROM products WHERE id = ? AND status = ?').get(product_id, 'active');
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(user.id, product_id);

        if (existing) {
            const newQty = existing.quantity + quantity;
            if (newQty > product.stock) return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
            db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
        } else {
            if (quantity > product.stock) return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
            db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(user.id, product_id, quantity);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Cart POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { product_id, quantity } = await request.json();
        if (!product_id || quantity === undefined) return NextResponse.json({ error: 'Product ID and quantity required' }, { status: 400 });

        const db = getDb();

        if (quantity <= 0) {
            db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(user.id, product_id);
        } else {
            const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(product_id);
            if (quantity > product.stock) return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
            db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?').run(quantity, user.id, product_id);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Cart PUT error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        const db = getDb();
        if (productId) {
            db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(user.id, parseInt(productId));
        } else {
            db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(user.id);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Cart DELETE error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
