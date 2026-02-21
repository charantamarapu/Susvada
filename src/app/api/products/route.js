import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const status = searchParams.get('status') || 'active';

        let query = 'SELECT * FROM products WHERE status = ?';
        const params = [status];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const products = db.prepare(query).all(...params);

        // Parse JSON fields
        const parsed = products.map(p => ({
            ...p,
            images: JSON.parse(p.images || '[]'),
            tags: JSON.parse(p.tags || '[]'),
        }));

        return NextResponse.json({ products: parsed });
    } catch (err) {
        console.error('Products error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
