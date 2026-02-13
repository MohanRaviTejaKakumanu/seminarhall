// backend/routes/registrations.js
const express = require("express");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const router = express.Router();

// ================= HELPER: CREATE NOTIFICATION =================
const createNotification = async (
  userId,
  type,
  title,
  message,
  eventId = null,
  actionUrl = null
) => {
  try {
    await Notification.create({
      user: userId,     // unique user _id
      event: eventId,   // unique event _id
      type,
      title,
      message,
      actionUrl
    });
  } catch (err) {
    console.error("Notification creation error:", err.message);
  }
};

// ================= STUDENT: REGISTER FOR EVENT =================
router.post("/:eventId", auth("student"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    // Prevent duplicate registration fast-path
    const existing = await Registration.findOne({ event: event._id, student: req.user.id });
    if (existing) return res.status(400).json({ msg: "Already registered" });

    // Atomically increment currentRegistrations if below maxRegistrations
    const updated = await Event.findOneAndUpdate(
      { _id: event._id, $expr: { $lt: ["$currentRegistrations", "$maxRegistrations"] } },
      { $inc: { currentRegistrations: 1 } },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ msg: "Registration full" });
    }

    // Create registration; if duplicate occurs, rollback increment
    try {
      const registration = await Registration.create({ event: event._id, student: req.user.id });

      await createNotification(
        req.user.id,
        "registration_success",
        "Registration Successful",
        `You have successfully registered for "${event.title}"`,
        event._id,
        `/events/${event._id}`
      );

      return res.json({ registrationId: registration.registrationId, eventId: event.eventId, message: "Registered successfully" });
    } catch (err) {
      // Duplicate key or other error: decrement back
      await Event.findByIdAndUpdate(event._id, { $inc: { currentRegistrations: -1 } });
      if (err.code === 11000) return res.status(400).json({ msg: "Already registered" });
      throw err;
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= STUDENT: CANCEL REGISTRATION =================
router.delete("/:eventId", auth("student"), async (req, res) => {
  try {
    const reg = await Registration.findOneAndDelete({
      event: req.params.eventId,
      student: req.user.id
    });

    if (!reg) return res.status(404).json({ msg: "Registration not found" });

    await Event.findByIdAndUpdate(req.params.eventId, {
      $inc: { currentRegistrations: -1 }
    });

    res.json({ msg: "Registration cancelled" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= STUDENT: CHECK REGISTRATION =================
router.get("/check/:eventId", auth("student"), async (req, res) => {
  try {
    const reg = await Registration.findOne({
      event: req.params.eventId,
      student: req.user.id
    });

    res.json({ registered: !!reg });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= STUDENT: MY REGISTERED EVENTS =================
router.get("/mine", auth("student"), async (req, res) => {
  try {
    const regs = await Registration.find({ student: req.user.id })
      .populate({
        path: "event",
        populate: { path: "hall", select: "hallId name building floor capacity" },
        select:
          "eventId title description category date startTime endTime hall organizerName organizerContact status maxRegistrations currentRegistrations"
      })
      .sort({ createdAt: -1 });

    const events = regs.map(r => ({
      registrationId: r.registrationId,
      registeredAt: r.createdAt,
      ...r.event.toObject()
    }));

    res.json(events);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= PUBLIC: EVENT REGISTRATION COUNT =================
router.get("/event/:eventId", async (req, res) => {
  try {
    const count = await Registration.countDocuments({
      event: req.params.eventId
    });

    res.json({ registrations: count });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
