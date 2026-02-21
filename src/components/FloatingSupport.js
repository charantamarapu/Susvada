'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function FloatingSupport() {
    const [open, setOpen] = useState(false);

    return (
        <div className="floating-support">
            <div className={`floating-support-menu ${open ? 'open' : ''}`}>
                <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer">
                    <span className="support-icon" style={{ background: '#25D366', color: 'white' }}>💬</span>
                    WhatsApp
                </a>
                <a href="https://t.me/susvada" target="_blank" rel="noopener noreferrer">
                    <span className="support-icon" style={{ background: '#0088cc', color: 'white' }}>✈️</span>
                    Telegram
                </a>
                <a href="tel:+919999999999">
                    <span className="support-icon" style={{ background: '#4CAF50', color: 'white' }}>📞</span>
                    Call Us
                </a>
                <a href="mailto:support@susvada.com">
                    <span className="support-icon" style={{ background: '#EA4335', color: 'white' }}>📧</span>
                    Email
                </a>
                <Link href="/support">
                    <span className="support-icon" style={{ background: 'var(--gold)', color: 'white' }}>📋</span>
                    Submit Ticket
                </Link>
            </div>
            <button className="floating-support-btn" onClick={() => setOpen(!open)} aria-label="Support">
                {open ? '✕' : '💬'}
            </button>
        </div>
    );
}
