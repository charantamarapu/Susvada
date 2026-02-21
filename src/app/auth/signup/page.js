'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {
        const error = searchParams.get('error');
        if (error) {
            addToast('Google action failed: ' + error.replace(/_/g, ' '), 'error');
            router.replace('/auth/signup', undefined, { shallow: true });
        }
    }, [searchParams, addToast, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) { addToast('Please fill all required fields', 'error'); return; }
        if (password.length < 6) { addToast('Password must be at least 6 characters', 'error'); return; }
        if (password !== confirmPassword) { addToast('Passwords do not match', 'error'); return; }
        setLoading(true);
        const result = await signup(name, email, password, phone);
        setLoading(false);
        if (result.success) {
            router.push('/');
        } else {
            addToast(result.error || 'Signup failed', 'error');
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
                    <h2>Create Account</h2>
                    <p>Join Susvada for premium sweets & snacks</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input type="text" className="form-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input type="tel" className="form-input" placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password *</label>
                        <input type="password" className="form-input" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm Password *</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            style={confirmPassword && password !== confirmPassword ? { borderColor: 'var(--danger)' } : {}}
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                                Passwords do not match
                            </div>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ flex: 1, borderTop: '1px solid var(--border-color, #e0e0e0)' }}></div>
                    <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>OR</span>
                    <div style={{ flex: 1, borderTop: '1px solid var(--border-color, #e0e0e0)' }}></div>
                </div>

                <a href="/api/auth/google" className="btn btn-block" style={{ backgroundColor: 'var(--bg-secondary, #fff)', color: 'var(--text-primary)', border: '1px solid var(--border-color, #e0e0e0)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textDecoration: 'none', marginBottom: '1rem', padding: '0.75rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign up with Google
                </a>

                <div className="auth-footer">
                    Already have an account? <Link href="/auth/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
