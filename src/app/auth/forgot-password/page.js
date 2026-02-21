'use client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-title">
                    <Link href="/" className="logo" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <span className="logo-icon">🪷</span>
                        Susvada
                    </Link>
                    <h2>Forgot Password?</h2>
                    <p>Don't worry, we'll help you get back in</p>
                </div>

                <div style={{
                    padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem',
                    background: 'rgba(197,165,90,0.08)', border: '1px solid rgba(197,165,90,0.15)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</div>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        Please contact our support team with your <strong>registered email address</strong>.
                        We will verify your identity and reset your password within <strong>24 hours</strong>.
                    </p>
                </div>

                <Link href="/support" className="btn btn-primary btn-block btn-lg" style={{ textDecoration: 'none', textAlign: 'center' }}>
                    🛟 Contact Support
                </Link>

                <div className="auth-footer">
                    Remember your password? <Link href="/auth/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
