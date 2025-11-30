// src/pages/Orders.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Orders.css';

const Orders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderIdFromState = location.state?.orderId || null;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderIdFromState));
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderIdFromState) fetchOrder(orderIdFromState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdFromState]);

  async function fetchOrder(id) {
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      console.log('Orders.jsx: fetching order id=', id);
      const res = await fetch(`/api/orders/${id}`, { method: 'GET', headers: { 'Accept': 'application/json' } });

      console.log('Orders.jsx: response status', res.status);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { data = text; }

      console.log('Orders.jsx: response body', data);

      if (!res.ok) {
        const errMsg = (data && data.error) ? data.error : `HTTP ${res.status}`;
        setError(`Server returned: ${errMsg}`);
        return;
      }

      setOrder(data);
    } catch (err) {
      console.error('Orders.jsx: fetch failed', err);
      setError('Network error: could not fetch order');
    } finally {
      setLoading(false);
    }
  }

  async function downloadReceipt(id) {
    try {
      console.log('Orders.jsx: download receipt for', id);
      const res = await fetch(`/api/orders/${id}/receipt`);
      if (!res.ok) {
        const text = await res.text();
        console.error('Receipt fetch failed', res.status, text);
        alert('Could not download receipt: ' + (text || res.status));
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-order-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Receipt download failed', err);
      alert('Could not download receipt.');
    }
  }

  // If no order id was passed by navigation state
  if (!orderIdFromState) {
    return (
      <div className="orders-page page-container">
        <div className="no-order-top">
          <h2>No Order Selected</h2>
          <p>No order was passed to this page. Place an order from the cart and you'll be redirected here.</p>
          <div className="no-order-actions">
            <button className="btn btn-primary" onClick={() => navigate('/products')}>Browse Products</button>
            <button className="btn btn-outline" onClick={() => navigate('/')}>Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page page-container">
      {loading ? (
        <div className="order-loading">Loading order…</div>
      ) : error ? (
        <div className="order-error">{error}</div>
      ) : !order ? (
        <div className="order-missing">
          <h3>Order not found</h3>
          <p>We couldn't find an order with id <strong>{orderIdFromState}</strong>. Please check your server logs.</p>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-outline" onClick={() => navigate('/products')}>Browse Products</button>
          </div>
        </div>
      ) : (
        <>
          {/* Top hero confirmation */}
          <section className="order-success">
            <div className="order-success-inner">
              <div className="order-left">
                <div className="success-icon" aria-hidden>🎉</div>
                <h1 className="success-title">Order Confirmed</h1>
                <p className="success-sub">Thank you — your order has been placed successfully.</p>

                <div className="order-id-wrap">
                  <span className="order-id-label">Order ID</span>
                  <span className="order-id">{order.id ?? order._id ?? orderIdFromState}</span>
                </div>

                <div className="order-quick">
                  <div><strong>{order.customerName}</strong></div>
                  <div className="muted">{order.customerPhone}</div>
                </div>
              </div>

              <div className="order-actions">
                <div className="order-meta">
                  <div className="meta-row"><span>Placed</span><strong>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</strong></div>
                  <div className="meta-row"><span>Status</span><strong className={`status ${order.status || 'pending'}`}>{order.status || 'pending'}</strong></div>
                  <div className="meta-row"><span>Total</span><strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong></div>
                </div>

                <div className="hero-actions">
                  <button className="btn btn-primary" onClick={() => downloadReceipt(order.id ?? order._id ?? orderIdFromState)}>
                    Download Receipt
                  </button>

                  {/* Updated: user-facing orders route */}
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      // Primary attempt: navigate to user-facing orders page
                      navigate('/my-orders');

                      // As a safety fallback (in case your app redirects /my-orders to admin),
                      // wait a brief moment and if the path looks like admin-login, go to '/orders' instead.
                      // NOTE: This is a conservative approach; adjust to your app's routing convention.
                      setTimeout(() => {
                        const path = window.location.pathname || '';
                        // if our new route redirected to an admin login path, try a safer fallback
                        if (path.includes('/admin') || path.includes('/login')) {
                          navigate('/orders');
                        }
                      }, 350);
                    }}
                  >
                    View All Orders
                  </button>

                  <button className="btn" onClick={() => navigate('/products')}>Continue Shopping</button>
                </div>
              </div>
            </div>
          </section>

          {/* details card */}
          <div className="detail-section">
            <div className="detail-card">
              <h3>Order details</h3>

              <div className="detail-grid">
                <div>
                  <h4>Shipping</h4>
                  <div>{order.customerName}</div>
                  <div className="muted">{order.customerPhone}</div>
                  <div className="muted">{order.customerAddress}</div>
                </div>

                <div>
                  <h4>Delivery</h4>
                  <div>{order.deliveryDate ?? '—'}</div>
                  <div className="muted">{order.deliveryTime ?? '—'}</div>
                </div>

                <div>
                  <h4>Payment</h4>
                  <div>{order.paymentMethod ? order.paymentMethod.toUpperCase() : '—'}</div>
                </div>
              </div>

              <hr />

              <h4>Items</h4>
              <ul className="items-list">
                {(Array.isArray(order.items) ? order.items : (() => {
                  try { return JSON.parse(order.items || '[]'); } catch { return []; }
                })()).map((it, i) => (
                  <li key={i} className="items-row">
                    <div className="items-row-left">
                      <div className="items-name">{it.name || it.title || it.id}</div>
                      <div className="muted small">qty: {it.quantity || it.qty || 1}</div>
                    </div>
                    <div className="items-price">₹{Number(it.price || 0).toFixed(2)}</div>
                  </li>
                ))}
              </ul>

              <div className="summary-footer">
                <div className="summary-left small muted">Subtotal</div>
                <div className="summary-right">₹{Number(order.totalAmount || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;
