'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingSupport from '@/components/FloatingSupport';
import { ToastContainer, useToast } from '@/components/Toast';

export default function SupportPage() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const { toasts, addToast, removeToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.subject || !form.message) {
            addToast('Please fill all required fields', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                addToast('Ticket submitted! We\'ll get back to you soon.');
                setForm({ name: '', email: '', phone: '', subject: '', message: '' });
            } else {
                addToast('Failed to submit', 'error');
            }
        } catch {
            addToast('Network error', 'error');
        }
        setSubmitting(false);
    };

    return (
        <>
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <main className="main-content">
                <div className="page-header">
                    <div className="container">
                        <div className="breadcrumb">
                            <Link href="/">Home</Link> / <span>Support</span>
                        </div>
                        <h1>Support Hub</h1>
                        <p>We're here to help! Reach out through any channel</p>
                    </div>
                </div>

                <div className="container" style={{ paddingBottom: '3rem' }}>
                    {/* Contact Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                        <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="card" style={{ padding: '1.5rem', textAlign: 'center', textDecoration: 'none' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                            <h4>WhatsApp</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chat with us instantly</p>
                        </a>
                        <a href="https://t.me/susvada" target="_blank" rel="noopener noreferrer" className="card" style={{ padding: '1.5rem', textAlign: 'center', textDecoration: 'none' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✈️</div>
                            <h4>Telegram</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Message us on Telegram</p>
                        </a>
                        <a href="tel:+919999999999" className="card" style={{ padding: '1.5rem', textAlign: 'center', textDecoration: 'none' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📞</div>
                            <h4>Call Us</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>+91 99999 99999</p>
                        </a>
                        <a href="mailto:support@susvada.com" className="card" style={{ padding: '1.5rem', textAlign: 'center', textDecoration: 'none' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</div>
                            <h4>Email</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>support@susvada.com</p>
                        </a>
                    </div>

                    {/* Ticket Form */}
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div className="section-header">
                            <span className="section-tag">Submit a Ticket</span>
                            <h2>Fill a Form</h2>
                            <p>Describe your issue and we'll respond within 24 hours</p>
                        </div>

                        <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input type="tel" className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <select className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required>
                                    <option value="" disabled>Select a topic</option>
                                    <option value="Order Status">Order Status</option>
                                    <option value="Product Inquiry">Product Inquiry</option>
                                    <option value="Login / Account Issue">Login / Account Issue</option>
                                    <option value="Returns / Refunds">Returns / Refunds</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Message *</label>
                                <textarea className="form-input" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
            <FloatingSupport />
        </>
    );
}
