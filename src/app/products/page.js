'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingSupport from '@/components/FloatingSupport';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { ToastContainer, useToast } from '@/components/Toast';

const CATEGORY_EMOJIS = { 'Sweets': '🍬', 'Snacks': '🍿', 'Cold-Pressed Oils': '🫒' };

function ProductsContent() {
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(category || '');
    const { addToCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {
        setActiveCategory(category || '');
    }, [category]);

    useEffect(() => {
        let url = '/api/products?';
        if (activeCategory) url += `category=${encodeURIComponent(activeCategory)}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        setLoading(true);
        fetch(url)
            .then(r => r.json())
            .then(data => { setProducts(data.products || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [activeCategory, search]);

    const handleAddToCart = async (product) => {
        if (!user) { router.push('/auth/login'); return; }
        const result = await addToCart(product.id);
        if (result.success) addToast(`${product.name} added to cart!`);
        else addToast(result.error, 'error');
    };

    const categories = ['', 'Sweets', 'Snacks', 'Cold-Pressed Oils'];

    return (
        <>
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <main className="main-content">
                <div className="page-header">
                    <div className="container">
                        <div className="breadcrumb">
                            <Link href="/">Home</Link> / <span>Products</span>
                            {activeCategory && <> / <span>{activeCategory}</span></>}
                        </div>
                        <h1>{activeCategory || 'All Products'}</h1>
                        <p>Discover our premium selection of traditional goodness</p>
                    </div>
                </div>

                <div className="container" style={{ paddingBottom: '3rem' }}>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat || 'all'}
                                    className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat || 'All'}
                                </button>
                            ))}
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ height: '40px' }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                            <div className="spinner" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <h3>No products found</h3>
                            <p>Try adjusting your filters or search term</p>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {products.map((product) => (
                                <div key={product.id} className="card product-card">
                                    {product.compare_price && product.compare_price > product.price && (
                                        <span className="product-badge badge-sale">
                                            {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                                        </span>
                                    )}
                                    {product.is_preorder ? <span className="product-badge badge-preorder">Pre-Order</span> : null}
                                    {product.stock > 0 && product.stock < 10 ? <span className="product-badge badge-low-stock">Low Stock</span> : null}
                                    <Link href={`/product/${product.slug}`}>
                                        <div className="product-image-wrap">
                                            {product.hero_image ? (
                                                <img src={product.hero_image} alt={product.name} />
                                            ) : (
                                                <div className="product-image-placeholder">
                                                    {CATEGORY_EMOJIS[product.category] || '📦'}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="product-info">
                                        <div className="product-category">{product.category}</div>
                                        <Link href={`/product/${product.slug}`}>
                                            <h3 className="product-name">{product.name}</h3>
                                        </Link>
                                        {product.avg_rating > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                                                <span style={{ color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '1px' }}>
                                                    {'★'.repeat(Math.round(product.avg_rating))}{'☆'.repeat(5 - Math.round(product.avg_rating))}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({product.review_count})</span>
                                            </div>
                                        )}
                                        <p className="product-desc">{product.short_description}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {product.weight}{product.unit} · Shelf life: {product.shelf_life_days} days
                                            </span>
                                        </div>
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
                </div>
            </main>
            <Footer />
            <FloatingSupport />
        </>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        }>
            <ProductsContent />
        </Suspense>
    );
}
