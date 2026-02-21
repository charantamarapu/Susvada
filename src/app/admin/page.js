'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

const STATUS_MAP = {
    pending_verification: { label: 'Pending', class: 'status-pending', icon: '⏳' },
    processing: { label: 'Processing', class: 'status-processing', icon: '🔄' },
    shipped: { label: 'Shipped', class: 'status-shipped', icon: '🚚' },
    delivered: { label: 'Delivered', class: 'status-delivered', icon: '✅' },
    cancelled: { label: 'Cancelled', class: 'status-cancelled', icon: '❌' },
};

export default function AdminDashboard() {
    const { apiFetch } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/admin/dashboard')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>;
    if (!data) return <p>Failed to load dashboard</p>;

    const { stats } = data;

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Welcome to Susvada Admin</p>
                </div>
            </div>

            <div className="admin-stat-grid">
                <div className="admin-stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(197,165,90,0.15)', color: 'var(--gold-dark)' }}>📦</div>
                    <div className="stat-value">{stats.totalOrders}</div>
                    <div className="stat-label">Total Orders</div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon" style={{ background: '#FEF3CD', color: '#856404' }}>⏳</div>
                    <div className="stat-value">{stats.pendingOrders}</div>
                    <div className="stat-label">Pending Verification</div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon" style={{ background: '#D4EDDA', color: '#155724' }}>💰</div>
                    <div className="stat-value">₹{stats.totalRevenue.toFixed(0)}</div>
                    <div className="stat-label">Revenue</div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon" style={{ background: '#CCE5FF', color: '#004085' }}>🏷️</div>
                    <div className="stat-value">{stats.totalProducts}</div>
                    <div className="stat-label">Products</div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon" style={{ background: '#F8D7DA', color: '#721C24' }}>⚠️</div>
                    <div className="stat-value">{stats.lowStockProducts}</div>
                    <div className="stat-label">Low Stock</div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon" style={{ background: '#D1ECF1', color: '#0C5460' }}>👤</div>
                    <div className="stat-value">{stats.totalCustomers}</div>
                    <div className="stat-label">Customers</div>
                </div>
            </div>

            {/* Recent Orders */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Recent Orders</h3>
                    <Link href="/admin/orders" className="btn btn-sm btn-outline">View All →</Link>
                </div>
                {data.recentOrders.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No orders yet</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>UTR</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentOrders.map(order => {
                                const st = STATUS_MAP[order.status] || STATUS_MAP.pending_verification;
                                return (
                                    <tr key={order.id}>
                                        <td><strong>{order.order_id}</strong></td>
                                        <td>{order.address.name}</td>
                                        <td>₹{order.total.toFixed(2)}</td>
                                        <td><code style={{ fontSize: '0.8rem' }}>{order.utr || 'N/A'}</code></td>
                                        <td><span className={`status-badge ${st.class}`}>{st.icon} {st.label}</span></td>
                                        <td style={{ fontSize: '0.85rem' }}>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Expiring Products */}
            {data.expiringProducts.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: '1rem' }}>⚠️ Products Nearing Expiry</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {data.expiringProducts.map(p => (
                            <div key={p.id} className="card" style={{ padding: '1rem', minWidth: '200px', borderLeft: '4px solid var(--warning)' }}>
                                <strong>{p.name}</strong>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Shelf life: {p.shelf_life_days} days
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
