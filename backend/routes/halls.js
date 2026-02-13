// backend/routes/halls.js
const express = require("express");
const SeminarHall = require("../models/SeminarHall");
const auth = require("../middleware/auth");

const router = express.Router();

// ================= PUBLIC: LIST HALLS =================
router.get("/", async (req, res) => {
  try{
  const halls = await SeminarHall.find().sort({ createdAt: -1 });
  res.status(200).json(halls);
} catch (err) {
  res.status(500).json({ msg: "Failed to fetch seminar halls" });
}
});

// ================= ADMIN: CREATE HALL =================
router.post("/", auth("admin"), async (req, res) => {
  try {
    if (!req.body.name || !req.body.building || !req.body.capacity) {
      return res.status(400).json({ msg: "Required fields are missing" });
    }

    const hall = await SeminarHall.create(req.body);
    res.status(201).json(hall);
  } catch (error) {
    res.status(400).json({ msg: "Failed to create seminar hall" });
  }
});


module.exports = router;
