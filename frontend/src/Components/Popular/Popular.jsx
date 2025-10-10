import React, { useEffect, useState } from 'react';
import './Popular.css';
import Item from '../Item/Item';

const Popular = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);


  // Use API_URL from env or fallback
  const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://e-commerc-y0jw.onrender.com");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();
        if (data.success) {
          // Optionally, filter for 'women' category
          const womenProducts = data.products.filter(p => p.category === 'women');
          setProducts(womenProducts);
        } else {
          console.error('Failed to fetch products');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [API_URL]);

  if (loading) return <p>Loading popular products...</p>;
  if (products.length === 0) return <p>No products found.</p>;

  return (
    <div className='popular'>
      <h1>POPULAR IN WOMEN</h1>
      <hr />
      <div className="popular-item">
        {products.map((item) => (
          <Item
            key={item.id}
            id={item.id}
            name={item.name}
            image={item.images?.[0]}  // first image as thumbnail
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  );
};

export default Popular;
