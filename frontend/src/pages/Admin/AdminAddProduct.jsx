import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminAddProduct.css'; // scoped styles for Add Product page

const getToken = () => localStorage.getItem('token');

export default function AdminAddProduct() {
  const navigate = useNavigate();

  // form state
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');

  // products list
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchProducts();
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line
  }, []);

  async function fetchProducts() {
    setLoadingProducts(true);
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products', err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  function clearForm() {
    setEditingId(null);
    setName('');
    setPrice('');
    setCategory('');
    setDescription('');
    setInStock(true);
    setFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadProgress(0);
    setMessage('');
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl(null);
  }

  // populate form for editing
  function startEdit(p) {
    setEditingId(p.id);
    setName(p.name || '');
    setPrice(p.price != null ? String(p.price) : '');
    setCategory(p.category || '');
    setDescription(p.description || '');
    setInStock(Boolean(p.inStock));
    setFile(null);
    // if stored as relative path, adjust base if needed (example)
    const imageUrl = p.imageUrl && !p.imageUrl.startsWith('http') ? `http://localhost:1573${p.imageUrl}` : p.imageUrl;
    setPreviewUrl(imageUrl || null);
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    if (!name) { setMessage('Name required'); return; }

    try {
      const token = getToken();
      if (!token) { setMessage('Not authenticated'); return; }

      const form = new FormData();
      form.append('name', name);
      form.append('price', Number(isNaN(parseFloat(price)) ? 0 : parseFloat(price)));
      form.append('category', category || '');
      form.append('inStock', inStock ? 'true' : 'false');
      if (file) form.append('image', file);

      setUploadProgress(0);

      if (editingId) {
        // edit
        const res = await axios.put(`/api/products/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (ev) => { if (ev.total) setUploadProgress(Math.round((ev.loaded * 100) / ev.total)); }
        });
        setMessage('Product updated');
        // update list locally (optimistic) and refresh
        await fetchProducts();
        clearForm();
      } else {
        // create
        const res = await axios.post('/api/products', form, {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (ev) => { if (ev.total) setUploadProgress(Math.round((ev.loaded * 100) / ev.total)); }
        });
        setMessage('Product created');
        await fetchProducts();
        clearForm();
      }
    } catch (err) {
      console.error('Save failed', err);
      setMessage(err?.response?.data?.error || 'Save failed');
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product? This action cannot be undone.')) return;
    try {
      const token = getToken();
      await axios.delete(`/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      setMessage('Product deleted');
      // If we were editing this product, clear form
      if (editingId === id) clearForm();
      await fetchProducts();
    } catch (err) {
      console.error('Delete failed', err);
      setMessage('Delete failed');
    }
  }

  async function toggleInStock(id, current) {
    try {
      const token = getToken();
      const form = new FormData();
      form.append('inStock', (!current).toString());
      const res = await axios.put(`/api/products/${id}`, form, { headers: { Authorization: `Bearer ${token}` }});
      setMessage('Product updated');
      await fetchProducts();
    } catch (err) {
      console.error('Toggle failed', err);
      setMessage('Update failed');
    }
  }

  const filtered = products.filter(p => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
  });

  return (
    /* WRAPPER ADDED: centers the card without changing form internals */
    <div className="admin-add-product">
      <div className="admin-add-inner page-container">
        <header className="topbar" style={{ marginBottom: 12 }}>
          <h1>{editingId ? 'Edit Product' : 'Add Product'}</h1>
          <div className="controls">
            <button className="btn" onClick={() => { clearForm(); navigate('/admin/dashboard'); }}>← Back to Orders</button>
          </div>
        </header>

        {/* THIS is the card you asked to center — unchanged internals */}
        <div className="card" style={{ padding: 16, maxWidth: 920, marginBottom: 18 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row"><label>Name *</label><input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="form-row"><label>Price</label><input value={price} onChange={e => setPrice(e.target.value)} /></div>
            <div className="form-row"><label>Category</label><input value={category} onChange={e => setCategory(e.target.value)} /></div>
            <div className="form-row"><label>In stock</label>
              <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} />
            </div>

            <div className="form-row"><label>Image {editingId ? '(choose to replace)' : ''}</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            {previewUrl && (
              <div className="form-row preview">
                <img src={previewUrl} alt="preview" style={{ maxWidth: 320 }} />
              </div>
            )}

            {uploadProgress > 0 && (
              <div className="form-row">
                <div className="progress-bar" style={{ width: '100%', background: 'rgba(0,0,0,0.06)', borderRadius: 8, overflow: 'hidden' }}>
                  <div className="progress" style={{ width: `${uploadProgress}%`, height: 8 }} />
                </div>
                <small>{uploadProgress}%</small>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="btn" onClick={() => { clearForm(); }}>Reset</button>
              <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Product'}</button>
              {editingId && <button type="button" className="btn" onClick={() => { clearForm(); }}>Cancel Edit</button>}
            </div>

            {message && <div style={{ marginTop: 10 }} className="muted">{message}</div>}
          </form>
        </div>

        {/* Existing products list (unchanged) */}
        <section className="card orders-list" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Existing Products</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => fetchProducts()}>Refresh</button>
              <input placeholder="Filter name / category" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>

          {loadingProducts ? (
            <div className="muted">Loading products…</div>
          ) : filtered.length === 0 ? (
            <div className="muted">No products found.</div>
          ) : (
            <div className="list-rows" style={{ display: 'grid', gap: 10 }}>
              {filtered.map(p => {
                const imageUrl = p.imageUrl && !p.imageUrl.startsWith('http') ? `http://localhost:1573${p.imageUrl}` : p.imageUrl;
                return (
                  <div key={p.id} className="product-row card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
                    <img src={imageUrl || 'https://via.placeholder.com/120'} alt={p.name} width={100} onError={(e) => e.target.src='https://via.placeholder.com/120'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{p.name}</div>
                          <div className="muted">₹{Number(p.price || 0).toFixed(2)} • {p.category || '—'}</div>
                        </div>
                        <div className="muted" style={{ textAlign: 'right' }}>
                          {p.inStock ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>In stock</span> : <span style={{ color: 'var(--red)', fontWeight: 700 }}>Out of stock</span>}
                          <div style={{ fontSize: 12, marginTop: 6 }}>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</div>
                        </div>
                      </div>

                      {p.description && <div style={{ marginTop: 8 }} className="muted">{p.description}</div>}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" onClick={() => startEdit(p)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => deleteProduct(p.id)}>Delete</button>
                      <button className="btn" onClick={() => toggleInStock(p.id, p.inStock)}>{p.inStock ? 'Mark Out' : 'Mark In'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
