'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';

export default function CartPage() {
    const { items, loading, count, subtotal, updateQuantity, removeItem } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    if (!user) {
        return (
            <>
                <Header />
                <main className="main-content">
                    <div className="container" style={{ padding: '4rem 0' }}>
                        <div className="empty-state">
                            <div className="empty-icon">🔐</div>
                            <h3>Please login to view your cart</h3>
                            <Link href="/auth/login" className="btn btn-primary">Login</Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="main-content">
                <div className="page-header">
                    <div className="container">
                        <div className="breadcrumb">
                            <Link href="/">Home</Link> / <span>Cart</span>
                        </div>
                        <h1>Shopping Cart</h1>
                        <p>{count} item{count !== 1 ? 's' : ''} in your cart</p>
                    </div>
                </div>

                <div className="container" style={{ paddingBottom: '3rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                            <div className="spinner" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🛒</div>
                            <h3>Your cart is empty</h3>
                            <p>Looks like you haven't added any items yet</p>
                            <Link href="/products" className="btn btn-primary">Start Shopping</Link>
                        </div>
                    ) : (
                        <div className="checkout-grid">
                            <div>
                                <div className="card" style={{ overflow: 'hidden' }}>
                                    {items.map((item) => (
                                        <div key={item.id} className="cart-item">
                                            <div className="cart-item-image">
                                                <div className="product-image-placeholder" style={{ fontSize: '2rem' }}>
                                                    📦
                                                </div>
                                            </div>
                                            <div className="cart-item-info">
                                                <Link href={`/product/${item.slug}`}>
                                                    <h4>{item.name}</h4>
                                                </Link>
                                                <div className="cart-item-meta">{item.weight}{item.unit}</div>
                                                <div style={{ marginTop: '0.5rem', fontWeight: 700, color: 'var(--gold-dark)' }}>
                                                    ₹{(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div className="quantity-control">
                                                    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>−</button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                                                </div>
                                                <button onClick={() => removeItem(item.product_id)} style={{ color: 'var(--danger)', fontSize: '1.2rem' }} title="Remove">🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="order-summary-card">
                                <h3 style={{ marginBottom: '1.5rem' }}>Order Summary</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Subtotal ({count} items)</span>
                                    <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
                                    <span style={{ fontWeight: 600, color: subtotal >= 500 ? 'var(--success)' : 'var(--text-primary)' }}>
                                        {subtotal >= 500 ? 'FREE' : '₹60.00'}
                                    </span>
                                </div>
                                {subtotal < 500 && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--gold-dark)', background: 'var(--cream)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                                        Add ₹{(500 - subtotal).toFixed(0)} more for free delivery!
                                    </p>
                                )}
                                <hr style={{ border: 'none', borderTop: '1px solid var(--cream-dark)', margin: '1rem 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total</span>
                                    <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--gold-dark)' }}>
                                        ₹{(subtotal + (subtotal >= 500 ? 0 : 60)).toFixed(2)}
                                    </span>
                                </div>
                                <button className="btn btn-primary btn-block btn-lg" onClick={() => router.push('/checkout')}>
                                    Proceed to Checkout →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
