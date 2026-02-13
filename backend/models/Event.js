const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      unique: true,
      required: true
    },

    title: { type: String, required: true },
    description: { type: String },
    department: { type: String },

    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeminarHall",
      required: true
    },

    date: { type: Date, required: true },
    startTime: { type: String, required: true },  // "10:00"
    endTime: { type: String, required: true },    // "12:00"

    // Capacity and registrations
    maxRegistrations: { type: Number, required: true },
    currentRegistrations: { type: Number, default: 0 },

    // Media / schedule / speakers
    posters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Poster" }],
    attachments: [{ type: String }],
    schedule: [
      {
        time: { type: String },
        title: { type: String }
      }
    ],
    speakers: [
      {
        name: { type: String },
        designation: { type: String },
        details: { type: String }
      }
    ],

    organizerName: { type: String },
    organizerContact: { type: String },

    // Status & moderation
    status: { type: String, enum: ["active", "cancelled", "completed"], default: "active" },
    featured: { type: Boolean, default: false },
    category: { type: String },
    approved: { type: Boolean, default: true },

    // Join link
    joinLink: { type: String },
    joinLinkActive: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// Auto-generate Event ID
eventSchema.pre("save", function (next) {
  if (!this.eventId) {
    this.eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model("Event", eventSchema);
