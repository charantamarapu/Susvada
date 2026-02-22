'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingSupport from '@/components/FloatingSupport';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

const CATEGORY_EMOJIS = { 'Sweets': '🍬', 'Snacks': '🍿', 'Cold-Pressed Oils': '🫒' };

function StarRating({ rating, size = '1rem', interactive = false, onChange }) {
    return (
        <div style={{ display: 'inline-flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    onClick={() => interactive && onChange && onChange(star)}
                    style={{
                        fontSize: size, cursor: interactive ? 'pointer' : 'default',
                        color: star <= rating ? 'var(--gold)' : '#ddd',
                        transition: 'color 0.2s'
                    }}
                >★</span>
            ))}
        </div>
    );
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const { user, apiFetch } = useAuth();
    const { toasts, addToast, removeToast } = useToast();

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [canReview, setCanReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    // Subscription state
    const [subMode, setSubMode] = useState(false);
    const [subFrequency, setSubFrequency] = useState('monthly');
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        fetch(`/api/products/${params.id}`)
            .then(r => r.json())
            .then(data => { setProduct(data.product); setLoading(false); })
            .catch(() => setLoading(false));

        // Fetch reviews
        fetch(`/api/products/${params.id}/reviews`)
            .then(r => r.json())
            .then(data => {
                setReviews(data.reviews || []);
                setAvgRating(data.avg_rating || 0);
                setReviewCount(data.review_count || 0);
            })
            .catch(() => { });
    }, [params.id]);

    // Check if user can review (has delivered order with this product)
    useEffect(() => {
        if (!user || !product) return;
        apiFetch('/api/orders')
            .then(r => r.json())
            .then(data => {
                const delivered = (data.orders || []).filter(o => o.status === 'delivered');
                const purchased = delivered.some(o => o.items.some(i => i.id === product.id));
                setCanReview(purchased);
                // Check if already reviewed
                const alreadyReviewed = reviews.some(r => r.user_name === user.name);
                setHasReviewed(alreadyReviewed);
            })
            .catch(() => { });
    }, [user, product, reviews]);

    const handleAddToCart = async () => {
        if (!user) { router.push('/auth/login'); return; }
        const result = await addToCart(product.id, quantity);
        if (result.success) addToast(`${product.name} added to cart!`);
        else addToast(result.error, 'error');
    };

    const handleSubmitReview = async () => {
        if (!user) { router.push('/auth/login'); return; }
        setSubmittingReview(true);
        try {
            const res = await apiFetch(`/api/products/${params.id}/reviews`, {
                method: 'POST',
                body: JSON.stringify({ rating: reviewRating, review_text: reviewText }),
            });
            if (res.ok) {
                addToast('Review submitted! Thank you 🎉');
                setReviewText('');
                setReviewRating(5);
                // Refresh reviews
                const r2 = await fetch(`/api/products/${params.id}/reviews`);
                const d2 = await r2.json();
                setReviews(d2.reviews || []);
                setAvgRating(d2.avg_rating || 0);
                setReviewCount(d2.review_count || 0);
                setHasReviewed(true);
            } else {
                const data = await res.json();
                addToast(data.error || 'Failed to submit review', 'error');
            }
        } catch {
            addToast('Network error', 'error');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleSubscribe = async () => {
        if (!user) { router.push('/auth/login'); return; }
        setSubscribing(true);
        try {
            const res = await apiFetch('/api/subscriptions', {
                method: 'POST',
                body: JSON.stringify({ product_id: product.id, frequency: subFrequency, quantity }),
            });
            if (res.ok) {
                addToast('Subscribed! Manage from your account 🔄');
                setSubMode(false);
            } else {
                const data = await res.json();
                addToast(data.error || 'Failed to subscribe', 'error');
            }
        } catch {
            addToast('Network error', 'error');
        } finally {
            setSubscribing(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <div className="spinner" />
                </main>
            </>
        );
    }

    if (!product) {
        return (
            <>
                <Header />
                <main className="main-content">
                    <div className="container" style={{ padding: '4rem 0' }}>
                        <div className="empty-state">
                            <div className="empty-icon">😕</div>
                            <h3>Product not found</h3>
                            <Link href="/products" className="btn btn-primary">Browse Products</Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const discount = product.compare_price ? Math.round((1 - product.price / product.compare_price) * 100) : 0;
    const subPrice = Math.round(product.price * 0.95);
    const FREQ_LABELS = { monthly: 'Every Month', bimonthly: 'Every 2 Months', quarterly: 'Every 3 Months' };

    return (
        <>
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <main className="main-content">
                <div className="container">
                    <div style={{ padding: 'var(--space-lg) 0' }}>
                        <div className="breadcrumb" style={{ color: 'var(--text-muted)' }}>
                            <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link> /
                            <Link href="/products" style={{ color: 'var(--text-muted)' }}>Products</Link> /
                            <Link href={`/products?category=${encodeURIComponent(product.category)}`} style={{ color: 'var(--text-muted)' }}>{product.category}</Link> /
                            <span style={{ color: 'var(--text-primary)' }}>{product.name}</span>
                        </div>
                    </div>

                    <div className="product-detail-grid">
                        {/* Gallery */}
                        <div className="product-gallery">
                            <div className="main-image">
                                <div className="product-image-placeholder" style={{ fontSize: '6rem', minHeight: '400px' }}>
                                    {CATEGORY_EMOJIS[product.category] || '📦'}
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="product-info-section">
                            <div className="product-meta-tags">
                                <span className="product-badge badge-bestseller" style={{ position: 'static' }}>{product.category}</span>
                                {product.is_preorder ? <span className="product-badge badge-preorder" style={{ position: 'static' }}>Pre-Order</span> : null}
                                {product.stock < 10 && product.stock > 0 && <span className="product-badge badge-low-stock" style={{ position: 'static' }}>Low Stock</span>}
                            </div>

                            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{product.name}</h1>
                            {reviewCount > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <StarRating rating={Math.round(avgRating)} size="1.1rem" />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{avgRating} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                                </div>
                            )}
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{product.weight}{product.unit}</p>

                            <div className="price-block">
                                <span className="current-price">₹{product.price}</span>
                                {product.compare_price && product.compare_price > product.price && (
                                    <>
                                        <span className="old-price">₹{product.compare_price}</span>
                                        <span className="discount-tag">Save {discount}%</span>
                                    </>
                                )}
                            </div>

                            <p style={{ lineHeight: 1.8, marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                                {product.description}
                            </p>

                            <div className="shelf-life-info">
                                <span className="shelf-icon">📅</span>
                                <span><strong>Shelf Life:</strong> {product.shelf_life_days} days from manufacture</span>
                            </div>

                            <div className="shelf-life-info" style={{ marginTop: '0.5rem', color: product.shipping_scope === 'india_only' ? 'var(--danger)' : 'var(--success)' }}>
                                <span className="shelf-icon">{product.shipping_scope === 'india_only' ? '🇮🇳' : '🌍'}</span>
                                <span><strong>{product.shipping_scope === 'india_only' ? 'Ships within India only' : 'International shipping available'}</strong></span>
                            </div>

                            {/* Subscribe & Save for subscribable products */}
                            {product.is_subscribable ? (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <label style={{
                                        display: 'flex', gap: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${subMode ? 'var(--gold)' : 'rgba(197,165,90,0.15)'}`,
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        background: subMode ? 'var(--cream)' : 'transparent', alignItems: 'flex-start'
                                    }}>
                                        <input type="checkbox" checked={subMode} onChange={e => setSubMode(e.target.checked)} style={{ accentColor: 'var(--gold)', marginTop: '3px' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                🔄 Subscribe & Save 5% — ₹{subPrice}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Get regular deliveries and never run out. Cancel anytime!
                                            </div>
                                        </div>
                                    </label>
                                    {subMode && (
                                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {['monthly', 'bimonthly', 'quarterly'].map(freq => (
                                                <button
                                                    key={freq}
                                                    className={`btn btn-sm ${subFrequency === freq ? 'btn-primary' : 'btn-outline'}`}
                                                    onClick={() => setSubFrequency(freq)}
                                                >
                                                    {FREQ_LABELS[freq]}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {product.stock > 0 ? (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: 600 }}>Quantity:</span>
                                        <div className="quantity-control">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                                            <span>{quantity}</span>
                                            <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {product.stock} in stock
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {subMode ? (
                                            <button className="btn btn-primary btn-lg" onClick={handleSubscribe} disabled={subscribing} style={{ flex: 1 }}>
                                                {subscribing ? 'Subscribing...' : `🔄 Subscribe — ₹${subPrice * quantity}/delivery`}
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary btn-lg" onClick={handleAddToCart} style={{ flex: 1 }}>
                                                🛒 Add to Cart — ₹{(product.price * quantity).toFixed(0)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#FEF3CD', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <strong>Currently out of stock</strong>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
                                        Check back soon or explore other products
                                    </p>
                                </div>
                            )}

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {product.tags.map(tag => (
                                        <span key={tag} style={{
                                            padding: '4px 12px', background: 'var(--cream)', borderRadius: '20px',
                                            fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500
                                        }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div style={{ marginTop: '3rem', marginBottom: '3rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>⭐ Customer Reviews {reviewCount > 0 && `(${reviewCount})`}</h2>

                        {/* Write a Review */}
                        {user && canReview && !hasReviewed && (
                            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Write a Review</h3>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Your Rating</label>
                                    <StarRating rating={reviewRating} size="1.5rem" interactive onChange={setReviewRating} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Your Review (optional)</label>
                                    <textarea
                                        className="form-input"
                                        value={reviewText}
                                        onChange={e => setReviewText(e.target.value)}
                                        placeholder="Share your experience with this product..."
                                        maxLength={500}
                                        style={{ minHeight: '80px' }}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={handleSubmitReview} disabled={submittingReview}>
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        )}

                        {reviews.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                <p>No reviews yet. {canReview && !hasReviewed ? 'Be the first to review!' : 'Purchase and receive this product to leave a review.'}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {reviews.map(review => (
                                    <div key={review.id} className="card" style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <div>
                                                <strong>{review.user_name}</strong>
                                                <span style={{ marginLeft: '0.75rem' }}><StarRating rating={review.rating} size="0.9rem" /></span>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        {review.review_text && (
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                                                {review.review_text}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
            <FloatingSupport />
        </>
    );
}
