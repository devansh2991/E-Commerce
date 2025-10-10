import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Breadcrum from "../Components/Breadcrums/Breadcrum";
import ProductDisplay from "../Components/ProductDisplay/ProductDisplay";
import DescriptionBox from "../Components/DescriptionBox/DescriptionBox";
import RelatedProducts from "../Components/RelatedProducts/RelatedProducts";

const Product = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 👇 Always connect to localhost backend
  const API_URL = "http://localhost:4000";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Try fetching product by numeric or string ID
        let res = await fetch(`${API_URL}/product/${productId}`);
        let data = await res.json();

        // If backend returns error, try fallback (get all and find)
        if (!data.success) {
          const resAll = await fetch(`${API_URL}/products`);
          const allData = await resAll.json();

          if (allData.success) {
            const found =
              allData.products.find(
                (p) => p._id === productId || p.id === Number(productId)
              ) || null;
            if (found) {
              setProduct(found);
              setError(null);
            } else {
              setError("❌ Product not found");
            }
          } else {
            setError("⚠️ Could not load product list");
          }
        } else {
          setProduct(data.product);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("⚠️ Failed to fetch product from server");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) return <p style={{ textAlign: "center" }}>Loading product...</p>;
  if (error) return <p style={{ textAlign: "center", color: "red" }}>{error}</p>;
  if (!product) return <p style={{ textAlign: "center" }}>Product not found</p>;

  return (
    <div>
      <Breadcrum product={product} />
      <ProductDisplay product={product} />
      <DescriptionBox description={product.description} />
      <RelatedProducts
        category={product.category}
        currentId={product.id || product._id}
      />
    </div>
  );
};

export default Product;
