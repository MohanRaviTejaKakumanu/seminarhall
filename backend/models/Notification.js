// backend/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    type: { 
      type: String, 
      enum: ["registration_success", "event_updated", "event_cancelled", "event_reminder"],
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    actionUrl: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
