require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const jobRoutes = require("./routes/jobs");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/job-processor";

/* ── Middleware ────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ── Routes ───────────────────────────────── */
app.use("/api/jobs", jobRoutes);

app.get("/", (_req, res) => {
    res.json({ message: "Job Processor API is running 🚀" });
});

/* ── Database + Start ─────────────────────── */
mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });
