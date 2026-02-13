const express = require("express");
const Poster = require("../models/Poster");
const Event = require("../models/Event");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Add poster for event (authenticated)
router.post("/events/:eventId", auth(["admin", "faculty", "organizer", "student"]), async (req, res) => {
  try {
    const { url, caption } = req.body;
    if (!url) return res.status(400).json({ msg: "Poster URL is required" });

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    const poster = await Poster.create({ event: event._id, user: req.user.id, url, caption });

    // push refs
    await Event.findByIdAndUpdate(event._id, { $push: { posters: poster._id } });
    await User.findByIdAndUpdate(req.user.id, { $push: { posters: poster._id } });

    res.json(poster);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Delete poster by id (owner or admin)
router.delete("/:posterId", auth(["admin", "faculty", "organizer", "student"]), async (req, res) => {
  try {
    const poster = await Poster.findById(req.params.posterId);
    if (!poster) return res.status(404).json({ msg: "Poster not found" });

    if (req.user.role !== "admin" && poster.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Forbidden: not poster owner" });
    }

    await Poster.findByIdAndDelete(poster._id);
    await Event.findByIdAndUpdate(poster.event, { $pull: { posters: poster._id } });
    await User.findByIdAndUpdate(poster.user, { $pull: { posters: poster._id } });

    res.json({ msg: "Poster deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get posters for event
router.get("/events/:eventId", async (req, res) => {
  try {
    const posters = await Poster.find({ event: req.params.eventId }).populate("user", "userId name").sort({ createdAt: -1 });
    res.json(posters);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
