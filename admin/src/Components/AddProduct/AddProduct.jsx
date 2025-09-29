import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';

const AddProduct = () => {
  const [imagePreviews, setImagePreviews] = useState([]);
  const [ProductDetails, setProductDetails] = useState({
    name: "",
    images: [],
    category: "women",
    new_price: "",
    old_price: "",
    description: "",
    sizes: [],
    quantity: ""
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setProductDetails({ ...ProductDetails, images: files });
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const changeHandler = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "sizes") {
      let newSizes = [...ProductDetails.sizes];
      if (checked) newSizes.push(value);
      else newSizes = newSizes.filter(size => size !== value);
      setProductDetails({ ...ProductDetails, sizes: newSizes });
    } else {
      setProductDetails({ ...ProductDetails, [name]: value });
    }
  };

  const Add_Product = async () => {
    console.log("Before upload:", ProductDetails);

    let uploadedImages = [];
    for (let i = 0; i < ProductDetails.images.length; i++) {
      let formData = new FormData();
      formData.append('product', ProductDetails.images[i]);
      const resp = await fetch('http://localhost:4000/upload', { method: 'POST', body: formData });
      const data = await resp.json();
      if (data.success) uploadedImages.push(data.image_url);
    }

    if (uploadedImages.length === ProductDetails.images.length) {
      let product = { ...ProductDetails, images: uploadedImages };
      console.log("After upload:", product);

      const resp = await fetch('http://localhost:4000/addproduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      const data = await resp.json();

      if (data.success) {
        alert("✅ Product Added");
        setProductDetails({
          name: "",
          images: [],
          category: "women",
          new_price: "",
          old_price: "",
          description: "",
          sizes: [],
          quantity: ""
        });
        setImagePreviews([]);
      } else {
        alert("❌ Failed to add product");
      }
    } else {
      alert("❌ Failed to upload all images");
    }
  };

  return (
    <div className='add-product-container'>
      <div className="addproduct-itemfield">
        <p>Product Title</p>
        <input
          value={ProductDetails.name}
          onChange={changeHandler}
          type="text"
          name='name'
          placeholder='Type Here'
        />
      </div>

      <div className="addproduct-itemfield">
        <p>Description</p>
        <textarea
          value={ProductDetails.description}
          onChange={changeHandler}
          name="description"
          placeholder="Product description..."
          rows={4}
        />
      </div>

      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input
            value={ProductDetails.old_price}
            onChange={changeHandler}
            type="text"
            name='old_price'
            placeholder='Type Here'
          />
        </div>
        <div className="addproduct-itemfield">
          <p>Offer Price</p>
          <input
            value={ProductDetails.new_price}
            onChange={changeHandler}
            type="text"
            name='new_price'
            placeholder='Type Here'
          />
        </div>
        <div className="addproduct-itemfield">
          <p>Available Quantity</p>
          <input
            value={ProductDetails.quantity}
            onChange={changeHandler}
            type="number"
            name='quantity'
            placeholder='Type Here'
          />
        </div>
      </div>

      <div className="addproduct-itemfield">
        <p>Product Category</p>
        <select
          value={ProductDetails.category}
          onChange={changeHandler}
          name="category"
          className='add-product-selector'
        >
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="kids">Kids</option>
        </select>
      </div>

      <div className="addproduct-itemfield">
        <p>Sizes</p>
        {["S","M","L","XL","XXL"].map(size => (
          <label key={size}>
            <input type="checkbox" name="sizes" value={size} onChange={changeHandler} /> {size}
          </label>
        ))}
      </div>

      {/* Image Upload Section */}
      <div className="addproduct-itemfield">
        <p>Product Images</p>
        <label htmlFor="file-input">
          <img
            src={imagePreviews[0] || upload_area}
            className='addproduct-main-img'
            alt="upload preview"
          />
        </label>
        <input
          type="file"
          id='file-input'
          hidden
          accept="image/*"
          onChange={handleImageChange}
          multiple
        />
        {imagePreviews.length > 0 && (
          <div className="addproduct-multiple-preview">
            {imagePreviews.map((img, idx) => (
              <img key={idx} src={img} className='addproduct-thumbnail-img' alt={`preview-${idx}`} />
            ))}
          </div>
        )}
      </div>

      <button onClick={Add_Product} className='addproduct-btn'>ADD</button>
    </div>
  );
};

export default AddProduct;
