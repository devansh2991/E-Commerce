import React, { useEffect, useState } from 'react';
import './NewCollections.css';
import Item from '../Item/Item';

const NewCollections = () => {
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
          // You can filter for newest products if needed
          const sortedProducts = data.products
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // latest first
            .slice(0, 8); // show top 8 new collections
          setProducts(sortedProducts);
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

  if (loading) return <p>Loading new collections...</p>;
  return (
    <div className='new-collections'>
      <h1>NEW COLLECTIONS</h1>
      <hr />
      <div className="collections">
        {products.map((item) => (
          <Item
            key={item.id}
            id={item.id}
            name={item.name}
            image={item.images?.[0]} // first image as thumbnail
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  );
};

export default NewCollections;
