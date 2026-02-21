'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const router = useRouter();
    const { toasts, addToast, removeToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) { addToast('Please fill all required fields', 'error'); return; }
        if (password.length < 6) { addToast('Password must be at least 6 characters', 'error'); return; }
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
                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link href="/auth/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
