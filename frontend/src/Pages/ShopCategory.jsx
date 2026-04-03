import React, { useEffect, useState } from 'react';
import './CSS/ShopCategory.css';
import dropdown_icon from '../Components/Assets/dropdown_icon.png';
import Item from '../Components/Item/Item';

const ShopCategory = ({ banner, category }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from backend
  // Use API_URL from env or fallback
  const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://e-commerc-y0jw.onrender.com");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/products`); // your backend API
        const data = await res.json();
        if (data.success) {
          // filter products by category
          const filtered = data.products.filter(p => p.category === category);
          setProducts(filtered);
        } else {
          console.error('Failed to fetch products:', data.message);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, API_URL]);

  if (loading) return <div className="shop-category"><p style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>Loading products...</p></div>;
  if (products.length === 0) return (
    <div className='shop-category'>
      <img className='shopcategory-banner' src={banner} alt="" />
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '12px' }}>No products found in {category} category</h2>
        <p style={{ fontSize: '16px', color: '#777' }}>New products coming soon! Check back later.</p>
      </div>
    </div>
  );

  return (
    <div className='shop-category'>
      <img className='shopcategory-banner' src={banner} alt="" />

      <div className="shopcategory-indexSort">
        <p>
          <span>Showing 1-{products.length}</span> products
        </p>
        <div className="shopcategory-sort">
          Sort by <img src={dropdown_icon} alt="" />
        </div>
      </div>

      <div className="shopcategory-products">
        {products.map((item) => (
          <Item
            key={item.id}
            id={item.id}
            name={item.name}
            image={item.images[0]} // first image
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>

      <div className="shopcategory-loadmore">
        Explore More
      </div>
    </div>
  );
};

export default ShopCategory;
