const mongoose = require("mongoose");

const posterSchema = new mongoose.Schema(
  {
    posterId: { type: String, unique: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    url: { type: String, required: true },
    caption: { type: String }
  },
  { timestamps: true }
);

posterSchema.index({ posterId: 1 });

posterSchema.pre("save", function (next) {
  if (!this.posterId) {
    this.posterId = `PST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model("Poster", posterSchema);
