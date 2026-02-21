import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="logo">
                            <span className="logo-icon">🪷</span>
                            Susvada
                        </div>
                        <p style={{ marginTop: '1rem' }}>
                            Premium export-quality sweets, snacks, and cold-pressed oils.
                            Crafted with tradition, delivered with care.
                        </p>
                    </div>

                    <div className="footer-col">
                        <h4>Shop</h4>
                        <Link href="/products?category=Sweets">Sweets</Link>
                        <Link href="/products?category=Snacks">Snacks</Link>
                        <Link href="/products?category=Cold-Pressed+Oils">Cold-Pressed Oils</Link>
                        <Link href="/products">All Products</Link>
                    </div>

                    <div className="footer-col">
                        <h4>Account</h4>
                        <Link href="/auth/login">Login</Link>
                        <Link href="/auth/signup">Sign Up</Link>
                        <Link href="/account">My Orders</Link>
                        <Link href="/account/addresses">Addresses</Link>
                    </div>

                    <div className="footer-col">
                        <h4>Help</h4>
                        <Link href="/support">Contact Us</Link>
                        <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                        <a href="mailto:support@susvada.com">Email</a>
                        <a href="tel:+919999999999">Call Us</a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Susvada. All rights reserved. | Premium Export Quality</p>
                </div>
            </div>
        </footer>
    );
}
