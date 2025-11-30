// src/pages/Admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const getToken = () => localStorage.getItem('token');

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];

function statusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'pending': return 'var(--yellow)';
    case 'confirmed': return 'var(--blue)';
    case 'preparing': return 'var(--purple)';
    case 'delivered': return 'var(--green)';
    case 'cancelled': return 'var(--red)';
    default: return 'var(--muted)';
  }
}

function safeDate(d) {
  try { return d ? new Date(d) : null; } catch { return null; }
}

/* -------------------------
   CSV helpers (unchanged)
   ------------------------- */
function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
function itemsToCompactString(items = []) {
  return (items || []).map(it => {
    const name = it?.name ?? it?.title ?? it?.productName ?? 'Item';
    const qty = it?.quantity ?? it?.qty ?? 1;
    const price = Number(it?.price ?? 0).toFixed(2);
    return `${name} (${qty} x ₹${price})`;
  }).join(' ; ');
}
function computeTotals(orders = []) {
  let gross = 0;
  let cancelledAmount = 0;
  orders.forEach(o => {
    const s = (o.status || 'pending').toLowerCase();
    const amt = Number(o.totalAmount || 0);
    gross += amt;
    if (s === 'cancelled') cancelledAmount += amt;
  });
  const net = gross - cancelledAmount;
  return { gross, cancelledAmount, net };
}
function ordersToCsvRowsWithSummary(orders = []) {
  const header = ['Order ID','Created At','Status','Customer Name','Phone','Address','Delivery Date','Delivery Time','Payment Method','Total Amount','Items (name (qty x price))'];
  const rows = [header.map(escapeCsvField).join(',')];

  orders.forEach(o => {
    const created = safeDate(o.createdAt);
    const createdStr = created ? created.toISOString() : (o.createdAt || '');
    const itemsStr = itemsToCompactString(o.items || []);
    const row = [
      o.id ?? o._id ?? '',
      createdStr,
      o.status ?? '',
      o.customerName ?? '',
      o.customerPhone ?? '',
      (o.customerAddress ?? '').replace(/\r?\n/g, ' '),
      o.deliveryDate ?? '',
      o.deliveryTime ?? '',
      o.paymentMethod ?? '',
      Number(o.totalAmount ?? 0).toFixed(2),
      itemsStr,
    ];
    rows.push(row.map(escapeCsvField).join(','));
  });

  const totals = computeTotals(orders);
  rows.push('');
  const emptyRow = Array(header.length).fill('');
  const grossRow = emptyRow.slice(); grossRow[0] = 'SUMMARY - Gross Amount'; grossRow[9] = `₹${Number(totals.gross).toFixed(2)}`;
  const cancelledRow = emptyRow.slice(); cancelledRow[0] = 'SUMMARY - Cancelled Amount'; cancelledRow[9] = `- ₹${Number(totals.cancelledAmount).toFixed(2)}`;
  const netRow = emptyRow.slice(); netRow[0] = 'SUMMARY - Net Revenue'; netRow[9] = `₹${Number(totals.net).toFixed(2)}`;
  rows.push(grossRow.map(escapeCsvField).join(','), cancelledRow.map(escapeCsvField).join(','), netRow.map(escapeCsvField).join(','));

  return rows.join('\n');
}
function downloadBlob(filename, content, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/* Component */
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [expanded, setExpanded] = useState({});
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // reporting month default (YYYY-MM)
  const defaultMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;
  })();
  const [reportMonth, setReportMonth] = useState(defaultMonth);

  // simple (customer) vs advanced (admin summary-only) view
  const [simpleMode, setSimpleMode] = useState(true);

  // modal state for cancel confirmation
  const [confirmData, setConfirmData] = useState(null);

  // track which order(s) are currently updating to disable controls during update
  const [updatingStatus, setUpdatingStatus] = useState({}); // { [orderId]: true }

  useEffect(() => { fetchOrders(); }, [refreshKey]);

  // normalize function - ensures each order has an `id` property
  function normalizeOrder(o) {
    const id = o?.id ?? o?._id ?? null;
    let items = [];
    try { items = Array.isArray(o.items) ? o.items : (o.items ? JSON.parse(o.items) : []); } catch (e) { items = []; }
    return { ...o, id, items };
  }

  async function fetchOrders() {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await axios.get('/api/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data || [];
      const normalized = data.map(o => normalizeOrder(o));
      setOrders(normalized);
    } catch (err) {
      console.error('Failed to load orders', err);
      setError(err?.response?.data?.error || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, preparing: 0, delivered: 0, cancelled: 0 };
    let gross = 0;
    let cancelledAmount = 0;
    orders.forEach(o => {
      const s = (o.status || 'pending').toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
      const amt = Number(o.totalAmount || 0);
      gross += amt;
      if (s === 'cancelled') cancelledAmount += amt;
    });
    const net = gross - cancelledAmount;
    return { counts, gross, cancelledAmount, net };
  }, [orders]);

  function toggleExpand(id) { setExpanded(prev => ({ ...prev, [id]: !prev[id] })); }

  // centralized handler for status change from the select
  function handleStatusChange(orderId, rawNewStatus) {
    const newStatus = String(rawNewStatus || '').toLowerCase();
    // If no actual change, do nothing
    const prev = orders.find(o => o.id === orderId);
    const prevStatus = (prev?.status || 'pending').toLowerCase();
    if (prevStatus === newStatus) return;

    // If cancelling, open confirm modal
    if (newStatus === 'cancelled') {
      setConfirmData({ orderId, newStatus });
      return;
    }

    // Otherwise perform update (optimistic)
    updateStatusOptimistic(orderId, newStatus);
  }

  // perform optimistic update and revert on failure
  async function updateStatusOptimistic(orderId, newStatus) {
    // find by normalized id
    const prevOrder = orders.find(o => o.id === orderId);
    if (!prevOrder) return;

    setUpdatingStatus(s => ({ ...s, [orderId]: true }));
    // optimistic UI
    setOrders(prevList => prevList.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      const token = getToken();
      const res = await axios.put(`/api/orders/${orderId}/status`, { status: newStatus }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const updatedRaw = res.data || {};
      const updated = normalizeOrder(updatedRaw);

      // if server returned id in _id or id, ensure we replace the right order
      const updatedId = updated.id ?? orderId;
      setOrders(prevList => prevList.map(o => o.id === updatedId ? ({ ...o, ...updated }) : o));
    } catch (err) {
      console.error('Status update failed', err);
      alert('Could not update status. Reverting.');
      setOrders(prevList => prevList.map(o => o.id === orderId ? prevOrder : o));
    } finally {
      setUpdatingStatus(s => {
        const next = { ...s };
        delete next[orderId];
        return next;
      });
    }
  }

  // called by modal confirm for cancellations
  async function confirmCancel() {
    if (!confirmData) return;
    const { orderId, newStatus } = confirmData;
    setConfirmData(null);
    await updateStatusOptimistic(orderId, newStatus);
  }

  async function downloadReceipt(orderId) {
    try {
      const token = getToken();
      const res = await axios.get(`/api/orders/${orderId}/receipt`, {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-order-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      alert('Could not download receipt');
    }
  }

  // visible (filtered) orders used by simple view
  const visible = useMemo(() => {
    let list = orders.slice();
    if (statusFilter !== 'all') list = list.filter(o => (o.status || '').toLowerCase() === statusFilter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(o =>
        (o.customerName || '').toLowerCase().includes(s) ||
        (o.customerPhone || '').toLowerCase().includes(s) ||
        String(o.id).includes(s) ||
        (o.customerAddress || '').toLowerCase().includes(s) ||
        (o.items || []).some(it => (it.name || '').toLowerCase().includes(s))
      );
    }
    list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    return list;
  }, [orders, statusFilter, q, sort]);

  /* ---------- Monthly summary helpers for Advanced view ---------- */

  function filterOrdersByMonth(ordersList, monthYear) {
    if (!monthYear) return [];
    const [yStr, mStr] = monthYear.split('-');
    const year = Number(yStr);
    const month = Number(mStr); // 1-based
    return (ordersList || []).filter(o => {
      const d = safeDate(o.createdAt);
      if (!d) return false;
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });
  }

  const monthlyOrders = useMemo(() => filterOrdersByMonth(orders, reportMonth), [orders, reportMonth]);

  const monthlySummary = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, preparing: 0, delivered: 0, cancelled: 0 };
    let gross = 0;
    let cancelledAmount = 0;
    monthlyOrders.forEach(o => {
      const s = (o.status || 'pending').toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
      const amt = Number(o.totalAmount || 0);
      gross += amt;
      if (s === 'cancelled') cancelledAmount += amt;
    });
    const net = gross - cancelledAmount;
    return { counts, gross, cancelledAmount, net, totalOrders: monthlyOrders.length };
  }, [monthlyOrders]);

  function downloadMonthlyCsv(monthYear = reportMonth) {
    try {
      const filtered = filterOrdersByMonth(orders, monthYear);
      if (!filtered.length) { alert('No orders found for the selected month.'); return; }
      const csv = ordersToCsvRowsWithSummary(filtered);
      downloadBlob(`orders-${monthYear}.csv`, csv);
    } catch (err) { console.error(err); alert('Could not generate monthly CSV.'); }
  }

  function downloadVisibleCsv() {
    try {
      if (!visible.length) { alert('No visible orders to download.'); return; }
      const csv = ordersToCsvRowsWithSummary(visible);
      downloadBlob(`orders-visible-${(new Date()).toISOString().slice(0,10)}.csv`, csv);
    } catch (err) { console.error(err); alert('Could not generate CSV.'); }
  }

  return (
    <div className="admin-dashboard tech container">
      <header className="topbar" aria-hidden={false}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Orders</h1>

          {/* mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', marginRight: 6 }}>View</label>
            <button
              className={`btn ${simpleMode ? 'btn-primary' : ''}`}
              onClick={() => setSimpleMode(true)}
              title="Simple view for customers"
            >
              Simple
            </button>
            <button
              className={`btn ${!simpleMode ? 'btn-primary' : ''}`}
              onClick={() => setSimpleMode(false)}
              title="Advanced admin summary"
            >
              Advanced
            </button>
          </div>
        </div>

        {/* topbar right */}
        <div className="controls" style={{ alignItems: 'center' }}>
          {/* shared search */}
          <div className="search" style={{ minWidth: 280 }}>
            <input
              placeholder={simpleMode ? "Search name, phone, order id..." : "Search (keeps filter but not displayed list)"}
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <button className="btn" onClick={() => setQ('')}>Clear</button>
          </div>

          {/* advanced-only controls (compact) */}
          {!simpleMode && (
            <>
              <div className="report-controls" style={{ marginLeft: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 13, color: 'var(--muted)' }}>Month</label>
                <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
                <button className="btn btn-primary" onClick={() => downloadMonthlyCsv(reportMonth)}>Download Monthly CSV</button>
              </div>

              <div style={{ marginLeft: 8 }}>
                <button className="btn btn-primary" onClick={() => navigate('/admin/products/new')}>+ Add Product</button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Advanced: show monthly summary only (no orders list) */}
      {!simpleMode ? (
        <section className="overview-grid" aria-hidden={simpleMode} style={{ marginBottom: 18 }}>
          <div className="tile total card">
            <div className="tile-title">Selected Month</div>
            <div className="tile-value">{reportMonth}</div>
          </div>

          <div className="tile card">
            <div className="tile-title">Total Orders (month)</div>
            <div className="tile-value">{monthlySummary.totalOrders}</div>
          </div>

          <div className="tile revenue card">
            <div className="tile-title">Delivered</div>
            <div className="tile-value">{monthlySummary.counts.delivered || 0}</div>
          </div>

          <div className="tile revenue card">
            <div className="tile-title">Cancelled</div>
            <div className="tile-value">{monthlySummary.counts.cancelled || 0}</div>
          </div>

          <div className="tile revenue card">
            <div className="tile-title">Gross Revenue</div>
            <div className="tile-value">₹{Number(monthlySummary.gross || 0).toFixed(2)}</div>
          </div>

          <div className="tile revenue card">
            <div className="tile-title">Cancelled Amount</div>
            <div className="tile-value">- ₹{Number(monthlySummary.cancelledAmount || 0).toFixed(2)}</div>
          </div>

          <div className="tile revenue card">
            <div className="tile-title">Net Revenue</div>
            <div className="tile-value">₹{Number(monthlySummary.net || 0).toFixed(2)}</div>
          </div>

          {/* status breakdown for completeness */}
          {Object.keys(monthlySummary.counts).map(s => (
            <div key={s} className="tile card">
              <div className="tile-title">{s}</div>
              <div className="tile-value">{monthlySummary.counts[s] || 0}</div>
            </div>
          ))}
        </section>
      ) : null}

      {/* Orders list shown only in Simple mode */}
      {simpleMode && (
        <section className="orders-list card" aria-live="polite">
          {loading && <div className="muted">Loading orders…</div>}
          {error && <div className="error">{error}</div>}
          {!loading && visible.length === 0 && <div className="muted">No orders match the current filter.</div>}

          <div className="list-rows" style={{ marginTop: 8 }}>
            {visible.map(o => {
              const s = (o.status || 'pending').toLowerCase();
              const placed = o.createdAt ? new Date(o.createdAt).toLocaleString() : '';
              return (
                <article key={o.id ?? Math.random()} className="order-card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: 'var(--accent)', background: 'rgba(14,165,233,0.08)', padding: '8px 10px', borderRadius: 8 }}>
                        #{o.id}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{o.customerName || '—'}</div>
                        <div className="muted" style={{ fontSize: 13 }}>{o.customerPhone} • {placed}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>₹{Number(o.totalAmount || 0).toFixed(2)}</div>
                        <div className="muted" style={{ fontSize: 13 }}>Items: {(o.items || []).length}</div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span className="badge" style={{ backgroundColor: statusColor(s), minWidth: 88, textAlign: 'center' }}>
                          {s}
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            className="status-select"
                            value={(o.status || 'pending').toLowerCase()}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            disabled={Boolean(updatingStatus[o.id])}
                            aria-label={`Change status for order ${o.id}`}
                          >
                            {STATUS_ORDER.map(st => (
                              <option key={st} value={st}>
                                {st[0].toUpperCase() + st.slice(1)}
                              </option>
                            ))}
                          </select>

                          <button className="btn btn-primary" onClick={() => toggleExpand(o.id)} aria-expanded={Boolean(expanded[o.id])}>
                            {expanded[o.id] ? 'Hide details' : 'Details'}
                          </button>

                          <button className="btn btn-primary btn-sm" onClick={() => downloadReceipt(o.id)}>Receipt</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expanded[o.id] && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 220 }}>
                          <div style={{ fontWeight: 700 }}>Delivery Address</div>
                          <div className="muted">{o.customerAddress}</div>
                        </div>
                        <div style={{ minWidth: 180 }}>
                          <div style={{ fontWeight: 700 }}>Delivery slot</div>
                          <div className="muted">{o.deliveryDate ?? '—'} {o.deliveryTime ? `• ${o.deliveryTime}` : ''}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>Payment</div>
                          <div className="muted">{o.paymentMethod ? o.paymentMethod.toUpperCase() : '—'}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 800, marginBottom: 8 }}>Items</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {(o.items || []).map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderRadius: 8, background: 'rgba(2,6,23,0.02)' }}>
                              <div style={{ fontWeight: 700 }}>{it.name || it.title || `Item ${it.id || idx}`}</div>
                              <div className="muted">x{it.quantity || it.qty || 1} • ₹{Number(it.price || 0).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Confirmation modal for cancellation */}
      {confirmData && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Confirm Cancellation</h3>
            <p>This will deduct the order amount from net revenue. Are you sure?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => confirmCancel()}>Yes, Cancel</button>
              <button className="btn" onClick={() => setConfirmData(null)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
