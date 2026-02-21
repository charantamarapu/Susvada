'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

const STATUSES = ['pending_verification', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_MAP = {
    pending_verification: { label: 'Pending', class: 'status-pending', icon: '⏳' },
    processing: { label: 'Processing', class: 'status-processing', icon: '🔄' },
    shipped: { label: 'Shipped', class: 'status-shipped', icon: '🚚' },
    delivered: { label: 'Delivered', class: 'status-delivered', icon: '✅' },
    cancelled: { label: 'Cancelled', class: 'status-cancelled', icon: '❌' },
};

export default function AdminOrdersPage() {
    const { apiFetch } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const { toasts, addToast, removeToast } = useToast();

    const fetchOrders = async () => {
        let url = '/api/admin/orders';
        if (filterStatus) url += `?status=${filterStatus}`;
        const res = await apiFetch(url);
        if (res.ok) {
            const data = await res.json();
            setOrders(data.orders);
        }
        setLoading(false);
    };

    useEffect(() => { fetchOrders(); }, [filterStatus]);

    const updateStatus = async (orderId, status) => {
        const res = await apiFetch('/api/admin/orders', {
            method: 'PATCH',
            body: JSON.stringify({ order_id: orderId, status }),
        });
        if (res.ok) {
            addToast(`Order ${orderId} → ${STATUS_MAP[status].label}`);
            fetchOrders();
        } else {
            addToast('Failed to update', 'error');
        }
    };

    return (
        <div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="admin-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Orders</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage all customer orders</p>
                </div>
            </div>

            {/* Status Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button className={`btn btn-sm ${filterStatus === '' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterStatus('')}>All</button>
                {STATUSES.map(s => (
                    <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterStatus(s)}>
                        {STATUS_MAP[s].icon} {STATUS_MAP[s].label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
            ) : orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No orders found</h3>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>UTR</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => {
                            const st = STATUS_MAP[order.status] || STATUS_MAP.pending_verification;
                            return (
                                <tr key={order.id}>
                                    <td><strong>{order.order_id}</strong></td>
                                    <td>
                                        <div>{order.address.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.address.phone}</div>
                                    </td>
                                    <td>
                                        {order.items.map((item, i) => (
                                            <div key={i} style={{ fontSize: '0.85rem' }}>{item.name} ×{item.quantity}</div>
                                        ))}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>₹{order.total.toFixed(2)}</td>
                                    <td><code style={{ fontSize: '0.8rem' }}>{order.utr || 'N/A'}</code></td>
                                    <td><span className={`status-badge ${st.class}`}>{st.icon} {st.label}</span></td>
                                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                                        {order.delivery_date && (
                                            <div style={{ color: 'var(--gold-dark)', fontSize: '0.75rem' }}>
                                                📅 {new Date(order.delivery_date).toLocaleDateString('en-IN')}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                            {order.status === 'pending_verification' && (
                                                <>
                                                    <button className="btn btn-sm btn-primary" onClick={() => updateStatus(order.order_id, 'processing')}>✅ Confirm</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => updateStatus(order.order_id, 'cancelled')}>❌ Reject</button>
                                                </>
                                            )}
                                            {order.status === 'processing' && (
                                                <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(order.order_id, 'shipped')}>🚚 Ship</button>
                                            )}
                                            {order.status === 'shipped' && (
                                                <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white' }} onClick={() => updateStatus(order.order_id, 'delivered')}>✅ Delivered</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
