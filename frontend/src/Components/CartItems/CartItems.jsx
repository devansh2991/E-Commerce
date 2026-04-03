import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CartItems.css";
import { ShopContext } from "../../Context/ShopContext";
import { AuthContext } from "../../Context/AuthContext";
import remove_icon from "../Assets/cart_cross_icon.png";

const CartItems = () => {
  const { products, cartItems, addToCart, removeFromCart, removeAllFromCart } =
    useContext(ShopContext);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const { user } = useContext(AuthContext);
  const userId = user?._id;
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState("");
  const [message, setMessage] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentStep, setPaymentStep] = useState("select"); // select | upi-qr | processing | success
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [upiId, setUpiId] = useState("");
  const [orderId, setOrderId] = useState("");

  if (!products || products.length === 0) return <h2>Loading products...</h2>;

  let subtotal = 0;
  Object.keys(cartItems).forEach((key) => {
    const [pid] = key.split("_");
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

  const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://e-commerc-y0jw.onrender.com");

  const formatCardNumber = (val) => {
    const v = val.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  const handleCheckout = () => {
    if (!userId) {
      navigate("/login");
      return;
    }
    setShowCheckout(true);
    setPaymentStep("select");
  };

  const processPayment = async () => {
    // If UPI selected, show QR first
    if (paymentMethod === "upi" && paymentStep !== "upi-qr") {
      setPaymentStep("upi-qr");
      return;
    }
    setPaymentStep("processing");

    try {
      // Create order on backend
      const orderResponse = await fetch(`${API_URL}/payment/orders/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal }),
      });
      const orderData = await orderResponse.json();

      if (!orderData || !orderData.id) {
        setPaymentStep("select");
        return;
      }

      setOrderId(orderData.id);

      // Simulate processing delay for realism
      await new Promise((r) => setTimeout(r, 2500));

      // Verify payment
      const verifyResponse = await fetch(`${API_URL}/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: orderData.id,
          razorpay_payment_id: `pay_${Date.now()}`,
          razorpay_signature: "demo_signature",
          demo: true,
        }),
      });
      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        setPaymentStep("success");
        try {
          await fetch(`${API_URL}/cart/${userId}/clear`, { method: "POST" });
        } catch (e) { /* ok */ }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentStep("select");
    }
  };

  const closeAndRedirect = () => {
    setShowCheckout(false);
    navigate("/");
  };

  if (totalItems === 0 && paymentStep !== "success") {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <h2>🛒 Nothing in your cart</h2>
          <p>Looks like you haven't added anything yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* ===== PAYMENT MODAL ===== */}
      {showCheckout && (
        <div className="payment-overlay">
          <div className="payment-modal">
            {/* CLOSE BTN */}
            {paymentStep !== "processing" && paymentStep !== "success" && (
              <button className="payment-close" onClick={() => setShowCheckout(false)}>✕</button>
            )}

            {/* ===== STEP 1: SELECT PAYMENT ===== */}
            {paymentStep === "select" && (
              <>
                <div className="payment-header">
                  <div className="payment-logo">🔒</div>
                  <h2>Secure Checkout</h2>
                  <p className="payment-amount-display">₹{grandTotal.toFixed(2)}</p>
                </div>

                <div className="payment-methods">
                  <div
                    className={`payment-method-card ${paymentMethod === "card" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <span className="pm-icon">💳</span>
                    <span>Credit / Debit Card</span>
                    <span className="pm-check">{paymentMethod === "card" ? "●" : "○"}</span>
                  </div>
                  <div
                    className={`payment-method-card ${paymentMethod === "upi" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    <span className="pm-icon">📱</span>
                    <span>UPI (GPay / PhonePe)</span>
                    <span className="pm-check">{paymentMethod === "upi" ? "●" : "○"}</span>
                  </div>
                  <div
                    className={`payment-method-card ${paymentMethod === "netbanking" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("netbanking")}
                  >
                    <span className="pm-icon">🏦</span>
                    <span>Net Banking</span>
                    <span className="pm-check">{paymentMethod === "netbanking" ? "●" : "○"}</span>
                  </div>
                  <div
                    className={`payment-method-card ${paymentMethod === "cod" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    <span className="pm-icon">💵</span>
                    <span>Cash on Delivery</span>
                    <span className="pm-check">{paymentMethod === "cod" ? "●" : "○"}</span>
                  </div>
                </div>

                {/* Card Form */}
                {paymentMethod === "card" && (
                  <div className="payment-form">
                    <div className="pf-field">
                      <label>Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                      />
                      <div className="card-icons">
                        <span>VISA</span><span>MC</span><span>RuPay</span>
                      </div>
                    </div>
                    <div className="pf-row">
                      <div className="pf-field">
                        <label>Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        />
                      </div>
                      <div className="pf-field">
                        <label>CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={4}
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="pf-field">
                      <label>Name on Card</label>
                      <input
                        type="text"
                        placeholder="JOHN DOE"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                )}

                {/* UPI Form */}
                {paymentMethod === "upi" && (
                  <div className="payment-form">
                    <div className="pf-field">
                      <label>UPI ID</label>
                      <input
                        type="text"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                    <div className="upi-apps">
                      <div className="upi-app" onClick={() => setUpiId("user@oksbi")}>
                        <span className="upi-logo">G</span><span>GPay</span>
                      </div>
                      <div className="upi-app" onClick={() => setUpiId("user@ybl")}>
                        <span className="upi-logo">P</span><span>PhonePe</span>
                      </div>
                      <div className="upi-app" onClick={() => setUpiId("user@paytm")}>
                        <span className="upi-logo">₹</span><span>Paytm</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                {paymentMethod === "netbanking" && (
                  <div className="payment-form">
                    <div className="pf-field">
                      <label>Select Bank</label>
                      <select className="bank-select">
                        <option>State Bank of India</option>
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                        <option>Punjab National Bank</option>
                        <option>Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* COD */}
                {paymentMethod === "cod" && (
                  <div className="payment-form">
                    <div className="cod-info">
                      <p>💵 Pay ₹{grandTotal.toFixed(2)} when your order arrives</p>
                      <p className="cod-note">An additional ₹30 COD charge may apply.</p>
                    </div>
                  </div>
                )}

                <button className="payment-pay-btn" onClick={processPayment}>
                  {paymentMethod === "cod"
                    ? `Place Order • ₹${grandTotal.toFixed(2)}`
                    : `Pay ₹${grandTotal.toFixed(2)}`}
                </button>

                <div className="payment-secure-badge">
                  🔒 Secured by 256-bit SSL encryption
                </div>
              </>
            )}

            {/* ===== STEP 1.5: UPI QR ===== */}
            {paymentStep === "upi-qr" && (
              <div className="payment-qr-container">
                <h3>Scan & Pay</h3>
                <p>Scan the QR code with any UPI app to pay <strong style={{ color: "#6c63ff", fontSize: '18px' }}>₹{grandTotal.toFixed(2)}</strong></p>
                <img src="/paymentupi.jpeg" alt="UPI QR Code" className="upi-qr-image" />
                <p className="qr-timer">Please pay within 05:00</p>
                <div className="qr-actions">
                  <button className="qr-pay-btn" onClick={processPayment}>I've Paid</button>
                  <button className="qr-cancel-btn" onClick={() => setPaymentStep("select")}>Cancel</button>
                </div>
              </div>
            )}

            {/* ===== STEP 2: PROCESSING ===== */}
            {paymentStep === "processing" && (
              <div className="payment-processing">
                <div className="spinner"></div>
                <h3>Processing Payment...</h3>
                <p>Please do not close this window</p>
                <div className="processing-details">
                  <p>Amount: ₹{grandTotal.toFixed(2)}</p>
                  <p>Method: {paymentMethod === "card" ? "Credit/Debit Card" : paymentMethod === "upi" ? "UPI" : paymentMethod === "netbanking" ? "Net Banking" : "Cash on Delivery"}</p>
                </div>
              </div>
            )}

            {/* ===== STEP 3: SUCCESS ===== */}
            {paymentStep === "success" && (
              <div className="payment-success">
                <div className="success-checkmark">
                  <div className="check-icon">✓</div>
                </div>
                <h2>Payment Successful!</h2>
                <p className="success-amount">₹{grandTotal.toFixed(2)}</p>
                <div className="success-details">
                  <div className="success-row"><span>Order ID</span><span>{orderId.substring(0, 20)}...</span></div>
                  <div className="success-row"><span>Method</span><span>{paymentMethod === "card" ? "Card" : paymentMethod === "upi" ? "UPI" : paymentMethod === "netbanking" ? "Net Banking" : "COD"}</span></div>
                  <div className="success-row"><span>Status</span><span className="status-paid">Paid ✓</span></div>
                </div>
                <button className="payment-done-btn" onClick={closeAndRedirect}>
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CART CONTENT ===== */}
      <div className="cart-content">
        <div className="cartitems">
          <div className="format-main">
            <p>Image</p><p>Product</p><p>Old Price</p><p>New Price</p><p>Quantity</p><p>Total</p><p>Remove</p>
          </div>
          <hr />
          {Object.keys(cartItems).map((key) => {
            const [pid, size] = key.split("_");
            const qty = cartItems[key];
            const product = products.find((p) => String(p.id) === pid);
            if (!product) return null;
            return (
              <div key={key} className="cartitems-format">
                <img src={product.images?.[0]} alt={product.name} className="carticon-product-icon" />
                <p>{product.name} {size ? `(${size})` : ""}</p>
                <p style={{ textDecoration: "line-through", color: "#888" }}>${product.old_price}</p>
                <p>${product.new_price}</p>
                <div className="cartitems-quantity-control">
                  <button className="qty-btn" onClick={() => removeFromCart(Number(pid), size)}>−</button>
                  <span className="qty-value">{qty}</span>
                  <button className="qty-btn" onClick={() => addToCart(Number(pid), size)}>+</button>
                </div>
                <p>${qty * product.new_price}</p>
                <img src={remove_icon} alt="Remove" className="cart-remove-icon" onClick={() => removeAllFromCart(pid, size)} />
                <hr />
              </div>
            );
          })}
        </div>

        <div className="cart-sidebar">
          <div className="cart-promocode-section">
            <h4 className="promo-heading">Have a promo code?</h4>
            <div className="cart-promocode">
              <input type="text" placeholder="Enter promo code" className="promocode-input" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
              <button className="promocode-btn" onClick={handleApplyPromo}>Apply</button>
            </div>
            {message && <p className="promo-message">{message}</p>}
          </div>

          <div className="cart-total-container">
            <div className="cart-total-box">
              <h3>Cart Summary</h3>
              <div className="cart-total-line"><span>Subtotal:</span><span>${subtotal}</span></div>
              <div className="cart-total-line"><span>Shipping:</span><span>${shipping}</span></div>
              <hr />
              <div className="cart-total-line cart-grand-total"><span>Grand Total:</span><span>${grandTotal}</span></div>
              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
