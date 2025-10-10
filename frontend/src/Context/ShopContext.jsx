import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";

export const ShopContext = createContext(null);

const ShopContextProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useContext(AuthContext);
  const userId = user?._id;

  // 🌍 Base API URL
  const API_URL =
    process.env.REACT_APP_API_URL ||
    (window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "https://e-commerc-y0jw.onrender.com");

  // 🛍️ Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();

        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
          setError(null);
        } else {
          setError("Failed to load products");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Server connection failed");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [API_URL]);

  // 🧺 Fetch user's cart
  useEffect(() => {
    if (!userId) return;

    const fetchCart = async () => {
      try {
        const res = await fetch(`${API_URL}/cart/${userId}`);
        const data = await res.json();

        if (data.success) {
          const cartMap = {};
          data.items.forEach((item) => {
            const key = `${item.productId}_${item.size}`;
            cartMap[key] = item.quantity;
          });
          setCartItems(cartMap);
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };

    fetchCart();
  }, [userId, API_URL]);

  // ➕ Add item to cart
  const addToCart = async (productId, size = "") => {
    const key = `${productId}_${size}`;
    setCartItems((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));

    if (!userId) return;

    try {
      await fetch(`${API_URL}/cart/${userId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, size, quantity: 1 }),
      });
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  // ➖ Remove one item from cart
  const removeFromCart = async (productId, size = "") => {
    const key = `${productId}_${size}`;
    setCartItems((prev) => {
      const updated = { ...prev };
      if (updated[key] > 1) updated[key] -= 1;
      else delete updated[key];
      return updated;
    });

    if (!userId) return;

    try {
      await fetch(`${API_URL}/cart/${userId}/removeOne`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, size }),
      });
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  // ❌ Remove all of a product from cart
  const removeAllFromCart = async (productId, size = "") => {
    const key = `${productId}_${size}`;
    setCartItems((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });

    if (!userId) return alert("Please log in to modify your cart");

    try {
      await fetch(`${API_URL}/cart/${userId}/removeAll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, size }),
      });
    } catch (err) {
      console.error("Error removing all from cart:", err);
    }
  };

  // 💰 Calculate total cart amount
  const getCartTotal = () => {
    return Object.entries(cartItems).reduce((total, [key, qty]) => {
      const [productId] = key.split("_");
      const product =
        products.find(
          (p) =>
            p._id === productId || p.id === Number(productId)
        ) || {};
      return total + (product.new_price || 0) * qty;
    }, 0);
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        loading,
        error,
        cartItems,
        addToCart,
        removeFromCart,
        removeAllFromCart,
        getCartTotal,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
