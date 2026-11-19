const mongoose = require("mongoose");

// Only events are persisted.
const taskEventSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true, index: true },
    version: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      required: true,
      enum: ["TaskCreated", "TaskCompleted"],
    },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    occurredAt: { type: Date, default: Date.now, required: true },
  },
  { versionKey: false },
);

// Prevent two events from claiming the same position in a task's history.
taskEventSchema.index({ taskId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("TaskEvent", taskEventSchema);
