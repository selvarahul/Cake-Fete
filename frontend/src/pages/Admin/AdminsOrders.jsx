// src/pages/Admin/AdminOrders.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const getToken = () => localStorage.getItem('token');

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    try {
      const token = getToken();
      const res = await axios.get('/api/orders', { headers: { Authorization: `Bearer ${token}` }});
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function updateStatus(id, status) {
    try {
      const token = getToken();
      const res = await axios.put(`/api/orders/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` }});
      setOrders(prev => prev.map(o => o.id === id ? res.data : o));
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  }

  return (
    <div>
      <h2>Orders ({orders.length})</h2>
      {orders.map(o => (
        <div key={o.id} style={{ border:'1px solid #ddd', padding:12, marginBottom:8 }}>
          <div><strong>Order #{o.id}</strong> — {o.customerName} — ₹{Number(o.totalAmount).toFixed(2)}</div>
          <div>Phone: {o.customerPhone}</div>
          <div>Address: {o.customerAddress}</div>
          <div>Delivery: {o.deliveryDate} {o.deliveryTime || ''}</div>
          <div>Status: {o.status}</div>

          <div>
            <strong>Items:</strong>
            <ul>
              {Array.isArray(o.items) ? o.items.map((it, i) => <li key={i}>{it.name} x {it.quantity} — ₹{it.price}</li>) : <li>{JSON.stringify(o.items)}</li>}
            </ul>
          </div>

          <div>
            <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="preparing">preparing</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
