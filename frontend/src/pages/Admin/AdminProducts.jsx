// src/pages/Admin/AdminProducts.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css'; // reuse styles (or create AdminProducts.css)

const getToken = () => localStorage.getItem('token');

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  // openAdd now navigates to separate add page
  function openAdd() {
    navigate('/admin/products/new');
  }

  function openEdit(p) {
    // keep edit in-page modal or navigate to edit route if you have one
    // for simplicity, navigate to a placeholder edit route (implement if needed)
    navigate(`/admin/products/edit/${p.id}`);
  }

  function resetAndRefresh() {
    setMessage('');
    fetchProducts();
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) return;
    try {
      const token = getToken();
      await axios.delete(`/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed');
    }
  }

  async function toggleInStock(id, current) {
    try {
      const token = getToken();
      const form = new FormData();
      form.append('inStock', (!current).toString());
      const res = await axios.put(`/api/products/${id}`, form, { headers: { Authorization: `Bearer ${token}` }});
      const updated = res.data;
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      console.error('Toggle failed', err);
      alert('Update failed');
    }
  }

  const filtered = products.filter(p => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
  });

  return (
    <div className="admin-dashboard container">
      <h2>Admin — Products</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
          <button className="btn" onClick={resetAndRefresh}>Refresh</button>
        </div>

        <div>
          <input placeholder="Search by name or category" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      {loading ? <div>Loading…</div> : (
        <div className="grid products-admin-grid">
          {filtered.map(p => {
            const imageUrl = p.imageUrl && !p.imageUrl.startsWith('http') ? `http://localhost:1573${p.imageUrl}` : p.imageUrl;
            return (
              <div key={p.id} className="product-row card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={imageUrl || 'https://via.placeholder.com/120'} alt={p.name} width={100} onError={(e) => e.target.src='https://via.placeholder.com/120'} />
                <div style={{ flex: 1 }}>
                  <div><strong>{p.name}</strong></div>
                  <div className="muted">₹{Number(p.price || 0).toFixed(2)}</div>
                  <div className="muted">{p.category}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => deleteProduct(p.id)}>Delete</button>
                  <button className="btn" onClick={() => toggleInStock(p.id, p.inStock)}>{p.inStock ? 'Mark Out' : 'Mark In'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {message && <div style={{ marginTop: 8 }} className="muted">{message}</div>}
    </div>
  );
}
