// src/pages/Products/Products.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import './Products.css';

const getId = (product, idx) => product.id ?? product._id ?? idx;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // controlled search input
  const [searchTerm, setSearchTerm] = useState('');
  // debounced search value used for filtering
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch products once
  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        if (!mounted) return;
        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Try again later.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => { mounted = false; };
  }, []);

  // debounce searchTerm -> debouncedSearch (300ms)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // categories derived from products (memoized)
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach(p => {
      // normalize and guard missing category
      const cat = (p?.category ?? '').toString().trim().toLowerCase();
      if (cat) cats.add(cat);
    });
    return ['all', ...Array.from(cats)];
  }, [products]);

  // filtered products (safe - guards for undefined/null fields)
  const filteredProducts = useMemo(() => {
    const search = (debouncedSearch || '').toLowerCase();

    return products.filter(product => {
      // defensive extraction + fallback to empty string
      const name = (product?.name ?? '').toString().toLowerCase();
      const desc = (product?.description ?? '').toString().toLowerCase();
      const cat = (product?.category ?? '').toString().toLowerCase();

      const matchesSearch = !search || name.includes(search) || desc.includes(search);
      const matchesCategory = selectedCategory === 'all' || (cat === (selectedCategory || '').toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearch, selectedCategory]);

  if (loading) {
    return (
      <div className="products-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }



  return (
    <div className="products-page">
      <section className="products-section section">
        <div className="page-container">
          <div className="products-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search cakes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                aria-label="Search cakes"
              />
              <button type="submit" className="search-icon-btn">🔍</button>
            </div>

            <div className="category-filters" role="tablist" aria-label="Categories">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                  type="button"
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>No cakes found matching your criteria.</p>
            </div>
          ) : (
            <div className="products-grid grid grid-3">
              {filteredProducts.map((product, idx) => (
                <ProductCard key={getId(product, idx)} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Products;
