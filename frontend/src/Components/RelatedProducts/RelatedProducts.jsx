import React, { useEffect, useState } from 'react';
import './RelatedProducts.css';
import Item from '../Item/Item';
import axios from 'axios';

const RelatedProducts = ({ category, currentProductId }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (!category) return;

    // Use API_URL from env or fallback
    const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "https://e-commerc-y0jw.onrender.com");

    const fetchRelatedProducts = async () => {
      try {
        const res = await axios.get(`${API_URL}/products`);
        if (res.data.success) {
          // Filter products by same category, exclude the current product
          const filtered = res.data.products.filter(
            (p) => p.category === category && p._id !== currentProductId
          );
          setRelatedProducts(filtered);
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
      }
    };

    fetchRelatedProducts();
  }, [category, currentProductId]);

  if (relatedProducts.length === 0) return null;

  return (
    <div className='relatedproducts'>
      <h1>Related Products</h1>
      <hr />
      <div className="relatedproducts-item">
        {relatedProducts.map((item) => (
          <Item
            key={item._id}
            id={item._id}
            name={item.name}
            image={item.images?.[0]}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
