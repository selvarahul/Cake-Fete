import React from 'react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      imageUrl: product.imageUrl,
      quantity: 1,
      product
    });
  };

  // Use Vite env (import.meta.env) instead of process.env
  // If VITE_BACKEND isn't set, default to localhost:3000
  const backendOrigin = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND)
    ? import.meta.env.VITE_BACKEND
    : 'http://localhost:3000';

  const getImageUrl = (img) => {
    if (!img) return 'https://via.placeholder.com/400x300?text=Cake+Image';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    const path = img.startsWith('/') ? img : `/${img}`;
    return `${backendOrigin}${path}`;
  };

  const imageSrc = getImageUrl(product.imageUrl);

  return (
    <div className="product-card fade-in">
      <div className="product-image-container">
        <img
          src={imageSrc}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x300?text=Cake+Image';
          }}
        />
        <div className="product-overlay">
          <button className="btn-add-cart" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-category">{product.category}</span>
          <span className="product-price">
            ₹{Number(product.price || 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
