const mongoose = require("mongoose");

const stageEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["video_upload", "food_order"],
    },
    status: {
      type: String,
      required: true,
      default: "Queued",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stages: {
      type: [stageEntrySchema],
      default: [],
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
jobSchema.index({ createdAt: -1 });
jobSchema.index({ status: 1 });

module.exports = mongoose.model("Job", jobSchema);
