import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import "./CSS/LoginSignup.css";

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true); // default show login
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // use context

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    setSuccess("");


    // Use API_URL from env or fallback
    const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "https://e-commerc-y0jw.onrender.com");
    const url = isLogin ? `${API_URL}/login` : `${API_URL}/register`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        if (isLogin) {
          login(data.user, data.token); // ✅ updates context + localStorage
          setSuccess("Login successful!");
          navigate("/"); // redirect to homepage
        } else {
          setSuccess("Signup successful! Please login.");
          setFormData({ name: "", email: "", password: "" });
          setIsLogin(true);
        }
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>{isLogin ? "Login" : "Sign Up"}</h1>
        <div className="loginsignup-fields">
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <button onClick={handleSubmit}>{isLogin ? "Login" : "Sign Up"}</button>
        <p className="loginsignup-login">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Login here"}
          </span>
        </p>
        {!isLogin && (
          <div className="loginsignup-agree">
            <input type="checkbox" id="agree" />
            <p>By continuing, I agree to the terms of use & privacy policy</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;
