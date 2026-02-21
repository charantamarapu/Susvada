import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { CartProvider } from '@/components/CartProvider';

export const metadata = {
    title: 'Susvada — Premium Export Quality Sweets, Snacks & Cold-Pressed Oils',
    description: 'Discover Susvada\'s handcrafted premium sweets, traditional snacks, and cold-pressed oils. Export quality, 100% natural ingredients, delivered fresh to your doorstep.',
    keywords: 'sweets, snacks, cold-pressed oils, premium food, Indian sweets, export quality, Mysore Pak, Kaju Katli, groundnut oil, coconut oil',
};

function LayoutInner({ children }) {
    return children;
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <CartProvider>
                        {children}
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
