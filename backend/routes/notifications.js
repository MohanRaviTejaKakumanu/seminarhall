// backend/routes/notifications.js
const express = require("express");
const Notification = require("../models/Notification");
const Registration = require("../models/Registration");
const auth = require("../middleware/auth");

const router = express.Router();

// ================= STUDENT: GET MY NOTIFICATIONS =================
router.get("/my", auth("student"), async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id // internal unique _id
    })
      .populate("event", "eventId title")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= STUDENT: MARK AS READ =================
router.patch("/:id/read", auth("student"), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    res.json(notification);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= STUDENT: DELETE NOTIFICATION =================
router.delete("/:id", auth("student"), async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ msg: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= ADMIN: BROADCAST TO EVENT REGISTRATIONS =================
router.post("/broadcast/:eventId", auth("admin"), async (req, res) => {
  try {
    const { title, message } = req.body;

    // Get all registrations for the event
    const registrations = await Registration.find({
      event: req.params.eventId
    });

    // Unique student IDs
    const userIds = registrations.map(r => r.student);

    const notifications = userIds.map(userId => ({
      user: userId,                 // unique user _id
      event: req.params.eventId,    // unique event _id
      type: "event_updated",
      title,
      message
    }));

    await Notification.insertMany(notifications);

    res.json({
      msg: `Notification sent to ${notifications.length} students`
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
