import React, { useContext, useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import "./ProductDisplay.css";
import star_icon from '../Assets/star_icon.png';
import star_dull_icon from '../Assets/star_dull_icon.png';
import { ShopContext } from '../../Context/ShopContext';

const ProductDisplay = ({ product }) => {
  const { addToCart } = useContext(ShopContext);
  const location = useLocation();
  const productSizes = product.sizes || [];

  // Determine default size: either passed or first available
  const firstAvailableSize = productSizes.find(size => product.quantity?.[size] > 0) || '';
  const passedSize = location.state?.selectedSize || firstAvailableSize;

  const [selectedSize, setSelectedSize] = useState(passedSize);
  const [mainImage, setMainImage] = useState(product.images?.[0] || '');

  return (
    <div className='productdisplay'>
      <div className="productdisplay-left">
        <div className="productdisplay-img-list">
          {product.images?.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt={`thumbnail-${idx}`} 
              onClick={() => setMainImage(img)}
              className={mainImage === img ? 'thumbnail-active' : ''}
            />
          ))}
        </div>

        <div className="productdisplay-img">
          <img className='productdisplay-main-img' src={mainImage} alt="Main Product" />
        </div>
      </div>

      <div className="productdisplay-right">
        <h1>{product.name}</h1>

        <div className="productdisplay-right-star">
          <img src={star_icon} alt="" />
          <img src={star_icon} alt="" />
          <img src={star_icon} alt="" />
          <img src={star_icon} alt="" />
          <img src={star_dull_icon} alt="" />
          <p>(122)</p>
        </div>

        <div className="productdisplay-right-prices">
          <div className="productdisplay-right-price-old">${product.old_price}</div>
          <div className="productdisplay-right-price-new">${product.new_price}</div>
        </div>

        <div className="productdisplay-right-description">
          {product.description || "No description available."}
        </div>

        <div className="productdisplay-right-size">
          <h1>Select Size</h1>
          <div className="productdisplay-right-sizes">
            {productSizes.map((size) => {
              const isDisabled = product.quantity?.[size] === 0;
              return (
                <button
                  key={size}
                  className={`size-btn ${selectedSize === size ? 'size-active' : ''}`}
                  disabled={isDisabled}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>

        <button
          className='cart-button'
          onClick={() => addToCart(product.id, selectedSize)}
          disabled={!selectedSize}
        >
          ADD TO CART
        </button>

        <p className='productdisplay-right-category'><span>Category: </span>{product.category}</p>
        <p className='productdisplay-right-category'><span>Available Sizes: </span>{productSizes.join(", ")}</p>
      </div>
    </div>
  );
};

export default ProductDisplay;
