import React, { useState, useContext } from "react";
import "./Navbar.css";
import logo from "../Assets/logo.png";
import cart_icon from "../Assets/cart_icon.png";
import { NavLink, useNavigate } from "react-router-dom";
import { ShopContext } from "../../Context/ShopContext";
import { AuthContext } from "../../Context/AuthContext";
import axios from "axios";

const Navbar = () => {
  const [bounce, setBounce] = useState(false);
  const { cartItems, setCartItems } = useContext(ShopContext); // make sure setCartItems is available
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const totalItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);


  // Use API_URL from env or fallback
  const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://e-commerc-y0jw.onrender.com");

  const handleCartClick = async () => {
    if (user) {
      try {
        // Fetch cart from database
        const res = await axios.get(`${API_URL}/cart/${user._id}`);
        const dbCart = {};
        for (const item of res.data.items) {
          const key = `${item.productId}_${item.size || ""}`;
          dbCart[key] = item.quantity;
        }
        setCartItems(dbCart); // update context state
      } catch (err) {
        console.error("Error fetching cart from DB", err);
      }
    }

    setBounce(true);
    window.scrollTo(0, 0);
    setTimeout(() => setBounce(false), 600);

    navigate("/cart"); // navigate to cart page
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="nav-logo">
        <img src={logo} alt="Logo" />
        <p>E-Commerce</p>
      </div>

      <ul className="nav-menu">
        {["shop", "men", "women", "kids"].map((menuName) => (
          <li key={menuName}>
            <NavLink
              to={menuName === "shop" ? "/" : `/${menuName}`}
              className={({ isActive }) => (isActive ? "active-menu" : "")}
              onClick={() => window.scrollTo(0, 0)}
            >
              {menuName.charAt(0).toUpperCase() + menuName.slice(1)}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="nav-login-cart">
        {user ? (
          <>
            <span className="nav-username">Hello, {user.name}</span>
            <button onClick={handleLogout}>Logout</button>

            <div onClick={handleCartClick} style={{ cursor: "pointer", position: "relative" }}>
              <img
                src={cart_icon}
                alt="Cart"
                className={`nav-cart-icon ${bounce ? "bounce" : ""}`}
              />
              {totalItems > 0 && (
                <div className={`nav-cart-count ${bounce ? "bounce" : ""}`}>{totalItems}</div>
              )}
            </div>
          </>
        ) : (
          <NavLink to="/login">
            <button>Login</button>
          </NavLink>
        )}
      </div>
    </div>
  );
};

export default Navbar;
