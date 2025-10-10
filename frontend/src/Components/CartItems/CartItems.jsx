import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CartItems.css";
import { ShopContext } from "../../Context/ShopContext";
import { AuthContext } from "../../Context/AuthContext";
import remove_icon from "../Assets/cart_cross_icon.png";
import { useEffect } from "react";


const CartItems = () => {
  const { products, cartItems, addToCart, removeFromCart, removeAllFromCart } =
    useContext(ShopContext);

  useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  document.body.appendChild(script);
  return () => {
    document.body.removeChild(script);
  };
}, []);

  const { user } = useContext(AuthContext);
  const userId = user?._id;

  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [message, setMessage] = useState("");

  if (!products || products.length === 0) return <h2>Loading products...</h2>;

  let subtotal = 0;
  Object.keys(cartItems).forEach((key) => {
    const [pid, size] = key.split("_");
    const qty = cartItems[key];
    const product = products.find((p) => String(p.id) === pid);
    if (product) subtotal += product.new_price * qty;
  });

  const totalItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  const shipping = totalItems > 0 ? 10 : 0;
  const grandTotal = subtotal + shipping;

  const handleApplyPromo = () => {
    if (promoCode.trim().toLowerCase() === "save10") {
      setMessage("✅ Promo applied! You saved 10%.");
    } else if (promoCode.trim() === "") {
      setMessage("⚠️ Please enter a promo code.");
    } else {
      setMessage("❌ Invalid promo code.");
    }
  };

  const handlePayment = async () => {
  if (!userId) {
    alert("User not logged in");
    return;
  }

  try {
    // Use API_URL from env or fallback
    const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "https://e-commerc-y0jw.onrender.com");

    // 1️⃣ Create an order on your backend
    const orderResponse = await fetch(`${API_URL}/payment/orders/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: grandTotal }), // send in rupees
    });

    const orderData = await orderResponse.json();

    if (!orderData || !orderData.id) {
      alert("Failed to create order");
      return;
    }

    const options = {
      key: "rzp_test_RNm6m4k3l5DRVUv",
      amount: orderData.amount,   // backend amount in paise
      currency: orderData.currency,
      name: "My Shop",
      description: "Test Transaction",
      order_id: orderData.id,
      handler: async (response) => {
        const verifyResponse = await fetch(`${API_URL}/payment/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        const verifyData = await verifyResponse.json();
        if (verifyData.success) {
          alert("🎉 Payment successful!");
          navigate("/success");
        } else {
          alert("❌ Payment verification failed");
        }
      },
      theme: { color: "#3399cc" },
    };

    const rzp = new window.Razorpay(options);
rzp.open();
  } catch (error) {
    console.error("💥 Payment error:", error);
    alert("Payment failed, please try again.");
  }
};


  if (totalItems === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <h2>🛒 Nothing in your cart</h2>
          <p>Looks like you haven’t added anything yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-content">
        <div className="cartitems">
          <div className="format-main">
            <p>Image</p>
            <p>Product</p>
            <p>Old Price</p>
            <p>New Price</p>
            <p>Quantity</p>
            <p>Total</p>
            <p>Remove</p>
          </div>
          <hr />
          {Object.keys(cartItems).map((key) => {
            const [pid, size] = key.split("_");
            const qty = cartItems[key];
            const product = products.find((p) => String(p.id) === pid);
            if (!product) return null;

            return (
              <div key={key} className="cartitems-format">
                <img
                  src={product.images?.[0]}
                  alt={product.name}
                  className="carticon-product-icon"
                />
                <p>
                  {product.name} {size ? `(${size})` : ""}
                </p>
                <p style={{ textDecoration: "line-through", color: "#888" }}>
                  ${product.old_price}
                </p>
                <p>${product.new_price}</p>
                <div className="cartitems-quantity-control">
                  <span>{qty}</span>
                </div>
                <p>${qty * product.new_price}</p>
                <img
                  src={remove_icon}
                  alt="Remove"
                  className="cart-remove-icon"
                  onClick={() => removeAllFromCart(pid, size)}
                />
                <hr />
              </div>
            );
          })}
        </div>

        <div className="cart-sidebar">
          <div className="cart-promocode-section">
            <h4 className="promo-heading">Have a promo code?</h4>
            <div className="cart-promocode">
              <input
                type="text"
                placeholder="Enter promo code"
                className="promocode-input"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button className="promocode-btn" onClick={handleApplyPromo}>
                Apply
              </button>
            </div>
            {message && <p className="promo-message">{message}</p>}
          </div>

          <div className="cart-total-container">
            <div className="cart-total-box">
              <h3>Cart Summary</h3>
              <div className="cart-total-line">
                <span>Subtotal:</span>
                <span>${subtotal}</span>
              </div>
              <div className="cart-total-line">
                <span>Shipping:</span>
                <span>${shipping}</span>
              </div>
              <hr />
              <div className="cart-total-line cart-grand-total">
                <span>Grand Total:</span>
                <span>${grandTotal}</span>
              </div>

              <button className="checkout-btn" onClick={handlePayment}>
                Pay with Razorpay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
