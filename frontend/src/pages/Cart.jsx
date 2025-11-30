// src/pages/Cart.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // assume this exists and provides the listed functions
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    deliveryDate: '',
    deliveryTime: '',
    paymentMethod: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // optional: prevent body scroll when modal open
  useEffect(() => {
    if (showOrderForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showOrderForm]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'radio' ? value : value;
    setOrderData(prev => ({ ...prev, [name]: val }));
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!orderData.customerName || !orderData.customerPhone || !orderData.customerAddress || !orderData.deliveryDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const orderPayload = {
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      deliveryDate: orderData.deliveryDate,
      deliveryTime: orderData.deliveryTime,
      paymentMethod: orderData.paymentMethod,
      totalAmount: getTotalPrice(),
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    try {
      setSubmitting(true);
      const BASE_URL = ''; // change if backend is on different origin e.g. 'http://localhost:1575'
      const resp = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const raw = await resp.text();
      let parsed;
      try { parsed = JSON.parse(raw); } catch { parsed = raw; }

      if (resp.ok) {
        const order = parsed;
        clearCart();
        setShowOrderForm(false);
        // navigate to orders or success page; if backend returned id it's best
        navigate('/orders', { state: { orderId: order?.id ?? order?._id ?? null } });
      } else {
        const msg = (parsed && parsed.error) ? parsed.error : (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
        alert('Error placing order: ' + msg);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Empty cart - centered state
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="page-container compact-cart">
          <div className="empty-cart-wrapper">
            <div className="empty-cart" role="status" aria-live="polite">
              <div className="empty-cart-icon" aria-hidden>🛒</div>
              <h2>Your cart is empty</h2>
              <p>Looks like you haven't added any cakes yet.</p>
              <button onClick={() => navigate('/products')} className="btn btn-primary btn-continue">
                Browse Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="page-container compact-cart">
        <h1 className="page-title">Shopping Cart</h1>

        <div className="cart-content compact">
          <div className="cart-items compact-list">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item compact-card" aria-label={item.name}>
                <div className="cart-item-left">
                  <div className="cart-item-image compact-thumb" aria-hidden>
                    <img src={item.imageUrl || '/uploads/placeholder.png'} alt={item.name} onError={(e) => { e.target.src = '/uploads/placeholder.png'; }} />
                  </div>
                  <div className="cart-item-details compact-details">
                    <div className="cart-item-name" title={item.name}>{item.name}</div>
                    <div className="cart-item-category muted small">{item.category ?? 'Uncategorized'}</div>
                    <div className="cart-item-price small">₹{Number(item.price || 0).toFixed(2)}</div>
                  </div>
                </div>

                <div className="cart-item-right">
                  <div className="quantity-controls compact-qty" aria-label={`Quantity controls for ${item.name}`}>
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                      className="qty-btn"
                      aria-label={`Decrease quantity for ${item.name}`}
                    >−</button>

                    <span className="qty-value" aria-live="polite">{item.quantity}</span>

                    <button
                      onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                      className="qty-btn"
                      aria-label={`Increase quantity for ${item.name}`}
                    >+</button>
                  </div>

                  <div className="cart-item-total small">₹{(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>

                  <button onClick={() => removeFromCart(item.id)} className="btn btn-link btn-remove small" aria-label={`Remove ${item.name} from cart`}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary compact-summary card" aria-labelledby="order-summary">
            <h2 id="order-summary" className="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Total Items</span>
              <span>{cartItems.reduce((sum, it) => sum + (it.quantity || 0), 0)}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>₹{getTotalPrice().toFixed(2)}</span>
            </div>

            <button onClick={() => setShowOrderForm(true)} className="btn btn-primary btn-checkout" aria-haspopup="dialog">
              Checkout
            </button>
            <button onClick={() => { if (window.confirm('Clear cart?')) clearCart(); }} className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
              Clear Cart
            </button>
          </aside>
        </div>

        {/* Order form overlay (keeps original fields) */}
        {showOrderForm && (
          <div className="order-form-overlay" onClick={() => setShowOrderForm(false)} role="dialog" aria-modal="true" aria-label="Order form">
            <div className="order-form-container card" onClick={(e) => e.stopPropagation()}>
              <h2>Order Details</h2>
              <form onSubmit={handleOrderSubmit} className="order-form compact-form">
                <div className="form-row">
                  <label className="small">Name *</label>
                  <input name="customerName" value={orderData.customerName} onChange={handleInputChange} required disabled={submitting} />
                </div>

                <div className="form-row">
                  <label className="small">Phone *</label>
                  <input name="customerPhone" value={orderData.customerPhone} onChange={handleInputChange} required disabled={submitting} />
                </div>

                <div className="form-row">
                  <label className="small">Address *</label>
                  <textarea name="customerAddress" value={orderData.customerAddress} onChange={handleInputChange} rows="2" required disabled={submitting} />
                </div>

                <div className="form-row horiz">
                  <div style={{ flex: 1 }}>
                    <label className="small">Delivery Date *</label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={orderData.deliveryDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div style={{ width: 160 }}>
                    <label className="small">Delivery Time</label>
                    <select name="deliveryTime" value={orderData.deliveryTime} onChange={handleInputChange} disabled={submitting}>
                      <option value="">Select</option>
                      <option value="09:00-12:00">Morning</option>
                      <option value="12:00-15:00">Afternoon</option>
                      <option value="15:00-18:00">Evening</option>
                      <option value="18:00-21:00">Night</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <label className="small">Payment Method</label>
                  <div className="payment-methods compact-pay" style={{ display: 'flex', gap: 12 }}>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="phonepe"
                        checked={orderData.paymentMethod === 'phonepe'}
                        onChange={handleInputChange}
                        disabled={submitting}
                      /> PhonePe
                    </label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="gpay"
                        checked={orderData.paymentMethod === 'gpay'}
                        onChange={handleInputChange}
                        disabled={submitting}
                      /> GPay
                    </label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={orderData.paymentMethod === 'cash'}
                        onChange={handleInputChange}
                        disabled={submitting}
                      /> Cash
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => setShowOrderForm(false)} className="btn btn-outline" disabled={submitting}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Placing…' : 'Place Order'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
