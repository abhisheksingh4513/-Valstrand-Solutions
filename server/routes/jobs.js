const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const { processJob, STAGE_MAP } = require("../workers/jobWorker");

/* ──────────────────────────────────────────────
   POST /api/jobs  —  Create a new job
   ────────────────────────────────────────────── */
router.post("/", async (req, res) => {
    try {
        const { title, type } = req.body;

        if (!title || !type) {
            return res.status(400).json({ error: "title and type are required" });
        }

        if (!STAGE_MAP[type]) {
            return res.status(400).json({ error: `Invalid type. Must be one of: ${Object.keys(STAGE_MAP).join(", ")}` });
        }

        const initialStatus = STAGE_MAP[type][0]; // e.g. "Uploaded" or "Placed"

        const job = await Job.create({
            title,
            type,
            status: initialStatus,
            progress: 0,
        });

        // Fire-and-forget background processing
        processJob(job._id, job.type);

        res.status(201).json(job);
    } catch (err) {
        console.error("Create job error:", err);
        res.status(500).json({ error: err.message });
    }
});

/* ──────────────────────────────────────────────
   GET /api/jobs  —  List all jobs (newest first)
   ────────────────────────────────────────────── */
router.get("/", async (_req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 }).lean();
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ──────────────────────────────────────────────
   GET /api/jobs/:id  —  Single job with full details
   ────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).lean();
        if (!job) return res.status(404).json({ error: "Job not found" });
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
