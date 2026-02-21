'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

export default function AdminCustomersPage() {
    const { apiFetch } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toasts, addToast, removeToast } = useToast();

    const fetchCustomers = async () => {
        const res = await apiFetch('/api/admin/customers');
        if (res.ok) {
            const data = await res.json();
            setCustomers(data.customers);
        }
        setLoading(false);
    };

    useEffect(() => { fetchCustomers(); }, []);

    const toggleBlock = async (userId, currentlyBlocked) => {
        const action = currentlyBlocked ? 'unblock' : 'block';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        const res = await apiFetch('/api/admin/customers', {
            method: 'PATCH',
            body: JSON.stringify({ user_id: userId, is_blocked: !currentlyBlocked }),
        });
        if (res.ok) {
            addToast(`User ${currentlyBlocked ? 'unblocked' : 'blocked'} ✅`);
            fetchCustomers();
        } else {
            addToast('Failed to update', 'error');
        }
    };

    const resetPassword = async (userId, customerName) => {
        if (!confirm(`Reset password for ${customerName}? A temporary password will be generated.`)) return;

        const res = await apiFetch('/api/admin/customers/reset-password', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
        });
        if (res.ok) {
            const data = await res.json();
            addToast(`Password reset! Temp: ${data.temp_password}`);
            alert(`Temporary password for ${customerName}:\n\n${data.temp_password}\n\nPlease share this with the customer securely.`);
        } else {
            addToast('Failed to reset password', 'error');
        }
    };

    return (
        <div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="admin-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Customers</h1>
                    <p style={{ color: 'var(--text-muted)' }}>View all registered customers and their activity</p>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {customers.length} total customers
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
            ) : customers.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>No customers yet</h3>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Phone</th>
                            <th>Joined</th>
                            <th>Orders</th>
                            <th>Total Spent</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(c => (
                            <tr key={c.id} style={{ opacity: c.is_blocked ? 0.6 : 1 }}>
                                <td>
                                    <div><strong>{c.name}</strong></div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>
                                </td>
                                <td style={{ fontSize: '0.9rem' }}>{c.phone || '—'}</td>
                                <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                    {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td>
                                    <strong style={{ fontSize: '1.05rem' }}>{c.total_orders}</strong>
                                </td>
                                <td style={{ fontWeight: 600 }}>
                                    ₹{c.total_spent.toFixed(2)}
                                </td>
                                <td>
                                    {c.is_blocked ? (
                                        <span className="status-badge status-cancelled">🚫 Blocked</span>
                                    ) : (
                                        <span className="status-badge status-delivered">✅ Active</span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        <button
                                            className={`btn btn-sm ${c.is_blocked ? 'btn-primary' : 'btn-danger'}`}
                                            onClick={() => toggleBlock(c.id, c.is_blocked)}
                                            style={{ fontSize: '0.8rem' }}
                                        >
                                            {c.is_blocked ? '🔓 Unblock' : '🚫 Block'}
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => resetPassword(c.id, c.name)}
                                            style={{ fontSize: '0.8rem' }}
                                        >
                                            🔑 Reset Pwd
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
