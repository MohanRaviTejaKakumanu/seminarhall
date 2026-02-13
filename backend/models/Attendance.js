const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: { type: String, unique: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["present", "absent"], default: "present" },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    method: { type: String, enum: ["manual", "qr"], default: "manual" }
  },
  { timestamps: true }
);

attendanceSchema.index({ event: 1, student: 1 }, { unique: true });

attendanceSchema.pre("save", function (next) {
  if (!this.attendanceId) {
    this.attendanceId = `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model("Attendance", attendanceSchema);
