'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { user, apiFetch } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (!user) { setItems([]); return; }
        setLoading(true);
        try {
            const res = await apiFetch('/api/cart');
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            }
        } catch { } finally {
            setLoading(false);
        }
    }, [user, apiFetch]);

    useEffect(() => { fetchCart(); }, [fetchCart]);

    const addToCart = async (productId, quantity = 1) => {
        if (!user) return { success: false, error: 'Please login first' };
        try {
            const res = await apiFetch('/api/cart', {
                method: 'POST',
                body: JSON.stringify({ product_id: productId, quantity }),
            });
            if (res.ok) { await fetchCart(); return { success: true }; }
            const data = await res.json();
            return { success: false, error: data.error };
        } catch { return { success: false, error: 'Network error' }; }
    };

    const updateQuantity = async (productId, quantity) => {
        try {
            const res = await apiFetch('/api/cart', {
                method: 'PUT',
                body: JSON.stringify({ product_id: productId, quantity }),
            });
            if (res.ok) { await fetchCart(); return { success: true }; }
            const data = await res.json();
            return { success: false, error: data.error };
        } catch { return { success: false, error: 'Network error' }; }
    };

    const removeItem = async (productId) => {
        try {
            const res = await apiFetch(`/api/cart?product_id=${productId}`, { method: 'DELETE' });
            if (res.ok) { await fetchCart(); return { success: true }; }
        } catch { }
        return { success: false };
    };

    const clearCart = async () => {
        try {
            await apiFetch('/api/cart', { method: 'DELETE' });
            setItems([]);
        } catch { }
    };

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, loading, count, subtotal, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
