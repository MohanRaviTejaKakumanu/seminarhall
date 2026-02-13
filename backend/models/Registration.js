const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      unique: true,
      required: true
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// Prevent same student registering for same event twice
registrationSchema.index({ event: 1, student: 1 }, { unique: true });

// Auto-generate Registration ID
registrationSchema.pre("save", function (next) {
  if (!this.registrationId) {
    this.registrationId = `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model("Registration", registrationSchema);