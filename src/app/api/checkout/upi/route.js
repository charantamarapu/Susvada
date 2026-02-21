import { NextResponse } from 'next/server';
const { generateUPILink, generateQRDataURL, isMobileDevice } = require('@/lib/upi');
const { getDb } = require('@/lib/db');

export async function POST(request) {
    try {
        const { amount, orderId } = await request.json();

        if (!amount || !orderId) {
            return NextResponse.json({ error: 'Amount and orderId required' }, { status: 400 });
        }

        // Read UPI ID from database settings (updated via admin panel), fallback to env
        const db = getDb();
        const upiSetting = db.prepare("SELECT value FROM settings WHERE key = ?").get('merchant_upi_id');
        const upiId = upiSetting?.value || process.env.MERCHANT_UPI_ID || 'merchant@upi';

        const upiLink = generateUPILink(amount, orderId, upiId);
        const qrDataURL = await generateQRDataURL(upiLink);
        const userAgent = request.headers.get('user-agent');
        const isMobile = isMobileDevice(userAgent);

        return NextResponse.json({
            upiLink,
            qrDataURL,
            isMobile,
            merchantVpa: upiId,
        });
    } catch (err) {
        console.error('UPI QR error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
