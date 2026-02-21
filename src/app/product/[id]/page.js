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

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {
        fetch(`/api/products/${params.id}`)
            .then(r => r.json())
            .then(data => { setProduct(data.product); setLoading(false); })
            .catch(() => setLoading(false));
    }, [params.id]);

    const handleAddToCart = async () => {
        if (!user) { router.push('/auth/login'); return; }
        const result = await addToCart(product.id, quantity);
        if (result.success) addToast(`${product.name} added to cart!`);
        else addToast(result.error, 'error');
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

                            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{product.name}</h1>
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
                                        <button className="btn btn-primary btn-lg" onClick={handleAddToCart} style={{ flex: 1 }}>
                                            🛒 Add to Cart — ₹{(product.price * quantity).toFixed(0)}
                                        </button>
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
                </div>
            </main>
            <Footer />
            <FloatingSupport />
        </>
    );
}
