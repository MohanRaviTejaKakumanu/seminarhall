import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import "../Auth.css";

const RegisterPage = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: "student",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone, form.role);
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const backgroundStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url(/image.jpg)`
  };

  return (
    <div className="auth-bg" style={backgroundStyle}>
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Register to continue</p>

        {/* ✅ ROLE BOXES */}
        <div className="role-container">
          <div
            className={`role-box ${form.role === "student" ? "active" : ""}`}
            onClick={() => setForm({ ...form, role: "student" })}
          >
            Student
          </div>

          <div
            className={`role-box ${form.role === "admin" ? "active" : ""}`}
            onClick={() => setForm({ ...form, role: "admin" })}
          >
            Admin
          </div>
        </div>

        <form onSubmit={submit}>
          {/* Full Name */}
          <div className="input-group">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <label>Full Name</label>
          </div>

          {/* Email */}
          <div className="input-group">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <label>Email</label>
          </div>

          {/* Phone Number */}
          <div className="input-group">
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <label>Phone Number</label>
          </div>

          {/* Password */}
          <div className="input-group">
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <label>Password</label>
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />
            <label>Confirm Password</label>
          </div>

          {error && <div className="error">{error}</div>}

          <button className="login-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="footer-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
