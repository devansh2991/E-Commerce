import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ListProduct.css";

const ListProduct = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:4000/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        setError("Failed to load products");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Delete product by ID
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`http://localhost:4000/product/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setProducts(products.filter((product) => product.id !== id));
        alert("Product deleted successfully");
      } else {
        alert("Failed to delete product: " + data.message);
      }
    } catch (err) {
      alert("Error deleting product: " + err.message);
    }
  };

  if (loading) return <p className="empty-products">Loading products...</p>;
  if (error) return <p className="empty-products">Error: {error}</p>;
  if (products.length === 0) return <p className="empty-products">No products found.</p>;

  return (
    <div className="allproducts-page">
      <div className="allproducts-container">
        {/* Header row */}
        <div className="allproducts-header">
          <span>Image</span>
          <span>Name</span>
          <span>Category</span>
          <span>Old Price</span>
          <span>New Price</span>
          <span>Actions</span>
        </div>

        {/* Product rows */}
        {products.map((product) => (
          <div key={product.id} className="allproducts-row">
            <img
              src={
                product.images && product.images.length > 0
                  ? product.images[0] // show first image
                  : "https://via.placeholder.com/100"
              }
              alt={product.name}
              className="allproducts-img"
            />
            <span className="allproducts-name">{product.name}</span>
            <span className="allproducts-category">{product.category}</span>
            <span className="allproducts-price">
              <del className="allproducts-oldprice">₹{product.old_price}</del>
            </span>
            <span className="allproducts-price">₹{product.new_price}</span>
            <div className="allproducts-actions">
              <button
                className="allproducts-btn allproducts-btn-edit"
                onClick={() => navigate(`/editproduct/${product.id}`)}
              >
                Edit
              </button>
              <button
                className="allproducts-btn allproducts-btn-delete"
                onClick={() => handleDelete(product.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListProduct;
