// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/halls", require("./routes/halls"));
app.use("/api/events", require("./routes/events"));
app.use("/api/registrations", require("./routes/registrations"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/feedback", require("./routes/feedback"));
app.use("/api/posters", require("./routes/posters"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));