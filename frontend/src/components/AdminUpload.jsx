// src/components/AdminUpload.jsx
import React, { useState } from 'react';
import { getToken } from '../services/authService';

export default function AdminUpload() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !file) {
      setStatus('Name and image required');
      return;
    }
    setStatus('Uploading...');
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('price', price || '0');
      form.append('description', description);
      form.append('category', category);
      form.append('image', file);

      const token = getToken();
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }

      const created = await res.json();
      setStatus('Uploaded ✓');
      // clear form
      setName(''); setPrice(''); setDescription(''); setCategory(''); setFile(null);
      console.log('Created product', created);
    } catch (err) {
      console.error(err);
      setStatus('Upload error: ' + (err.message || err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
      <div>
        <label className="block">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="border p-2 w-full" />
      </div>
      <div>
        <label className="block">Price</label>
        <input value={price} onChange={e => setPrice(e.target.value)} className="border p-2 w-full" />
      </div>
      <div>
        <label className="block">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="border p-2 w-full" />
      </div>
      <div>
        <label className="block">Category</label>
        <input value={category} onChange={e => setCategory(e.target.value)} className="border p-2 w-full" />
      </div>
      <div>
        <label className="block">Image</label>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
      </div>
      <div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Upload product</button>
      </div>
      <div className="text-sm text-gray-600">{status}</div>
    </form>
  );
}
