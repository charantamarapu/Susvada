'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ToastContainer, useToast } from '@/components/Toast';

export default function AdminProductsPage() {
    const { apiFetch } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        name: '', description: '', short_description: '', category: 'Sweets',
        price: '', compare_price: '', weight: '', unit: 'g',
        shelf_life_days: 30, stock: 0, status: 'active', is_preorder: false
    });
    const { toasts, addToast, removeToast } = useToast();

    const fetchProducts = async () => {
        const res = await apiFetch('/api/admin/products');
        if (res.ok) {
            const data = await res.json();
            setProducts(data.products);
        }
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    const resetForm = () => {
        setForm({
            name: '', description: '', short_description: '', category: 'Sweets',
            price: '', compare_price: '', weight: '', unit: 'g',
            shelf_life_days: 30, stock: 0, status: 'active', is_preorder: false
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (p) => {
        setForm({
            name: p.name, description: p.description || '', short_description: p.short_description || '',
            category: p.category, price: p.price, compare_price: p.compare_price || '',
            weight: p.weight || '', unit: p.unit || 'g', shelf_life_days: p.shelf_life_days || 30,
            stock: p.stock, status: p.status, is_preorder: !!p.is_preorder
        });
        setEditingId(p.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.price) { addToast('Name and price required', 'error'); return; }

        const body = { ...form, price: parseFloat(form.price), compare_price: form.compare_price ? parseFloat(form.compare_price) : null, stock: parseInt(form.stock) };

        let res;
        if (editingId) {
            res = await apiFetch('/api/admin/products', { method: 'PUT', body: JSON.stringify({ id: editingId, ...body }) });
        } else {
            res = await apiFetch('/api/admin/products', { method: 'POST', body: JSON.stringify(body) });
        }

        if (res.ok) {
            addToast(editingId ? 'Product updated!' : 'Product created!');
            resetForm();
            fetchProducts();
        } else {
            const data = await res.json();
            addToast(data.error || 'Failed', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return;
        const res = await apiFetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
        if (res.ok) { addToast('Product deleted'); fetchProducts(); }
    };

    return (
        <div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="admin-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Products</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{products.length} products</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    {showForm ? 'Cancel' : '+ Add Product'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Product' : 'New Product'}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Name *</label>
                            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Category *</label>
                            <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                <option>Sweets</option><option>Snacks</option><option>Cold-Pressed Oils</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/3' }}>
                            <label className="form-label">Short Description</label>
                            <input className="form-input" value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/3' }}>
                            <label className="form-label">Description</label>
                            <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Price (₹) *</label>
                            <input type="number" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Compare Price (₹)</label>
                            <input type="number" className="form-input" value={form.compare_price} onChange={e => setForm({ ...form, compare_price: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Weight</label>
                            <input className="form-input" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Unit</label>
                            <select className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                                <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option><option value="pcs">pcs</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stock</label>
                            <input type="number" className="form-input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Shelf Life (days)</label>
                            <input type="number" className="form-input" value={form.shelf_life_days} onChange={e => setForm({ ...form, shelf_life_days: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option value="active">Active</option><option value="draft">Draft</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" checked={form.is_preorder} onChange={e => setForm({ ...form, is_preorder: e.target.checked })} id="preorder" style={{ accentColor: 'var(--gold)' }} />
                            <label htmlFor="preorder" style={{ fontWeight: 500 }}>Pre-Order</label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'} Product</button>
                        <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Shelf Life</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <strong>{p.name}</strong>
                                    {p.is_preorder ? <span className="product-badge badge-preorder" style={{ position: 'static', marginLeft: '0.5rem' }}>PRE</span> : null}
                                </td>
                                <td>{p.category}</td>
                                <td>
                                    <strong>₹{p.price}</strong>
                                    {p.compare_price && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '0.25rem' }}>₹{p.compare_price}</span>}
                                </td>
                                <td>
                                    <span style={{ color: p.stock < 10 ? 'var(--danger)' : 'var(--text-primary)', fontWeight: p.stock < 10 ? 700 : 400 }}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td>{p.shelf_life_days}d</td>
                                <td>
                                    <span className={`status-badge ${p.status === 'active' ? 'status-processing' : 'status-cancelled'}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button className="btn btn-sm btn-outline" onClick={() => handleEdit(p)}>Edit</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
