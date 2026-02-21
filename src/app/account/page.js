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

export default function AccountPage() {
    const { user, apiFetch, logout } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('orders');
    const [addresses, setAddresses] = useState([]);

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

    const cancelOrder = async (orderId) => {
        if (!confirm('Cancel this order?')) return;
        const res = await apiFetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'cancel' }),
        });
        if (res.ok) fetchOrders();
    };

    const deleteAddress = async (id) => {
        if (!confirm('Delete this address?')) return;
        const res = await apiFetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchAddresses();
    };

    if (!user) return null;

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
                                                            {order.status === 'pending_verification' && (
                                                                <button className="btn btn-sm btn-danger" onClick={() => cancelOrder(order.order_id)}>Cancel Order</button>
                                                            )}
                                                        </div>

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
        </>
    );
}
