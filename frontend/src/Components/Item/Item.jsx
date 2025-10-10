import React from 'react';
import { Link } from 'react-router-dom';
import './Item.css';

const Item = (props) => {
  // Determine default size: first available size
  const defaultSize = props.sizes?.find(size => props.quantity?.[size] > 0) || '';

  return (
    <div className='item'>
      {/* Image links to product page */}
      <Link 
        to={`/product/${props.id}`} 
        state={{ selectedSize: defaultSize }}  // Pass default size via state
        onClick={() => window.scrollTo(0, 0)}
      >
        <img src={props.image} alt={props.name} />
      </Link>

      {/* Product name */}
      <p>{props.name}</p>

      {/* Price + Buy button */}
      <div className="item-price-container">
        <div className="item-price">
          <div className="item-price-new">${props.new_price}</div>
          <div className="item-price-old">${props.old_price}</div>
        </div>

        {/* Buy button redirects to product page with default size */}
        <Link 
          to={`/product/${props.id}`} 
          state={{ selectedSize: defaultSize }}  // Pass default size
          onClick={() => window.scrollTo(0, 0)}
        >
          <button className="add-to-cart-btn">
            Buy
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Item;
