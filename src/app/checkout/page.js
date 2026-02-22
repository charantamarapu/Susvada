'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

export default function CheckoutPage() {
    const { items, subtotal, clearCart } = useCart();
    const { user, apiFetch } = useAuth();
    const router = useRouter();
    const { toasts, addToast, removeToast } = useToast();

    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [deliveryMode, setDeliveryMode] = useState('asap');
    const [notes, setNotes] = useState('');
    const [step, setStep] = useState(1); // 1: address, 2: payment, 3: done
    const [upiData, setUpiData] = useState(null);
    const [utr, setUtr] = useState('');
    const [orderResult, setOrderResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isGift, setIsGift] = useState(false);
    const [giftMessage, setGiftMessage] = useState('');
    const [giftOccasion, setGiftOccasion] = useState('Birthday');
    const [giftRecipient, setGiftRecipient] = useState('');
    const [generatingMsg, setGeneratingMsg] = useState(false);
    const [messageEditing, setMessageEditing] = useState(false);

    // New address form
    const [showNewAddr, setShowNewAddr] = useState(false);
    const [newAddr, setNewAddr] = useState({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' });

    const canGiftWrap = items.some(item => item.category !== 'Cold-Pressed Oils');

    // Auto-disable gift option if cart becomes ineligible 
    useEffect(() => {
        if (!canGiftWrap && isGift) setIsGift(false);
    }, [canGiftWrap, isGift]);

    const shipping = subtotal >= 500 ? 0 : 60;
    const giftCharge = isGift ? 49 : 0;
    const total = subtotal + shipping + giftCharge;

    useEffect(() => {
        if (!user) { router.push('/auth/login'); return; }
        if (items.length === 0 && step === 1) { router.push('/cart'); return; }
        fetchAddresses();
    }, [user]);

    const fetchAddresses = async () => {
        const res = await apiFetch('/api/addresses');
        if (res.ok) {
            const data = await res.json();
            setAddresses(data.addresses);
            const def = data.addresses.find(a => a.is_default) || data.addresses[0];
            if (def) setSelectedAddress(def);
        }
    };

    const handleAddAddress = async () => {
        if (!newAddr.name || !newAddr.phone || !newAddr.line1 || !newAddr.city || !newAddr.state || !newAddr.pincode) {
            addToast('Please fill all required fields', 'error');
            return;
        }
        const res = await apiFetch('/api/addresses', {
            method: 'POST',
            body: JSON.stringify({ ...newAddr, is_default: addresses.length === 0 }),
        });
        if (res.ok) {
            addToast('Address added!');
            setShowNewAddr(false);
            setNewAddr({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' });
            fetchAddresses();
        }
    };

    const proceedToPayment = async () => {
        if (!selectedAddress) { addToast('Please select a delivery address', 'error'); return; }

        // Generate UPI QR
        const res = await apiFetch('/api/checkout/upi', {
            method: 'POST',
            body: JSON.stringify({ amount: total, orderId: 'TEMP' }),
        });
        if (res.ok) {
            const data = await res.json();
            setUpiData(data);
        }
        setStep(2);
    };

    const handleSubmitOrder = async () => {
        if (!utr || utr.replace(/\s/g, '').length < 10) {
            addToast('Please enter a valid UTR (minimum 10 digits)', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiFetch('/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    address: selectedAddress,
                    delivery_date: deliveryDate || null,
                    notes: notes || null,
                    utr: utr.replace(/\s/g, ''),
                    gift_wrap: isGift,
                    gift_message: isGift ? giftMessage : null,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setOrderResult(data.order);
                setStep(3);
            } else {
                const data = await res.json();
                addToast(data.error || 'Failed to place order', 'error');
            }
        } catch {
            addToast('Network error', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    // Calculate estimated delivery: 2 working days (skip Sat & Sun)
    const getWorkingDaysLater = (days) => {
        const date = new Date();
        let added = 0;
        while (added < days) {
            date.setDate(date.getDate() + 1);
            const day = date.getDay(); // 0=Sun, 6=Sat
            if (day !== 0 && day !== 6) added++;
        }
        return date;
    };
    const estDelivery = getWorkingDaysLater(2);
    const estDeliveryStr = estDelivery.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    // Minimum selectable date for 'Specific Date' is 3 days out
    const minDelivery = new Date();
    minDelivery.setDate(minDelivery.getDate() + 3);
    const minDate = minDelivery.toISOString().split('T')[0];

    return (
        <>
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <main className="main-content">
                <div className="page-header">
                    <div className="container">
                        <div className="breadcrumb">
                            <Link href="/">Home</Link> / <Link href="/cart">Cart</Link> / <span>Checkout</span>
                        </div>
                        <h1>Checkout</h1>
                        <p>Step {step} of 3</p>
                    </div>
                </div>

                <div className="container" style={{ paddingBottom: '3rem' }}>
                    {/* Step indicator */}
                    <div className="order-timeline" style={{ marginBottom: '2rem' }}>
                        <div className={`timeline-step ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}`}>
                            <div className="timeline-dot">{step > 1 ? '✓' : '📍'}</div>
                            <span className="timeline-label">Address</span>
                        </div>
                        <div className={`timeline-step ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}`}>
                            <div className="timeline-dot">{step > 2 ? '✓' : '💳'}</div>
                            <span className="timeline-label">Payment</span>
                        </div>
                        <div className={`timeline-step ${step >= 3 ? 'active' : ''}`}>
                            <div className="timeline-dot">✅</div>
                            <span className="timeline-label">Confirmation</span>
                        </div>
                    </div>

                    {/* Step 1: Address */}
                    {step === 1 && (
                        <div className="checkout-grid">
                            <div>
                                <div className="card" style={{ padding: 'var(--space-xl)' }}>
                                    <h3 style={{ marginBottom: '1rem' }}>📍 Delivery Address</h3>

                                    {addresses.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                                            {addresses.map(addr => (
                                                <label key={addr.id} style={{
                                                    display: 'flex', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)',
                                                    border: `2px solid ${selectedAddress?.id === addr.id ? 'var(--gold)' : 'rgba(197,165,90,0.15)'}`,
                                                    cursor: 'pointer', transition: 'border-color 0.2s',
                                                    background: selectedAddress?.id === addr.id ? 'var(--cream)' : 'transparent'
                                                }}>
                                                    <input
                                                        type="radio"
                                                        name="address"
                                                        checked={selectedAddress?.id === addr.id}
                                                        onChange={() => setSelectedAddress(addr)}
                                                        style={{ accentColor: 'var(--gold)' }}
                                                    />
                                                    <div>
                                                        <strong>{addr.label}</strong> {addr.is_default ? <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>DEFAULT</span> : null}
                                                        <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{addr.name} · {addr.phone}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    <button className="btn btn-outline btn-sm" onClick={() => setShowNewAddr(!showNewAddr)}>
                                        {showNewAddr ? 'Cancel' : '+ Add New Address'}
                                    </button>

                                    {showNewAddr && (
                                        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="form-group" style={{ gridColumn: '1/3' }}>
                                                <label className="form-label">Label</label>
                                                <select className="form-input" value={newAddr.label} onChange={e => setNewAddr({ ...newAddr, label: e.target.value })}>
                                                    <option>Home</option><option>Work</option><option>Other</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Full Name *</label>
                                                <input className="form-input" value={newAddr.name} onChange={e => setNewAddr({ ...newAddr, name: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Phone *</label>
                                                <input className="form-input" value={newAddr.phone} onChange={e => setNewAddr({ ...newAddr, phone: e.target.value })} />
                                            </div>
                                            <div className="form-group" style={{ gridColumn: '1/3' }}>
                                                <label className="form-label">Address Line 1 *</label>
                                                <input className="form-input" value={newAddr.line1} onChange={e => setNewAddr({ ...newAddr, line1: e.target.value })} />
                                            </div>
                                            <div className="form-group" style={{ gridColumn: '1/3' }}>
                                                <label className="form-label">Address Line 2</label>
                                                <input className="form-input" value={newAddr.line2} onChange={e => setNewAddr({ ...newAddr, line2: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">City *</label>
                                                <input className="form-input" value={newAddr.city} onChange={e => setNewAddr({ ...newAddr, city: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">State *</label>
                                                <input className="form-input" value={newAddr.state} onChange={e => setNewAddr({ ...newAddr, state: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Pincode *</label>
                                                <input className="form-input" value={newAddr.pincode} onChange={e => setNewAddr({ ...newAddr, pincode: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Country</label>
                                                <input className="form-input" value={newAddr.country} onChange={e => setNewAddr({ ...newAddr, country: e.target.value })} />
                                            </div>
                                            <div style={{ gridColumn: '1/3' }}>
                                                <button className="btn btn-primary" onClick={handleAddAddress}>Save Address</button>
                                            </div>
                                        </div>
                                    )}

                                    <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--cream-dark)' }} />

                                    <h3 style={{ marginBottom: '1rem' }}>📅 Delivery Date</h3>
                                    <div style={{
                                        display: 'inline-flex', borderRadius: '999px', overflow: 'hidden',
                                        border: '2px solid var(--gold)', marginBottom: '1rem'
                                    }}>
                                        <button
                                            onClick={() => { setDeliveryMode('asap'); setDeliveryDate(''); }}
                                            style={{
                                                padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                                                border: 'none', transition: 'all 0.2s',
                                                background: deliveryMode === 'asap' ? 'var(--gold)' : 'transparent',
                                                color: deliveryMode === 'asap' ? 'white' : 'var(--gold-dark)'
                                            }}
                                        >
                                            ⚡ ASAP
                                        </button>
                                        <button
                                            onClick={() => setDeliveryMode('specific')}
                                            style={{
                                                padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                                                border: 'none', transition: 'all 0.2s',
                                                background: deliveryMode === 'specific' ? 'var(--gold)' : 'transparent',
                                                color: deliveryMode === 'specific' ? 'white' : 'var(--gold-dark)'
                                            }}
                                        >
                                            📆 Specific Date
                                        </button>
                                    </div>
                                    {deliveryMode === 'asap' ? (
                                        <div>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                                We'll deliver your order as soon as possible
                                            </p>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                                padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                                                background: 'var(--cream)', border: '1px solid rgba(197,165,90,0.2)'
                                            }}>
                                                <span style={{ fontSize: '1.1rem' }}>📦</span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold-dark)' }}>
                                                    Estimated delivery by {estDeliveryStr}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                Delivery within 2 working days (Mon–Fri) across India
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                                Choose a preferred delivery date (for special occasions)
                                            </p>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={deliveryDate}
                                                min={minDate}
                                                onChange={e => setDeliveryDate(e.target.value)}
                                                style={{ maxWidth: '300px' }}
                                            />
                                        </div>
                                    )}

                                    <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--cream-dark)' }} />

                                    <h3 style={{ marginBottom: '0.5rem' }}>📝 Order Notes</h3>
                                    <textarea
                                        className="form-input"
                                        placeholder="Any special instructions? (optional)"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        style={{ minHeight: '80px' }}
                                    />

                                    {canGiftWrap && (
                                        <>
                                            <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--cream-dark)' }} />

                                            <h3 style={{ marginBottom: '0.75rem' }}>🎁 Gift Options</h3>
                                            <label style={{
                                                display: 'flex', gap: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-md)',
                                                border: `2px solid ${isGift ? 'var(--gold)' : 'rgba(197,165,90,0.15)'}`,
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                background: isGift ? 'var(--cream)' : 'transparent', alignItems: 'flex-start'
                                            }}>
                                                <input type="checkbox" checked={isGift} onChange={e => setIsGift(e.target.checked)} style={{ accentColor: 'var(--gold)', marginTop: '3px' }} />
                                                <div>
                                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Premium Gift Packaging — ₹49</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        Beautiful gift wrap with handwritten message card. Perfect for festivals & celebrations!
                                                    </div>
                                                </div>
                                            </label>
                                            {isGift && (
                                                <div style={{ marginTop: '0.75rem' }}>
                                                    <label className="form-label">💌 Gift Message</label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Occasion</label>
                                                            <select className="form-input" value={giftOccasion} onChange={e => setGiftOccasion(e.target.value)}>
                                                                <option>Birthday</option>
                                                                <option>Diwali</option>
                                                                <option>Wedding</option>
                                                                <option>Anniversary</option>
                                                                <option>Housewarming</option>
                                                                <option>Thank You</option>
                                                                <option>Get Well Soon</option>
                                                                <option>Congratulations</option>
                                                                <option>Just Because</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Recipient Name</label>
                                                            <input className="form-input" placeholder="e.g. Amma, Rahul..." value={giftRecipient} onChange={e => setGiftRecipient(e.target.value)} />
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        disabled={generatingMsg}
                                                        onClick={async () => {
                                                            setGeneratingMsg(true);
                                                            setMessageEditing(false);
                                                            try {
                                                                const res = await apiFetch('/api/gift-message', {
                                                                    method: 'POST',
                                                                    body: JSON.stringify({ occasion: giftOccasion, recipient: giftRecipient || 'someone special' }),
                                                                });
                                                                if (res.ok) {
                                                                    const data = await res.json();
                                                                    setGiftMessage(data.message);
                                                                } else {
                                                                    setGiftMessage('');
                                                                    setMessageEditing(true);
                                                                }
                                                            } catch { setMessageEditing(true); }
                                                            setGeneratingMsg(false);
                                                        }}
                                                        style={{ width: '100%', marginBottom: '0.75rem' }}
                                                    >
                                                        {generatingMsg ? '✨ Generating...' : '✨ Generate Message with AI'}
                                                    </button>
                                                    {giftMessage && !messageEditing && (
                                                        <div style={{ padding: '1rem', background: 'rgba(197,165,90,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(197,165,90,0.2)' }}>
                                                            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', margin: '0 0 0.5rem', lineHeight: 1.6 }}>"{giftMessage}"</p>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button type="button" className="btn btn-sm btn-outline" onClick={() => setMessageEditing(true)}>✏️ Edit</button>
                                                                <button type="button" className="btn btn-sm btn-outline" disabled={generatingMsg} onClick={async () => {
                                                                    setGeneratingMsg(true);
                                                                    try {
                                                                        const res = await apiFetch('/api/gift-message', {
                                                                            method: 'POST',
                                                                            body: JSON.stringify({ occasion: giftOccasion, recipient: giftRecipient || 'someone special' }),
                                                                        });
                                                                        if (res.ok) { const data = await res.json(); setGiftMessage(data.message); }
                                                                    } catch { }
                                                                    setGeneratingMsg(false);
                                                                }}>🔄 Regenerate</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(messageEditing || !giftMessage) && (
                                                        <div>
                                                            <textarea
                                                                className="form-input"
                                                                placeholder="Or type your own message here..."
                                                                value={giftMessage}
                                                                onChange={e => setGiftMessage(e.target.value)}
                                                                maxLength={200}
                                                                style={{ minHeight: '70px' }}
                                                            />
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>{giftMessage.length}/200</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div style={{ marginTop: '1.5rem' }}>
                                    <button className="btn btn-primary btn-lg btn-block" onClick={proceedToPayment}>
                                        Continue to Payment →
                                    </button>
                                </div>
                            </div>

                            <div className="order-summary-card">
                                <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
                                {items.map(item => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                        <span>{item.name} × {item.quantity}</span>
                                        <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--cream-dark)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Shipping</span>
                                    <span style={{ color: shipping === 0 ? 'var(--success)' : '' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                                </div>
                                {isGift && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>🎁 Gift Packaging</span>
                                        <span>₹49</span>
                                    </div>
                                )}
                                <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--cream-dark)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem' }}>
                                    <span>Total</span><span style={{ color: 'var(--gold-dark)' }}>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: UPI Payment */}
                    {step === 2 && (
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <div className="card" style={{ padding: 'var(--space-xl)' }}>
                                <div className="upi-section">
                                    <h3 style={{ marginBottom: '0.5rem' }}>💳 Pay via UPI</h3>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        Scan the QR code or tap the button below to pay ₹{total.toFixed(2)}
                                    </p>

                                    {upiData?.qrDataURL && (
                                        <img src={upiData.qrDataURL} alt="UPI QR Code" className="upi-qr-img" style={{ width: '250px', height: '250px' }} />
                                    )}

                                    {upiData?.upiLink && (
                                        <a href={upiData.upiLink} className="btn btn-primary btn-lg" style={{ display: 'inline-flex', marginTop: '1rem' }}>
                                            📱 Open UPI App & Pay ₹{total.toFixed(2)}
                                        </a>
                                    )}

                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                                        Supports GPay, PhonePe, Paytm, BHIM & all UPI apps
                                    </p>
                                </div>

                                <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--cream-dark)' }} />

                                <div>
                                    <h3 style={{ marginBottom: '0.5rem' }}>🔑 Enter UTR / Transaction Reference</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        After making the payment, enter your 12-digit UTR / Transaction Reference Number below
                                    </p>
                                    <div className="form-group">
                                        <label className="form-label">UTR / Transaction Reference Number *</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g., 423156789012"
                                            value={utr}
                                            onChange={e => setUtr(e.target.value)}
                                            maxLength={30}
                                            style={{ fontSize: '1.1rem', letterSpacing: '1px', fontWeight: 600 }}
                                        />
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                            You can find this in your UPI app's transaction history
                                        </p>
                                    </div>

                                    <button
                                        className="btn btn-primary btn-lg btn-block"
                                        onClick={handleSubmitOrder}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Submitting...' : `Submit Order — ₹${total.toFixed(2)}`}
                                    </button>

                                    <button className="btn btn-sm" style={{ marginTop: '1rem', color: 'var(--text-muted)' }} onClick={() => setStep(1)}>
                                        ← Back to Address
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && orderResult && (
                        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
                            <div className="card" style={{ padding: 'var(--space-2xl)' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                                <h2 style={{ marginBottom: '0.5rem' }}>Order Placed!</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    Your order has been submitted successfully
                                </p>

                                <div style={{ background: 'var(--cream)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                        Order ID: {orderResult.order_id}
                                    </div>
                                    <div className="status-badge status-pending" style={{ display: 'inline-flex' }}>
                                        ⏳ Pending Verification
                                    </div>
                                </div>

                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    We'll verify your payment and update the status shortly.
                                    You'll be able to track your order from your account.
                                </p>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <Link href="/account" className="btn btn-primary">View Orders</Link>
                                    <Link href="/products" className="btn btn-outline">Continue Shopping</Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
