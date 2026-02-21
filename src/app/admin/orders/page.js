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

function TrackingIdDisplay({ trackingId }) {
    const [copied, setCopied] = useState(false);
    return (
        <code
            style={{ cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid rgba(197,165,90,0.3)', padding: '0.15rem 0.4rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => {
                navigator.clipboard.writeText(trackingId);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
            title="Click to copy tracking ID"
        >
            {trackingId} <span style={{ fontSize: '0.8rem' }}>{copied ? '✅' : '📋'}</span>
        </code>
    );
}

export default function AdminOrdersPage() {
    const { apiFetch } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const { toasts, addToast, removeToast } = useToast();
    const [refunds, setRefunds] = useState([]);

    // Shipped modal state
    const [shipModal, setShipModal] = useState(null); // order_id
    const [trackingId, setTrackingId] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');

    const fetchOrders = async () => {
        let url = '/api/admin/orders';
        if (filterStatus) url += `?status=${filterStatus}`;
        const res = await apiFetch(url);
        if (res.ok) {
            const data = await res.json();
            setOrders(data.orders);
            if (data.refunds) setRefunds(data.refunds);
        }
        setLoading(false);
    };

    useEffect(() => { fetchOrders(); }, [filterStatus]);

    const updateStatus = async (orderId, status, extraData = {}) => {
        const res = await apiFetch('/api/admin/orders', {
            method: 'PATCH',
            body: JSON.stringify({ order_id: orderId, status, ...extraData }),
        });
        if (res.ok) {
            addToast(`Order ${orderId} → ${STATUS_MAP[status].label}`);
            fetchOrders();
        } else {
            addToast('Failed to update', 'error');
        }
    };

    const handleStatusChange = (orderId, newStatus) => {
        if (newStatus === 'shipped') {
            setShipModal(orderId);
            setTrackingId('');
            setTrackingUrl('');
        } else {
            updateStatus(orderId, newStatus);
        }
    };

    const submitShipped = () => {
        updateStatus(shipModal, 'shipped', {
            tracking_id: trackingId,
            tracking_url: trackingUrl,
        });
        setShipModal(null);
    };

    const markRefundProcessed = async (refundId) => {
        const res = await apiFetch('/api/admin/refunds', {
            method: 'PATCH',
            body: JSON.stringify({ refund_id: refundId }),
        });
        if (res.ok) {
            addToast('Refund marked as processed ✅');
            fetchOrders();
        } else {
            addToast('Failed to update refund', 'error');
        }
    };

    const getRefund = (orderId) => refunds.find(r => r.order_id === orderId);

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
                            const refund = getRefund(order.order_id);
                            return (
                                <tr key={order.id}>
                                    <td>
                                        <strong>{order.order_id}</strong>
                                        {order.cancel_reason && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                                                📝 {order.cancel_reason}
                                            </div>
                                        )}
                                    </td>
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
                                    <td style={{ verticalAlign: 'middle' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {(refund && refund.status === 'processed') || order.status === 'delivered' ? (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {order.status === 'delivered' ? '✅ Completed' : '🔒 Refunded — Closed'}
                                                </span>
                                            ) : (
                                                <select
                                                    className="input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: 'auto' }}
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                                                >
                                                    {STATUSES.map(s => (
                                                        <option key={s} value={s}>{STATUS_MAP[s].label}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {/* Tracking Info */}
                                            {order.tracking_id && (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    📦 <TrackingIdDisplay trackingId={order.tracking_id} />
                                                    {order.tracking_url && (
                                                        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                                                            style={{ marginLeft: '0.5rem', color: 'var(--gold)', fontSize: '0.75rem' }}>
                                                            Track →
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {/* Refund Section */}
                                            {refund && (
                                                <div style={{
                                                    padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem',
                                                    background: refund.status === 'pending' ? 'rgba(255,193,7,0.1)' : 'rgba(76,175,80,0.1)',
                                                    border: `1px solid ${refund.status === 'pending' ? 'rgba(255,193,7,0.3)' : 'rgba(76,175,80,0.3)'}`
                                                }}>
                                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                        💸 Refund: ₹{refund.amount.toFixed(2)} ({refund.percentage}%)
                                                    </div>
                                                    <div style={{ marginBottom: '0.25rem' }}>
                                                        🏦 <code>{refund.payment_details}</code>
                                                    </div>
                                                    {refund.status === 'pending' ? (
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{ background: 'var(--success)', color: 'white', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                                            onClick={() => markRefundProcessed(refund.id)}
                                                        >
                                                            ✅ Mark as Refunded
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Refunded</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {/* Shipped Modal */}
            {shipModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }} onClick={() => setShipModal(null)}>
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '16px', padding: '2rem',
                        maxWidth: '450px', width: '100%',
                        border: '1px solid rgba(197,165,90,0.15)'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '0.25rem' }}>🚚 Ship Order {shipModal}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Enter tracking details so customers can track their shipment.
                        </p>

                        <div className="form-group">
                            <label className="form-label">Tracking ID *</label>
                            <input
                                className="form-input"
                                placeholder="e.g., AWB123456789"
                                value={trackingId}
                                onChange={e => setTrackingId(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tracking URL</label>
                            <input
                                className="form-input"
                                placeholder="e.g., https://www.delhivery.com/track/..."
                                value={trackingUrl}
                                onChange={e => setTrackingUrl(e.target.value)}
                            />
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Courier tracking page URL. Customer can click this to track their order.
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-outline" onClick={() => setShipModal(null)} style={{ flex: 1 }}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={submitShipped} disabled={!trackingId.trim()} style={{ flex: 1 }}>
                                ✅ Confirm Shipped
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
