import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import upload_area from "../../assets/upload_area.svg";
import "./EditProduct.css";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [productDetails, setProductDetails] = useState({
    name: "",
    category: "women",
    new_price: "",
    old_price: "",
    description: "",
    sizes: [],
    quantity: "",
    images: [] // all uploaded images
  });

  const [imagePreviews, setImagePreviews] = useState([]); // URLs for preview
  const [loading, setLoading] = useState(true);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:4000/product/${id}`);
        const data = await res.json();
        if (data.success) {
          const p = data.product;
          setProductDetails({
            name: p.name,
            category: p.category,
            new_price: p.new_price,
            old_price: p.old_price,
            description: p.description || "",
            sizes: p.sizes || [],
            quantity: p.quantity || "",
            images: p.images || []
          });
          setImagePreviews(p.images || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Handle inputs
  const changeHandler = (e) => {
    const { name, value, checked } = e.target;
    if (name === "sizes") {
      let newSizes = [...productDetails.sizes];
      if (checked) newSizes.push(value);
      else newSizes = newSizes.filter(size => size !== value);
      setProductDetails({ ...productDetails, sizes: newSizes });
    } else {
      setProductDetails({ ...productDetails, [name]: value });
    }
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
    setProductDetails(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  // Set an image as the main preview
  const setAsMainImage = (idx) => {
    if (idx === 0) return; // already main
    const newPreviews = [...imagePreviews];
    const newImages = [...productDetails.images];
    // swap clicked image with index 0
    [newPreviews[0], newPreviews[idx]] = [newPreviews[idx], newPreviews[0]];
    [newImages[0], newImages[idx]] = [newImages[idx], newImages[0]];
    setImagePreviews(newPreviews);
    setProductDetails({ ...productDetails, images: newImages });
  };

  // Remove an image
  const removeImage = (idx) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== idx);
    const newImages = productDetails.images.filter((_, i) => i !== idx);
    setImagePreviews(newPreviews);
    setProductDetails({ ...productDetails, images: newImages });
  };

  // Update product
  const handleEdit = async () => {
    try {
      let uploadedImages = [];

      for (let img of productDetails.images) {
        if (typeof img === "string") {
          uploadedImages.push(img);
        } else {
          const formData = new FormData();
          formData.append("product", img);
          const res = await fetch("http://localhost:4000/upload", {
            method: "POST",
            body: formData
          });
          const data = await res.json();
          if (data.success) uploadedImages.push(data.image_url);
          else { alert("Image upload failed"); return; }
        }
      }

      const res = await fetch(`http://localhost:4000/product/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...productDetails, images: uploadedImages })
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Product updated successfully");
        navigate("/listproduct");
      } else {
        alert("❌ Failed to update product");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating product");
    }
  };

  if (loading) return <p>Loading product...</p>;

  return (
    <div className="add-product-container">
      {/* Product Title */}
      <div className="addproduct-itemfield">
        <p>Product Title</p>
        <input type="text" name="name" value={productDetails.name} onChange={changeHandler} placeholder="Type here" />
      </div>

      {/* Description */}
      <div className="addproduct-itemfield">
        <p>Description</p>
        <textarea name="description" value={productDetails.description} onChange={changeHandler} rows={4} />
      </div>

      {/* Prices */}
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input type="number" name="old_price" value={productDetails.old_price} onChange={changeHandler} />
        </div>
        <div className="addproduct-itemfield">
          <p>Offer Price</p>
          <input type="number" name="new_price" value={productDetails.new_price} onChange={changeHandler} />
        </div>
        <div className="addproduct-itemfield">
          <p>Quantity</p>
          <input type="number" name="quantity" value={productDetails.quantity} onChange={changeHandler} />
        </div>
      </div>

      {/* Category */}
      <div className="addproduct-itemfield">
        <p>Category</p>
        <select name="category" value={productDetails.category} onChange={changeHandler}>
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="kids">Kids</option>
          <option value="electronics">Electronics</option>
        </select>
      </div>

      {/* Sizes */}
      <div className="addproduct-itemfield">
        <p>Sizes</p>
        <div style={{ display: "flex", gap: "18px", flexWrap: "nowrap" }}>
          {["S","M","L","XL","XXL"].map(size => (
            <label key={size}>
              <input type="checkbox" name="sizes" value={size} checked={productDetails.sizes.includes(size)} onChange={changeHandler} /> {size}
            </label>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="addproduct-itemfield">
        <p>Product Images</p>
        <label htmlFor="file-input">
          <img src={imagePreviews[0] || upload_area} className="addproduct-main-img" alt="upload preview" />
        </label>
        <input type="file" id="file-input" hidden accept="image/*" multiple onChange={handleImageChange} />

        {imagePreviews.length > 0 && (
          <div className="addproduct-multiple-preview">
            {imagePreviews.map((img, idx) => (
              <div key={idx} className="thumbnail-wrapper">
                <img
                  src={img}
                  className="addproduct-thumbnail-img"
                  alt={`preview-${idx}`}
                  onClick={() => setAsMainImage(idx)}
                />
                <button className="remove-btn" onClick={() => removeImage(idx)}>✖</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="addproduct-btn" onClick={handleEdit}>UPDATE PRODUCT</button>
    </div>
  );
};

export default EditProduct;
