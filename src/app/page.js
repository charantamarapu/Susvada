'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingSupport from '@/components/FloatingSupport';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

// Hook for scroll animations
function useScrollReveal() {
    const defaultRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                    // Stop observing once revealed
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        const elements = document.querySelectorAll('.reveal');
        elements.forEach(el => observer.observe(el));

        return () => {
            elements.forEach(el => observer.unobserve(el));
        };
    }, []);

    return defaultRef;
}

export default function Home() {
    useScrollReveal();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {
        // Fetch featured products (just grab first 4 for now)
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                if (data.products) {
                    setFeaturedProducts(data.products.slice(0, 4));
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleAddToCart = async (product) => {
        if (!user) { router.push('/auth/login'); return; }
        const result = await addToCart(product.id);
        if (result.success) addToast(`${product.name} added to cart!`);
        else addToast(result.error, 'error');
    };

    return (
        <>
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <main className="main-content">
                {/* Hero Section */}
                <section className="hero">
                    <div className="hero-pattern"></div>
                    <div className="container">
                        <div className="hero-content reveal" style={{ transitionDelay: '0.1s' }}>
                            <span className="hero-tag">Handcrafted Tradition</span>
                            <h1>Experience the <span className="text-gold">Authentic Taste</span> of South India</h1>
                            <p>Premium sweets, savory snacks, and pure cold-pressed oils. Made with generations of love, using traditional recipes and the finest organic ingredients.</p>
                            <div className="hero-actions">
                                <Link href="/products" className="btn btn-primary btn-lg">Explore Collection</Link>
                                <Link href="/products?category=Sweets" className="btn btn-outline btn-lg" style={{ color: 'var(--cream)', borderColor: 'var(--cream)' }}>Shop Sweets</Link>
                            </div>

                            <div className="hero-stats reveal" style={{ transitionDelay: '0.3s' }}>
                                <div className="hero-stat">
                                    <h3>100%</h3>
                                    <p>Pure & Natural</p>
                                </div>
                                <div className="hero-stat">
                                    <h3>50+</h3>
                                    <p>Years Heritage</p>
                                </div>
                                <div className="hero-stat">
                                    <h3>No</h3>
                                    <p>Preservatives</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="section bg-secondary">
                    <div className="container container-narrow">
                        <div className="section-header reveal">
                            <span className="section-tag">Our Collections</span>
                            <h2>Shop by Category</h2>
                            <p>Discover our range of traditional delicacies and authentic pantry staples crafted for your wellbeing.</p>
                        </div>

                        <div className="categories-grid reveal" style={{ transitionDelay: '0.2s' }}>
                            <Link href="/products?category=Sweets" className="category-card">
                                <div className="category-bg" style={{ background: 'url(/images/products/mysore-pak.jpg) center/cover' }}></div>
                                <div className="category-overlay">
                                    <h3 className="category-name">Premium Sweets</h3>
                                    <span className="category-count">Explore &rarr;</span>
                                </div>
                            </Link>
                            <Link href="/products?category=Snacks" className="category-card">
                                <div className="category-bg" style={{ background: 'url(/images/products/murukku.jpg) center/cover' }}></div>
                                <div className="category-overlay">
                                    <h3 className="category-name">Savory Snacks</h3>
                                    <span className="category-count">Explore &rarr;</span>
                                </div>
                            </Link>
                            <Link href="/products?category=Cold-Pressed+Oils" className="category-card">
                                <div className="category-bg" style={{ background: 'url(/images/products/coconut-oil.jpg) center/cover' }}></div>
                                <div className="category-overlay">
                                    <h3 className="category-name">Cold-Pressed Oils</h3>
                                    <span className="category-count">Explore &rarr;</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Featured Products */}
                <section className="section">
                    <div className="container">
                        <div className="section-header reveal">
                            <span className="section-tag">Bestsellers</span>
                            <h2>Featured Products</h2>
                            <p>Our most loved creations, handcrafted fresh every day.</p>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                <div className="spinner" />
                            </div>
                        ) : (
                            <div className="products-grid reveal" style={{ transitionDelay: '0.2s' }}>
                                {featuredProducts.map((product) => (
                                    <div key={product.id} className="card product-card">
                                        {product.compare_price && product.compare_price > product.price && (
                                            <span className="product-badge badge-sale">
                                                {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                                            </span>
                                        )}
                                        <Link href={`/product/${product.slug}`}>
                                            <div className="product-image-wrap">
                                                {product.hero_image ? (
                                                    <img src={product.hero_image} alt={product.name} />
                                                ) : (
                                                    <div className="product-image-placeholder">📦</div>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="product-info">
                                            <div className="product-category">{product.category}</div>
                                            <Link href={`/product/${product.slug}`}>
                                                <h3 className="product-name">{product.name}</h3>
                                            </Link>
                                            <p className="product-desc">{product.short_description}</p>
                                            <div className="product-price-row">
                                                <div className="product-price">
                                                    ₹{product.price}
                                                    {product.compare_price && product.compare_price > product.price && (
                                                        <span className="compare-price">₹{product.compare_price}</span>
                                                    )}
                                                </div>
                                                {product.stock > 0 ? (
                                                    <button className="add-to-cart-btn" onClick={() => handleAddToCart(product)} title="Add to cart">+</button>
                                                ) : (
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>Out of Stock</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="reveal" style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <Link href="/products" className="btn btn-outline btn-lg">View All Products</Link>
                        </div>
                    </div>
                </section>

                {/* Trust/About Section */}
                <section className="section trust-section">
                    <div className="container reveal">
                        <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'center' }}>
                            <div className="trust-item">
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>100% Organic</h3>
                                <p style={{ color: 'var(--text-muted)' }}>We source the finest ingredients directly from traditional farmers.</p>
                            </div>
                            <div className="trust-item">
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👐</div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Handcrafted</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Made in small batches using age-old ancestral recipes.</p>
                            </div>
                            <div className="trust-item">
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚚</div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Nationwide Delivery</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Freshness delivered straight to your doorstep across India.</p>
                            </div>
                            <div className="trust-item">
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Premium Quality</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Uncompromising standard for taste, purity, and hygiene.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
            <FloatingSupport />
        </>
    );
}
