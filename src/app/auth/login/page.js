'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const { toasts, addToast, removeToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) { addToast('Please fill all fields', 'error'); return; }
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (result.success) {
            router.push('/');
        } else {
            addToast(result.error || 'Login failed', 'error');
        }
    };

    return (
        <div className="auth-page">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="auth-card">
                <div className="auth-title">
                    <Link href="/" className="logo" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <span className="logo-icon">🪷</span>
                        Susvada
                    </Link>
                    <h2>Welcome Back</h2>
                    <p>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                        <Link href="/auth/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>Forgot Password?</Link>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link href="/support" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                        🛟 Need help? Contact Support
                    </Link>
                </div>

                <div className="auth-footer">
                    Don't have an account? <Link href="/auth/signup">Create one</Link>
                </div>
            </div>
        </div>
    );
}
