'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

export default function AdminSettingsPage() {
    const { apiFetch } = useAuth();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {
        apiFetch('/api/admin/settings')
            .then(r => r.json())
            .then(d => { setSettings(d.settings); setLoading(false); });
    }, []);

    const handleSave = async () => {
        const res = await apiFetch('/api/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
        if (res.ok) addToast('Settings saved!');
        else addToast('Failed to save', 'error');
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>;

    return (
        <div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="admin-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Settings</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Configure your store</p>
                </div>
                <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
            </div>

            <div style={{ maxWidth: '600px' }}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>💳 Payment</h3>
                    <div className="form-group">
                        <label className="form-label">Merchant UPI ID</label>
                        <input
                            className="form-input"
                            value={settings.merchant_upi_id || ''}
                            onChange={e => setSettings({ ...settings, merchant_upi_id: e.target.value })}
                            placeholder="yourname@upi"
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            The UPI VPA displayed in checkout QR codes
                        </p>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>🚚 Shipping</h3>
                    <div className="form-group">
                        <label className="form-label">Minimum Order for Free Delivery (₹)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={settings.min_free_delivery || '500'}
                            onChange={e => setSettings({ ...settings, min_free_delivery: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Domestic Shipping Fee (₹)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={settings.domestic_shipping || '60'}
                            onChange={e => setSettings({ ...settings, domestic_shipping: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">International Shipping Fee (₹)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={settings.international_shipping || '500'}
                            onChange={e => setSettings({ ...settings, international_shipping: e.target.value })}
                        />
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>🤖 Telegram</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Telegram Bot settings are configured in <code>.env.local</code> file on the server:
                    </p>
                    <div style={{ background: 'var(--cream)', padding: '1rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        TELEGRAM_BOT_TOKEN=your_bot_token<br />
                        TELEGRAM_ADMIN_CHAT_ID=your_chat_id
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                        Set webhook URL to: <code>{typeof window !== 'undefined' ? window.location.origin : ''}/api/telegram/webhook</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
