const express = require("express");
const Feedback = require("../models/Feedback");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const auth = require("../middleware/auth");

const router = express.Router();

// Student: submit feedback (one per event)
router.post("/:eventId", auth("student"), async (req, res) => {
  try {
    const { rating, comments } = req.body;
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    // Optionally enforce only after event date
    if (new Date(event.date) > new Date()) {
      return res.status(400).json({ msg: "Feedback can be submitted after the event" });
    }

    const reg = await Registration.findOne({ event: event._id, student: req.user.id });
    if (!reg) return res.status(400).json({ msg: "Only registered students can submit feedback" });

    const existing = await Feedback.findOne({ event: event._id, student: req.user.id });
    if (existing) return res.status(400).json({ msg: "Feedback already submitted" });

    const feedback = await Feedback.create({ event: event._id, student: req.user.id, rating, comments });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Admin/Public: get feedback for event
router.get("/:eventId", async (req, res) => {
  try {
    const list = await Feedback.find({ event: req.params.eventId })
      .populate("student", "userId name department")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Admin: get aggregated feedback stats
router.get("/:eventId/stats", auth("admin"), async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      { $match: { event: require('mongoose').Types.ObjectId(req.params.eventId) } },
      {
        $group: {
          _id: "$event",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats[0] || { avgRating: 0, count: 0 });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
