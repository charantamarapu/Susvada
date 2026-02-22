'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

export default function AdminReviewsPage() {
    const { apiFetch } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toasts, addToast, removeToast } = useToast();

    const fetchReviews = async () => {
        const res = await apiFetch('/api/admin/reviews');
        if (res.ok) {
            const data = await res.json();
            setReviews(data.reviews);
        }
        setLoading(false);
    };

    useEffect(() => { fetchReviews(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('Delete this review? This cannot be undone.')) return;
        const res = await apiFetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            addToast('Review deleted');
            fetchReviews();
        } else {
            addToast('Failed to delete review', 'error');
        }
    };

    const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

    return (
        <div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="admin-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Reviews</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{reviews.length} reviews · Moderate customer feedback</p>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
            ) : reviews.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">⭐</div>
                    <h3>No reviews yet</h3>
                    <p>Customer reviews will appear here once submitted</p>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Customer</th>
                            <th>Rating</th>
                            <th>Review</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map(r => (
                            <tr key={r.id}>
                                <td><strong>{r.product_name}</strong></td>
                                <td>
                                    <div>{r.user_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.user_email}</div>
                                </td>
                                <td>
                                    <span style={{ color: 'var(--gold)', fontSize: '1.1rem', letterSpacing: '1px' }}>
                                        {renderStars(r.rating)}
                                    </span>
                                </td>
                                <td style={{ maxWidth: '300px' }}>
                                    <div style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {r.review_text || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No text</span>}
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
