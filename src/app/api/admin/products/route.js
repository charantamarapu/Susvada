import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');
const fs = require('fs');
const path = require('path');

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const db = getDb();
        const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
        const parsed = products.map(p => ({
            ...p,
            images: JSON.parse(p.images || '[]'),
            tags: JSON.parse(p.tags || '[]'),
        }));

        return NextResponse.json({ products: parsed });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const {
            name, description, short_description, category, price, compare_price,
            weight, unit, shelf_life_days, manufactured_date, is_preorder, preorder_date,
            stock, status, hero_image, images, tags, shipping_scope, is_subscribable
        } = body;

        if (!name || !category || !price) {
            return NextResponse.json({ error: 'Name, category, and price required' }, { status: 400 });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const db = getDb();
        const result = db.prepare(`
      INSERT INTO products (name, slug, description, short_description, category, price, compare_price,
        weight, unit, shelf_life_days, manufactured_date, is_preorder, preorder_date,
        stock, status, hero_image, images, tags, shipping_scope, is_subscribable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            name, slug, description || '', short_description || '', category, price, compare_price || null,
            weight || '', unit || 'g', shelf_life_days || 30, manufactured_date || null,
            is_preorder ? 1 : 0, preorder_date || null, stock || 0, status || 'active',
            hero_image || '', JSON.stringify(images || []), JSON.stringify(tags || []),
            shipping_scope || 'exportable', is_subscribable ? 1 : 0
        );

        return NextResponse.json({ success: true, id: result.lastInsertRowid, slug });
    } catch (err) {
        console.error('Admin product create error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { id, ...fields } = body;

        if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

        const db = getDb();
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const updates = [];
        const params = [];

        const allowedFields = [
            'name', 'description', 'short_description', 'category', 'price', 'compare_price',
            'weight', 'unit', 'shelf_life_days', 'manufactured_date', 'is_preorder', 'preorder_date',
            'stock', 'status', 'hero_image', 'shipping_scope', 'is_subscribable'
        ];

        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push((field === 'is_preorder' || field === 'is_subscribable') ? (fields[field] ? 1 : 0) : fields[field]);
            }
        }

        if (fields.images) { updates.push('images = ?'); params.push(JSON.stringify(fields.images)); }
        if (fields.tags) { updates.push('tags = ?'); params.push(JSON.stringify(fields.tags)); }
        if (fields.name) { updates.push('slug = ?'); params.push(fields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin product update error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

        const db = getDb();
        db.prepare('DELETE FROM products WHERE id = ?').run(parseInt(id));

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
