import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const db = getDb();

        const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
        const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_verification'").get().count;
        const processingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'processing'").get().count;
        const shippedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'shipped'").get().count;
        const deliveredOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'").get().count;
        const cancelledOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'").get().count;
        const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status IN ('processing', 'shipped', 'delivered')").get().total;
        const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
        const lowStockProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock < 10 AND status = ?').get('active').count;
        const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;

        // Products nearing expiry (within 7 days)
        const expiringProducts = db.prepare(`
      SELECT id, name, shelf_life_days, manufactured_date
      FROM products
      WHERE manufactured_date IS NOT NULL
        AND status = 'active'
        AND julianday('now') - julianday(manufactured_date) >= shelf_life_days - 7
    `).all();

        // Recent orders
        const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').all().map(o => ({
            ...o,
            items: JSON.parse(o.items),
            address: JSON.parse(o.address),
        }));

        return NextResponse.json({
            stats: {
                totalOrders, pendingOrders, processingOrders, shippedOrders,
                deliveredOrders, cancelledOrders, totalRevenue, totalProducts,
                lowStockProducts, totalCustomers
            },
            expiringProducts,
            recentOrders
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
