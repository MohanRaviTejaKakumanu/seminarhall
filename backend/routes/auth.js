// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, department, rollNumber, role, adminSecret } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    let userRole = "student";
    if (role === "faculty" || role === "organizer") userRole = role;
    if (role === "admin" && adminSecret === process.env.ADMIN_SECRET) {
      userRole = "admin";
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      role: userRole,
      phone,
      department,
      rollNumber
    });

    const token = jwt.sign(
      { id: user._id, userId: user.userId, role: user.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error: " + err.message });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, userId: user.userId, role: user.role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

/* ================= CURRENT USER ================= */
router.get("/me", auth(), async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

/* ================= UPDATE PROFILE ================= */
router.put("/profile/update", auth(), async (req, res) => {
  try {
    const { name, phone, department, rollNumber, bio, interests, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, department, rollNumber, bio, interests, profileImage },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

/* ================= FORGOT PASSWORD ================= */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "Email not registered" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset",
      html: `
        <p>You requested a password reset</p>
        <p><a href="${resetUrl}">Click here to reset password</a></p>
        <p>This link expires in 15 minutes</p>
      `
    });

    res.json({ msg: "Reset password link sent to email" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* ================= RESET PASSWORD ================= */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ msg: "Invalid or expired token" });

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    res.json({ msg: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* ================= ADMIN: GET ALL USERS ================= */
router.get("/admin/users", auth("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

module.exports = router;
