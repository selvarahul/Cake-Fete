// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminAddProduct from './pages/Admin/AdminAddProduct';
import './App.css';
import { getUser } from './services/authService';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogin = (userObj) => {
    setUser(userObj);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const RequireAdmin = ({ children }) => {
    if (!user) return <Navigate to="/admin/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/" replace />;
    return children;
  };

  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Navbar user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />

            <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />

            <Route
              path="/admin/dashboard"
              element={
                <RequireAdmin>
                  <AdminDashboard user={user} />
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/products"
              element={
                <RequireAdmin>
                  <AdminProducts />
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/products/new"
              element={
                <RequireAdmin>
                  <AdminAddProduct />
                </RequireAdmin>
              }
            />

            {/* optional edit route placeholder */}
            <Route
              path="/admin/products/edit/:id"
              element={
                <RequireAdmin>
                  {/* implement AdminEditProduct if you want */}
                  <AdminAddProduct />
                </RequireAdmin>
              }
            />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
