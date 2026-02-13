const express = require("express");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const SeminarHall = require("../models/SeminarHall");
const auth = require("../middleware/auth");

const router = express.Router();

// ================= ADMIN: GET ALL EVENTS =================
router.get("/events/admin/all", auth("admin"), async (req, res) => {
  const events = await Event.find({})
    .populate("hall")
    .populate("createdBy", "userId name")
    .sort({ createdAt: -1 });

  res.json(events);
});

// ================= FEATURED EVENTS =================
router.get("/events/special/featured", async (req, res) => {
  const events = await Event.find({ featured: true, status: "active" })
    .populate("hall")
    .limit(6);

  res.json(events);
});

// ================= LIST EVENTS WITH FILTERS =================
router.get("/events", async (req, res) => {
  const { date, hallId, department, category, featured, search } = req.query;
  const query = { status: "active" };

  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    query.date = { $gte: d, $lt: next };
  }

  if (hallId) query.hall = hallId;
  if (department) query.department = department;
  if (category) query.category = category;
  if (featured === "true") query.featured = true;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const events = await Event.find(query)
    .populate("hall")
    .populate("createdBy", "userId name")
    .sort({ date: 1 });

  res.json(events);
});

// ================= GET SINGLE EVENT (BY _id) =================
router.get("/events/:id", async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate("hall")
    .populate("createdBy", "userId name");

  if (!event) return res.status(404).json({ msg: "Event not found" });

  const registrationsCount = await Registration.countDocuments({
    event: event._id
  });

  res.json({
    event,
    registrationsCount
  });
});

// ================= CREATE EVENT (Admin only) =================
router.post("/events",auth("admin"),async (req, res) => {
    try {
      const {
        hall: hallId,
        date,
        startTime,
        endTime,
        maxRegistrations
      } = req.body;

      const hall = await SeminarHall.findById(hallId);
      if (!hall) return res.status(400).json({ msg: "Invalid hall" });

      if (maxRegistrations > hall.capacity) {
        return res.status(400).json({ msg: "Max registrations exceed hall capacity" });
      }

      // Check for time conflicts: same hall, same date, overlapping times
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const existing = await Event.find({
        hall: hallId,
        date: { $gte: dayStart, $lt: dayEnd },
        status: { $ne: "cancelled" }
      });

      const toMinutes = t => {
        const [hh, mm] = (t || "0:00").split(":");
        return parseInt(hh) * 60 + parseInt(mm);
      };

      const sA = toMinutes(startTime);
      const eA = toMinutes(endTime);

      for (const ev of existing) {
        const sB = toMinutes(ev.startTime);
        const eB = toMinutes(ev.endTime);
        const overlap = Math.max(sA, sB) < Math.min(eA, eB);
        if (overlap) {
          return res.status(400).json({ msg: "Venue conflict: overlapping event in same hall" });
        }
      }

      const event = await Event.create({
        ...req.body,
        createdBy: req.user.id // internal _id
      });

      res.json(event);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }
);

// ================= UPDATE EVENT (Admin or owner) =================
router.put("/events/:id", auth(["admin", "faculty", "organizer"]), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    // only admin or creator can update
    if (req.user.role !== "admin" && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Forbidden: not event owner" });
    }

    // If hall/date/time changed, check conflicts
    const updated = { ...req.body };
    if (updated.hall || updated.date || updated.startTime || updated.endTime) {
      const hallId = updated.hall || event.hall;
      const date = updated.date || event.date;
      const startTime = updated.startTime || event.startTime;
      const endTime = updated.endTime || event.endTime;

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const existing = await Event.find({
        _id: { $ne: event._id },
        hall: hallId,
        date: { $gte: dayStart, $lt: dayEnd },
        status: { $ne: "cancelled" }
      });

      const toMinutes = t => {
        const [hh, mm] = (t || "0:00").split(":");
        return parseInt(hh) * 60 + parseInt(mm);
      };

      const sA = toMinutes(startTime);
      const eA = toMinutes(endTime);

      for (const ev of existing) {
        const sB = toMinutes(ev.startTime);
        const eB = toMinutes(ev.endTime);
        const overlap = Math.max(sA, sB) < Math.min(eA, eB);
        if (overlap) {
          return res.status(400).json({ msg: "Venue conflict: overlapping event in same hall" });
        }
      }
    }

    const saved = await Event.findByIdAndUpdate(req.params.id, updated, { new: true }).populate("hall");
    res.json(saved);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// ================= ADMIN: DELETE EVENT =================
router.delete("/events/:id", auth(["admin", "faculty", "organizer"]), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    if (req.user.role !== "admin" && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Forbidden: not event owner" });
    }

    await Event.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ event: req.params.id });
    res.json({ msg: "Event deleted" });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// ================= ADMIN: UPDATE EVENT STATUS =================
router.patch("/:id/status", auth("admin"), async (req, res) => {
  const { status } = req.body;
  if (!["active", "cancelled", "completed"].includes(status)) {
    return res.status(400).json({ msg: "Invalid status" });
  }

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(event);
});

// ================= ADMIN: TOGGLE FEATURED =================
router.patch("/events/:id/featured", auth("admin"), async (req, res) => {
  const event = await Event.findById(req.params.id);
  event.featured = !event.featured;
  await event.save();
  res.json(event);
});

// ================= ADMIN: GENERATE JOIN LINK =================
router.post("/events/:id/generate-link", auth("admin"), async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ msg: "Event not found" });

  const linkCode = `${event.eventId}-${Math.random().toString(36).slice(2, 8)}`;
  event.joinLink = linkCode;
  event.joinLinkActive = true;
  await event.save();

  res.json({
    joinLink: linkCode,
    shareUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/join/${linkCode}`
  });
});

// ================= ADMIN: DEACTIVATE JOIN LINK =================
router.post("/events/:id/deactivate-link", auth("admin"), async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ msg: "Event not found" });

  event.joinLinkActive = false;
  await event.save();

  res.json({ msg: "Join link deactivated" });
});

// ================= PUBLIC: JOIN EVENT =================
router.get("/events/join/:linkCode", async (req, res) => {
  const event = await Event.findOne({
    joinLink: req.params.linkCode,
    joinLinkActive: true,
    status: "active"
  }).populate("hall");

  if (!event) {
    return res.status(404).json({ msg: "Invalid or expired join link" });
  }

  res.json({
    event,
    canJoin: true
  });
});

module.exports = router;
