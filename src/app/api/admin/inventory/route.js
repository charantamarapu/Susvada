import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');
const XLSX = require('xlsx');

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const db = getDb();
        const products = db.prepare('SELECT id, name, category, price, stock, shelf_life_days, manufactured_date, status FROM products ORDER BY name').all();

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(products);
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buf, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=susvada_inventory.xlsx',
            },
        });
    } catch (err) {
        console.error('Inventory export error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

        const arrayBuffer = await file.arrayBuffer();
        const wb = XLSX.read(arrayBuffer);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const db = getDb();
        let updated = 0;
        let created = 0;

        const updateStmt = db.prepare('UPDATE products SET stock = ?, price = ?, manufactured_date = ?, shelf_life_days = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const insertStmt = db.prepare(`
      INSERT INTO products (name, slug, category, price, stock, shelf_life_days, manufactured_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `);

        const tx = db.transaction(() => {
            for (const row of data) {
                if (row.id) {
                    updateStmt.run(row.stock || 0, row.price || 0, row.manufactured_date || null, row.shelf_life_days || 30, row.id);
                    updated++;
                } else if (row.name && row.category && row.price) {
                    const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    insertStmt.run(row.name, slug, row.category, row.price, row.stock || 0, row.shelf_life_days || 30, row.manufactured_date || null);
                    created++;
                }
            }
        });

        tx();

        return NextResponse.json({ success: true, updated, created, total: data.length });
    } catch (err) {
        console.error('Inventory import error:', err);
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }
}
