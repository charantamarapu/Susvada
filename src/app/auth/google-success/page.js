'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function GoogleSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            loginWithToken(token).then(() => {
                router.push('/');
            }).catch(err => {
                console.error("Login with token failed", err);
                router.push('/auth/login?error=google_login_failed');
            });
        } else {
            router.push('/auth/login?error=missing_token');
        }
    }, [searchParams, loginWithToken, router]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🪷</div>
                <h2 style={{ color: 'var(--text-primary)' }}>Authenticating...</h2>
                <p style={{ color: 'var(--text-muted)' }}>Completing your sign in with Google.</p>
            </div>
        </div>
    );
}
