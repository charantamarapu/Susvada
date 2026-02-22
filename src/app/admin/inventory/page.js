'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

export default function AdminInventoryPage() {
    const { apiFetch } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {
        apiFetch('/api/admin/products')
            .then(r => r.json())
            .then(d => { setProducts(d.products); setLoading(false); });
    }, []);

    const handleExport = async () => {
        const res = await apiFetch('/api/admin/inventory');
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'susvada_inventory.xlsx';
            a.click();
            URL.revokeObjectURL(url);
            addToast('Inventory exported!');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiFetch('/api/admin/inventory', {
            method: 'POST',
            body: formData,
            headers: {},
        });
        if (res.ok) {
            const data = await res.json();
            addToast(`Imported: ${data.created} created, ${data.updated} updated`);
            // Refresh products
            const res2 = await apiFetch('/api/admin/products');
            if (res2.ok) {
                const data2 = await res2.json();
                setProducts(data2.products);
            }
        } else {
            addToast('Import failed', 'error');
        }
        setImporting(false);
        e.target.value = '';
    };

    return (
        <div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="admin-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Inventory</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage stock levels and bulk operations</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" onClick={handleExport}>📥 Export Excel</button>
                    <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                        📤 {importing ? 'Importing...' : 'Import Excel'}
                        <input type="file" accept=".xlsx,.csv,.xls" onChange={handleImport} style={{ display: 'none' }} />
                    </label>
                </div>
            </div>

            <div style={{ background: 'var(--cream)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <strong>💡 Bulk Import Instructions:</strong> Upload an Excel/CSV file with columns: <code>id</code>, <code>name</code>, <code>category</code>, <code>price</code>, <code>stock</code>, <code>shelf_life_days</code>, <code>manufactured_date</code>, <code>shipping_scope</code> (<code>exportable</code> or <code>india_only</code>, default: <code>exportable</code>).
                Rows with an <code>id</code> will update existing products. Rows without <code>id</code> (but with name, category, price) will create new products.
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
            ) : (
                <>
                    {/* Alerts */}
                    {products.filter(p => p.stock < 10 && p.status === 'active').length > 0 && (
                        <div style={{ background: '#FEF3CD', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
                            <strong>⚠️ Low Stock Alert:</strong> {products.filter(p => p.stock < 10 && p.status === 'active').map(p => p.name).join(', ')}
                        </div>
                    )}

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Shelf Life</th>
                                <th>Status</th>
                                <th>Shipping</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td><strong>{p.name}</strong></td>
                                    <td>{p.category}</td>
                                    <td>₹{p.price}</td>
                                    <td>
                                        <span style={{
                                            fontWeight: 700,
                                            color: p.stock === 0 ? 'var(--danger)' : p.stock < 10 ? 'var(--warning)' : 'var(--success)'
                                        }}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td>{p.shelf_life_days} days</td>
                                    <td>
                                        <span className={`status-badge ${p.status === 'active' ? 'status-processing' : 'status-cancelled'}`}>{p.status}</span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: p.shipping_scope === 'india_only' ? 'var(--danger)' : 'var(--success)' }}>
                                            {p.shipping_scope === 'india_only' ? '🇮🇳 India Only' : '🌍 Exportable'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}
