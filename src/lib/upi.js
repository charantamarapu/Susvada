const QRCode = require('qrcode');

function generateUPILink(amount, orderId, upiId, merchantName = 'Susvada') {
    const params = new URLSearchParams({
        pa: upiId,
        pn: merchantName,
        am: amount.toFixed(2),
        tr: orderId,
        cu: 'INR',
        tn: `Order ${orderId}`,
    });
    return `upi://pay?${params.toString()}`;
}

async function generateQRDataURL(upiLink) {
    try {
        return await QRCode.toDataURL(upiLink, {
            width: 300,
            margin: 2,
            color: {
                dark: '#1a1a2e',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
        });
    } catch (err) {
        console.error('QR generation failed:', err);
        return null;
    }
}

function isMobileDevice(userAgent) {
    if (!userAgent) return false;
    return /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

module.exports = { generateUPILink, generateQRDataURL, isMobileDevice };
