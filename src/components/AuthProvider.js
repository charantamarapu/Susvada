'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('susvada_token');
        if (savedToken) {
            setToken(savedToken);
            fetchUser(savedToken);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async (t) => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${t}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setToken(t);
            } else {
                localStorage.removeItem('susvada_token');
                setToken(null);
                setUser(null);
            }
        } catch {
            localStorage.removeItem('susvada_token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('susvada_token', data.token);
            setToken(data.token);
            setUser(data.user);
            return { success: true };
        }
        return { success: false, error: data.error };
    };

    const signup = async (name, email, password, phone) => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('susvada_token', data.token);
            setToken(data.token);
            setUser(data.user);
            return { success: true };
        }
        return { success: false, error: data.error };
    };

    const logout = () => {
        localStorage.removeItem('susvada_token');
        setToken(null);
        setUser(null);
    };

    const apiFetch = useCallback(async (url, options = {}) => {
        const headers = { ...options.headers };
        if (token) headers.Authorization = `Bearer ${token}`;
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        }
        return fetch(url, { ...options, headers });
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout, apiFetch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
