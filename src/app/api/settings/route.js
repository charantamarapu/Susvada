import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');

// Public endpoint — returns only non-sensitive settings
export async function GET() {
    try {
        const db = getDb();
        const settings = db.prepare('SELECT * FROM settings').all();
        const obj = {};
        settings.forEach(s => { obj[s.key] = s.value; });

        // Only expose safe keys
        const publicSettings = {
            min_free_delivery: obj.min_free_delivery || '500',
            domestic_shipping: obj.domestic_shipping || '60',
            international_shipping: obj.international_shipping || '500',
        };

        return NextResponse.json({ settings: publicSettings });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
