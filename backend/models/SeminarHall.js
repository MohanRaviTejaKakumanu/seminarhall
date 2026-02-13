const mongoose = require("mongoose");

const seminarHallSchema = new mongoose.Schema(
  {
    hallId: {
      type: String,
      unique: true,
      required: true,
      index: true,// Add an index on hallId
    },

    name: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 }, // Ensure capacity is a positive integer
  facilities: [{ type: String }],
  },
  { timestamps: true }
);

// Auto-generate Hall ID
seminarHallSchema.pre("save", function (next) {
  if (!this.hallId) {
    this.hallId = `HALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model("SeminarHall", seminarHallSchema);
