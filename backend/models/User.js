const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      required: true
    },

    name: { 
      type: String, 
      required: true 
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: { 
      type: String, 
      required: true 
    },

    // Roles: admin, faculty, organizer, student
    role: {
      type: String,
      enum: ["student", "admin", "faculty", "organizer"],
      default: "student"
    },

    // Optional profile fields
    phone: { type: String },
    department: { type: String },
    rollNumber: { type: String },
    bio: { type: String },
    interests: [{ type: String }],
    profileImage: { type: String },

    posters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Poster" }],

    // 🔐 Forgot / Reset password fields
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
  },
  { timestamps: true }
);

// Auto-generate User ID
userSchema.pre("save", function (next) {
  if (!this.userId) {
    this.userId = `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
