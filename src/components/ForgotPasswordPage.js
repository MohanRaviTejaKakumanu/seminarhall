// src/components/ForgotPassword.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const submit = (e) => {
    e.preventDefault();
    alert("Reset link sent (UI only)");
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h2 className="auth-title">Forgot Password 🔒</h2>
        <p className="auth-subtitle">Enter your email to reset password</p>

        <form onSubmit={submit}>
          <div className="input-group">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email Address</label>
          </div>

          <button className="login-btn">Send Reset Link</button>
        </form>

        <p className="footer-text">
          Remembered password? <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
