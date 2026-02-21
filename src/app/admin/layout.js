'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function AdminLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/auth/login');
        }
    }, [user, loading]);

    if (loading || !user || user.role !== 'admin') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    const navItems = [
        { href: '/admin', icon: '📊', label: 'Dashboard' },
        { href: '/admin/orders', icon: '📦', label: 'Orders' },
        { href: '/admin/products', icon: '🏷️', label: 'Products' },
        { href: '/admin/inventory', icon: '📋', label: 'Inventory' },
        { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <h3>🪷 Susvada</h3>
                    </Link>
                    <p>Admin Panel</p>
                </div>
                <nav className="admin-nav">
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}>
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(197,165,90,0.15)', margin: '1rem 1.5rem' }} />
                    <Link href="/">
                        <span>🏠</span>
                        View Store
                    </Link>
                </nav>
            </aside>
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}
