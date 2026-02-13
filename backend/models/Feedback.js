const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    feedbackId: { type: String, unique: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comments: { type: String }
  },
  { timestamps: true }
);

feedbackSchema.index({ event: 1, student: 1 }, { unique: true });

feedbackSchema.pre("save", function (next) {
  if (!this.feedbackId) {
    this.feedbackId = `FDB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model("Feedback", feedbackSchema);
