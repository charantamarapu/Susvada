'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useCart } from './CartProvider';

export default function Header() {
    const { user, logout } = useAuth();
    const { count } = useCart();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            <header className="header">
                <div className="header-inner">
                    <Link href="/" className="logo">
                        <span className="logo-icon">🪷</span>
                        Susvada
                    </Link>

                    <nav className="nav-links">
                        <Link href="/products">Products</Link>
                        <Link href="/products?category=Sweets">Sweets</Link>
                        <Link href="/products?category=Snacks">Snacks</Link>
                        <Link href="/products?category=Cold-Pressed+Oils">Oils</Link>
                        <Link href="/support">Support</Link>
                    </nav>

                    <div className="nav-actions">
                        <Link href="/cart" className="nav-cart-btn" id="cart-btn">
                            🛒
                            {count > 0 && <span className="cart-badge">{count}</span>}
                        </Link>

                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {user.role === 'admin' && (
                                    <Link href="/admin" className="btn btn-sm btn-outline">Dashboard</Link>
                                )}
                                <Link href="/account" className="btn btn-sm btn-primary">
                                    {user.name.split(' ')[0]}
                                </Link>
                                <button onClick={logout} className="btn btn-sm" style={{ color: 'var(--text-muted)' }}>Logout</button>
                            </div>
                        ) : (
                            <Link href="/auth/login" className="btn btn-sm btn-primary">Login</Link>
                        )}

                        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                            <span></span><span></span><span></span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Nav */}
            <div className={`mobile-nav-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
            <div className={`mobile-nav-panel ${mobileOpen ? 'open' : ''}`}>
                <button className="mobile-nav-close" onClick={() => setMobileOpen(false)}>✕</button>
                <div style={{ marginTop: '2rem' }}>
                    <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
                    <Link href="/products" onClick={() => setMobileOpen(false)}>All Products</Link>
                    <Link href="/products?category=Sweets" onClick={() => setMobileOpen(false)}>Sweets</Link>
                    <Link href="/products?category=Snacks" onClick={() => setMobileOpen(false)}>Snacks</Link>
                    <Link href="/products?category=Cold-Pressed+Oils" onClick={() => setMobileOpen(false)}>Cold-Pressed Oils</Link>
                    <Link href="/cart" onClick={() => setMobileOpen(false)}>Cart ({count})</Link>
                    <Link href="/support" onClick={() => setMobileOpen(false)}>Support</Link>
                    {user ? (
                        <>
                            <Link href="/account" onClick={() => setMobileOpen(false)}>My Account</Link>
                            {user.role === 'admin' && <Link href="/admin" onClick={() => setMobileOpen(false)}>Admin Panel</Link>}
                            <a href="#" onClick={(e) => { e.preventDefault(); logout(); setMobileOpen(false); }}>Logout</a>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" onClick={() => setMobileOpen(false)}>Login</Link>
                            <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
