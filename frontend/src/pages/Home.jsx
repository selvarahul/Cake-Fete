import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">Delicious Cakes</span>
            <br />
            Made with Love
          </h1>
          <p className="hero-subtitle">
            Order your favorite cakes online and get them delivered fresh to your doorstep
          </p>
          <div className="hero-buttons">
            <Link to="/products" className="btn btn-primary">
              Browse Cakes
            </Link>
            <Link to="/cart" className="btn btn-outline">
              View Cart
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="floating-cake">🎂</div>
        </div>
      </section>

      <section className="features section">
        <div className="page-container">
          <h2 className="section-title">Why Choose Us?</h2>
          <div className="features-grid grid grid-3">
            <div className="feature-card card">
              <div className="feature-icon">🍰</div>
              <h3>Fresh & Delicious</h3>
              <p>All our cakes are baked fresh daily using the finest ingredients</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>Quick and reliable delivery service to your doorstep</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">💝</div>
              <h3>Custom Orders</h3>
              <p>We create custom cakes for your special occasions</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="page-container">
          <div className="cta-content">
            <h2>Ready to Order?</h2>
            <p>Browse our collection of delicious cakes and place your order today!</p>
            <Link to="/products" className="btn btn-secondary">
              Shop Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

