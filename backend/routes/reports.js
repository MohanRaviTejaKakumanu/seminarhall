// backend/routes/reports.js
const express = require("express");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Admin: comprehensive statistics
router.get("/admin/statistics", auth("admin"), async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: "active" });
    const totalRegistrations = await Registration.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });

    // Most popular events
    const registrationsByEvent = await Registration.aggregate([
      {
        $group: {
          _id: "$event",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "event"
        }
      }
    ]);

    // Events today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventsToday = await Event.find({
      date: { $gte: today, $lt: tomorrow },
      status: "active"
    }).populate("hall").select("title date startTime endTime hall maxRegistrations");

    // Events this week
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const eventsThisWeek = await Event.countDocuments({
      date: { $gte: today, $lt: weekEnd },
      status: "active"
    });

    res.json({
      totalEvents,
      activeEvents,
      totalRegistrations,
      totalStudents,
      mostPopularEvents: registrationsByEvent,
      eventsToday,
      eventsThisWeek
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Public: Get dashboard summary
router.get("/public/summary", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeEventsCount = await Event.countDocuments({ 
      status: "active",
      date: { $gte: today }
    });

    const upcomingRegistrations = await Registration.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const featuredEvents = await Event.find({ 
      featured: true, 
      status: "active" 
    })
      .populate("hall", "name building")
      .limit(6)
      .select("title category date startTime endTime hall maxRegistrations");

    res.json({
      activeEventsCount,
      upcomingRegistrations,
      featuredEvents
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Student: Get event participation summary
router.get("/student/summary", auth("student"), async (req, res) => {
  try {
    const registrations = await Registration.countDocuments({ student: req.user.id });
    
    const upcomingEvents = await Registration.find({ student: req.user.id })
      .populate({
        path: "event",
        match: { status: "active", date: { $gte: new Date() } },
        populate: "hall"
      })
      .sort({ createdAt: -1 });

    const pastEvents = await Registration.find({ student: req.user.id })
      .populate({
        path: "event",
        match: { date: { $lt: new Date() } },
        populate: "hall"
      })
      .sort({ createdAt: -1 });

    res.json({
      totalRegistrations: registrations,
      upcomingEvents: upcomingEvents.filter(r => r.event),
      pastEvents: pastEvents.filter(r => r.event)
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Admin: summary
router.get("/summary", auth("admin"), async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const registrationsPerEvent = await Registration.aggregate([
    { $group: { _id: "$event", count: { $sum: 1 } } }
  ]);

  const popular = await Registration.aggregate([
    { $group: { _id: "$event", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  const eventsToday = await Event.countDocuments({
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  res.json({ registrationsPerEvent, popular, eventsToday });
});

module.exports = router;