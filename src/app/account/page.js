'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';

const STATUS_MAP = {
    'pending_verification': { label: 'Pending Verification', class: 'status-pending', icon: '⏳' },
    'processing': { label: 'Processing', class: 'status-processing', icon: '🔄' },
    'shipped': { label: 'Shipped', class: 'status-shipped', icon: '🚚' },
    'delivered': { label: 'Delivered', class: 'status-delivered', icon: '✅' },
    'cancelled': { label: 'Cancelled', class: 'status-cancelled', icon: '❌' },
};

function getRefundInfo(status) {
    if (status === 'pending_verification') return { percent: 100, text: 'You will receive a full 100% refund.' };
    if (status === 'processing') return { percent: 75, text: 'Since your order is being processed, you are eligible for a 75% refund.' };
    return { percent: 0, text: 'This order cannot be cancelled at this stage.' };
}

export default function AccountPage() {
    const { user, apiFetch, logout } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('orders');
    const [addresses, setAddresses] = useState([]);

    // Cancel modal state
    const [cancelModal, setCancelModal] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [paymentDetails, setPaymentDetails] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelResult, setCancelResult] = useState(null);

    useEffect(() => {
        if (!user) { router.push('/auth/login'); return; }
        fetchOrders();
        fetchAddresses();
    }, [user]);

    const fetchOrders = async () => {
        const res = await apiFetch('/api/orders');
        if (res.ok) {
            const data = await res.json();
            setOrders(data.orders);
        }
        setLoading(false);
    };

    const fetchAddresses = async () => {
        const res = await apiFetch('/api/addresses');
        if (res.ok) {
            const data = await res.json();
            setAddresses(data.addresses);
        }
    };

    const openCancelModal = (order) => {
        setCancelModal(order);
        setCancelReason('');
        setPaymentDetails('');
        setCancelResult(null);
    };

    const submitCancellation = async () => {
        if (!cancelReason.trim()) return alert('Please provide a reason for cancellation.');
        if (!paymentDetails.trim()) return alert('Please provide your UPI ID or Bank Account details for refund.');

        setCancelLoading(true);
        const res = await apiFetch(`/api/orders/${cancelModal.order_id}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason: cancelReason, payment_details: paymentDetails }),
        });
        const data = await res.json();
        setCancelLoading(false);

        if (res.ok) {
            setCancelResult(data);
            fetchOrders();
        } else {
            alert(data.error || 'Failed to cancel order.');
        }
    };

    const deleteAddress = async (id) => {
        if (!confirm('Delete this address?')) return;
        const res = await apiFetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchAddresses();
    };

    if (!user) return null;

    const canCancel = (status) => status === 'pending_verification' || status === 'processing';

    return (
        <>
            <Header />
            <main className="main-content">
                <div className="page-header">
                    <div className="container">
                        <h1>My Account</h1>
                        <p>Welcome back, {user.name} 👋</p>
                    </div>
                </div>

                <div className="container">
                    <div className="account-layout">
                        <div className="account-sidebar">
                            <a className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')} style={{ cursor: 'pointer' }}>📦 My Orders</a>
                            <a className={tab === 'addresses' ? 'active' : ''} onClick={() => setTab('addresses')} style={{ cursor: 'pointer' }}>📍 Addresses</a>
                            <a className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')} style={{ cursor: 'pointer' }}>👤 Profile</a>
                            <a onClick={logout} style={{ cursor: 'pointer', color: 'var(--danger)' }}>🚪 Logout</a>
                        </div>

                        <div>
                            {/* Orders Tab */}
                            {tab === 'orders' && (
                                <div>
                                    <h2 style={{ marginBottom: '1.5rem' }}>My Orders</h2>
                                    {loading ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
                                    ) : orders.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">📦</div>
                                            <h3>No orders yet</h3>
                                            <p>Start shopping to see your orders here</p>
                                            <Link href="/products" className="btn btn-primary">Browse Products</Link>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {orders.map(order => {
                                                const st = STATUS_MAP[order.status] || STATUS_MAP.pending_verification;
                                                return (
                                                    <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                                            <div>
                                                                <strong style={{ fontSize: '1.05rem' }}>{order.order_id}</strong>
                                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                    {order.delivery_date && ` · Delivery: ${new Date(order.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                                                </div>
                                                            </div>
                                                            <span className={`status-badge ${st.class}`}>{st.icon} {st.label}</span>
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                                            {order.items.map((item, i) => (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                                    <span>{item.name} × {item.quantity}</span>
                                                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <strong style={{ color: 'var(--gold-dark)', fontSize: '1.1rem' }}>₹{order.total.toFixed(2)}</strong>
                                                            {canCancel(order.status) && (
                                                                <button className="btn btn-sm btn-danger" onClick={() => openCancelModal(order)}>Cancel Order</button>
                                                            )}
                                                        </div>

                                                        {order.status === 'cancelled' && order.refund_status === 'pending' && (
                                                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,193,7,0.1)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--gold-dark)' }}>
                                                                💸 Refund is being processed. You'll receive it within 24 hours.
                                                            </div>
                                                        )}
                                                        {order.status === 'cancelled' && order.refund_status === 'processed' && (
                                                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(76,175,80,0.1)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--success)' }}>
                                                                ✅ Refund has been processed successfully.
                                                            </div>
                                                        )}

                                                        {order.utr && (
                                                            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                UTR: <code>{order.utr}</code>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Addresses Tab */}
                            {tab === 'addresses' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h2>My Addresses</h2>
                                        <Link href="/checkout" className="btn btn-sm btn-outline">+ Add at Checkout</Link>
                                    </div>
                                    {addresses.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">📍</div>
                                            <h3>No addresses saved</h3>
                                            <p>Add an address during checkout</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                                            {addresses.map(addr => (
                                                <div key={addr.id} className="card" style={{ padding: '1.25rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <strong>{addr.label}</strong>
                                                        {addr.is_default ? <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700 }}>DEFAULT</span> : null}
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem' }}>{addr.name} · {addr.phone}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                                                        {addr.city}, {addr.state} - {addr.pincode}
                                                    </div>
                                                    <button className="btn btn-sm" style={{ color: 'var(--danger)', marginTop: '0.75rem', padding: '0' }} onClick={() => deleteAddress(addr.id)}>
                                                        Delete
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Profile Tab */}
                            {tab === 'profile' && (
                                <div>
                                    <h2 style={{ marginBottom: '1.5rem' }}>Profile</h2>
                                    <div className="card" style={{ padding: '1.5rem', maxWidth: '500px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Name</label>
                                            <input className="form-input" value={user.name} disabled />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input className="form-input" value={user.email} disabled />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone</label>
                                            <input className="form-input" value={user.phone || 'Not set'} disabled />
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Cancel Order Modal */}
            {cancelModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }} onClick={() => !cancelLoading && setCancelModal(null)}>
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '16px', padding: '2rem',
                        maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
                        border: '1px solid rgba(197,165,90,0.15)'
                    }} onClick={e => e.stopPropagation()}>

                        {cancelResult ? (
                            /* Success State */
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                                <h3 style={{ marginBottom: '0.5rem' }}>Order Cancelled</h3>
                                {cancelResult.refund_percentage > 0 ? (
                                    <>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                            Your refund of <strong style={{ color: 'var(--gold-dark)' }}>₹{cancelResult.refund_amount.toFixed(2)}</strong> ({cancelResult.refund_percentage}%) will be processed within 24 hours.
                                        </p>
                                    </>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)' }}>Your order has been cancelled.</p>
                                )}
                                <button className="btn btn-primary" onClick={() => setCancelModal(null)} style={{ marginTop: '1rem' }}>Done</button>
                            </div>
                        ) : (
                            /* Form State */
                            <>
                                <h3 style={{ marginBottom: '0.25rem' }}>Cancel Order {cancelModal.order_id}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                    Please review the cancellation details below.
                                </p>

                                {/* Refund Info Box */}
                                {(() => {
                                    const info = getRefundInfo(cancelModal.status);
                                    const refundAmt = (cancelModal.total * info.percent) / 100;
                                    return (
                                        <div style={{
                                            padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
                                            background: info.percent > 0 ? 'rgba(76,175,80,0.08)' : 'rgba(244,67,54,0.08)',
                                            border: `1px solid ${info.percent > 0 ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)'}`
                                        }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {info.percent > 0 ? `💸 ${info.percent}% Refund — ₹${refundAmt.toFixed(2)}` : '⚠️ No Refund'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{info.text}</div>
                                        </div>
                                    );
                                })()}

                                <div className="form-group">
                                    <label className="form-label">Reason for cancellation *</label>
                                    <select className="form-input" value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                                        <option value="">Select a reason</option>
                                        <option value="Changed my mind">Changed my mind</option>
                                        <option value="Ordered by mistake">Ordered by mistake</option>
                                        <option value="Found a better price">Found a better price</option>
                                        <option value="Delivery date too late">Delivery date too late</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">UPI ID or Bank Account Details *</label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g., name@upi or A/C No + IFSC"
                                        value={paymentDetails}
                                        onChange={e => setPaymentDetails(e.target.value)}
                                    />
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        Required for processing your refund within 24 hours.
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                    <button className="btn btn-outline" onClick={() => setCancelModal(null)} disabled={cancelLoading} style={{ flex: 1 }}>
                                        Keep Order
                                    </button>
                                    <button className="btn btn-danger" onClick={submitCancellation} disabled={cancelLoading} style={{ flex: 1 }}>
                                        {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
