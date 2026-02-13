const express = require("express");
const Attendance = require("../models/Attendance");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const auth = require("../middleware/auth");

const router = express.Router();

// Admin/Faculty: mark attendance manually
router.post("/:eventId/mark", auth(["admin", "faculty", "organizer"]), async (req, res) => {
  try {
    const { studentId, status = "present" } = req.body;
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    // check registration exists
    const reg = await Registration.findOne({ event: event._id, student: studentId });
    if (!reg) return res.status(400).json({ msg: "Student not registered" });

    const attendance = await Attendance.findOneAndUpdate(
      { event: event._id, student: studentId },
      { status, markedBy: req.user.id, method: "manual" },
      { upsert: true, new: true }
    );

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Public/QR: student marks via QR (uses registration)
router.post("/:eventId/qr", auth("student"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    const reg = await Registration.findOne({ event: event._id, student: req.user.id });
    if (!reg) return res.status(400).json({ msg: "Not registered" });

    const attendance = await Attendance.findOneAndUpdate(
      { event: event._id, student: req.user.id },
      { status: "present", markedBy: req.user.id, method: "qr" },
      { upsert: true, new: true }
    );

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Admin: get attendance report for event
router.get("/:eventId/report", auth("admin"), async (req, res) => {
  try {
    const list = await Attendance.find({ event: req.params.eventId })
      .populate("student", "userId name email department")
      .sort({ createdAt: 1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
