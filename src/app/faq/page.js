'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div
            style={{
                borderBottom: '1px solid rgba(197,165,90,0.1)',
                cursor: 'pointer',
            }}
            onClick={() => setOpen(!open)}
        >
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1.25rem 0', gap: '1rem',
            }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>{q}</h3>
                <span style={{
                    fontSize: '1.25rem', transition: 'transform 0.3s ease',
                    transform: open ? 'rotate(45deg)' : 'rotate(0)',
                    flexShrink: 0, color: 'var(--gold)',
                }}>+</span>
            </div>
            <div style={{
                maxHeight: open ? '500px' : '0', overflow: 'hidden',
                transition: 'max-height 0.3s ease, padding 0.3s ease',
                paddingBottom: open ? '1.25rem' : '0',
            }}>
                <p style={{
                    color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7',
                    margin: 0, whiteSpace: 'pre-line',
                }}>{a}</p>
            </div>
        </div>
    );
}

export default function FAQPage() {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => setSettings(data.settings))
            .catch(() => setSettings({ min_free_delivery: '500', domestic_shipping: '60', international_shipping: '500' }));
    }, []);

    if (!settings) {
        return (
            <>
                <Header />
                <main className="main-content">
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
                </main>
                <Footer />
            </>
        );
    }

    const minFree = settings.min_free_delivery;
    const domesticFee = settings.domestic_shipping;
    const intlFee = settings.international_shipping;

    const faqs = [
        {
            category: '📦 Orders & Delivery',
            items: [
                {
                    q: 'How do I place an order?',
                    a: 'Browse our products, add items to your cart, proceed to checkout, enter your delivery address and make the payment via UPI. Your order will be confirmed once we verify the payment.'
                },
                {
                    q: 'How long does delivery take?',
                    a: 'Domestic orders are delivered within 3-5 working days after payment confirmation. The earliest selectable delivery date is 3 working days from order placement (excluding weekends).'
                },
                {
                    q: 'Do you deliver internationally?',
                    a: 'Yes! We ship internationally. International orders may take 7-14 working days depending on the destination country.'
                },
                {
                    q: 'Is there free delivery?',
                    a: `Yes, domestic orders above ₹${minFree} qualify for free delivery. Orders below ₹${minFree} have a flat ₹${domesticFee} domestic shipping fee. International shipping is ₹${intlFee}.`
                },
            ]
        },
        {
            category: '💸 Cancellation & Refund Policy',
            items: [
                {
                    q: 'Can I cancel my order?',
                    a: 'Yes, you can cancel your order before it is shipped. Go to "My Account" → "My Orders" and click "Cancel Order". Please note that refund percentages vary depending on the order status.'
                },
                {
                    q: 'What is the refund policy for domestic / in-stock orders?',
                    a: `Our refund policy for domestic orders (items that are in stock and available for immediate dispatch):

• Before payment confirmation (Pending Verification) → 100% refund
• After payment confirmation but before shipping (Processing) → 75% refund
• After shipping → No cancellation or refund possible

The 25% deduction on processing orders covers preparation, packaging, and handling costs.`
                },
                {
                    q: 'What about pre-order, made-to-order, or international orders?',
                    a: `For pre-order items, made-to-order items, and international orders:

• Before payment confirmation → 100% refund
• After payment confirmation (Processing / Preparation started) → 75% refund
• After shipping → No cancellation or refund possible

Since these orders require special preparation, the 25% deduction covers the preparation and material costs already incurred.`
                },
                {
                    q: 'How do I receive my refund?',
                    a: 'When you cancel an order, you\'ll be asked to provide your UPI ID or Bank Account details (Account Number + IFSC Code). We process all refunds within 24 hours of cancellation to the details you provide.'
                },
                {
                    q: 'Why do I need to provide my UPI/Bank details?',
                    a: 'Since payments are made via UPI, we cannot automatically reverse the transaction. To ensure a smooth and quick refund, we need your UPI ID or bank account details to transfer the refund amount directly to you.'
                },
                {
                    q: 'How long does the refund take?',
                    a: 'We process refunds within 24 hours of your cancellation request. The actual time for the amount to reflect in your account depends on your bank (usually instant for UPI, 2-3 days for bank transfers).'
                },
            ]
        },
        {
            category: '💳 Payment',
            items: [
                {
                    q: 'What payment methods do you accept?',
                    a: 'We currently accept payments via UPI (Google Pay, PhonePe, Paytm, or any UPI app). After making the payment, enter the UTR (transaction reference number) to confirm your order.'
                },
                {
                    q: 'What is a UTR number?',
                    a: 'UTR (Unique Transaction Reference) is a 12-digit number generated for every UPI transaction. You can find it in your payment app\'s transaction history. We use this to verify your payment.'
                },
            ]
        },
        {
            category: '🛡️ Quality & Freshness',
            items: [
                {
                    q: 'How do you ensure product freshness?',
                    a: 'All our sweets and snacks are freshly prepared and packed with care. Each product has a clearly mentioned shelf life. We recommend consuming them within the specified period for the best taste.'
                },
                {
                    q: 'What if I receive a damaged or wrong product?',
                    a: 'If you receive a damaged or incorrect product, please contact us immediately with photos. We will arrange a replacement or full refund at no extra cost.'
                },
            ]
        }
    ];

    return (
        <>
            <Header />
            <main className="main-content">
                <div className="page-header">
                    <div className="container">
                        <h1>Frequently Asked Questions</h1>
                        <p>Everything you need to know about ordering, delivery, and refunds</p>
                    </div>
                </div>

                <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
                    {faqs.map((section, idx) => (
                        <div key={idx} style={{ marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--gold-dark)' }}>
                                {section.category}
                            </h2>
                            <div className="card" style={{ padding: '0 1.5rem' }}>
                                {section.items.map((item, i) => (
                                    <FAQItem key={i} q={item.q} a={item.a} />
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="card" style={{
                        padding: '2rem', textAlign: 'center', marginTop: '2rem',
                        background: 'rgba(197,165,90,0.05)', border: '1px solid rgba(197,165,90,0.15)'
                    }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Still have questions?</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Feel free to reach out to us and we'll get back to you as soon as possible.
                        </p>
                        <a href="/support" className="btn btn-primary">Contact Us</a>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
