'use client';
import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            {type === 'success' && '✅ '}
            {type === 'error' && '❌ '}
            {type === 'warning' && '⚠️ '}
            {message}
        </div>
    );
}

export function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
            ))}
        </div>
    );
}

let toastId = 0;
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success') => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return { toasts, addToast, removeToast };
}
