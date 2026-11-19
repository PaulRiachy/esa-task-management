// Run: npm run replay
// Reads only saved events and rebuilds the task list from scratch.
require("dotenv").config();
const mongoose = require("mongoose");
const TaskEvent = require("../models/TaskEvent");
const { makeEventStore } = require("../eventStore");
const { projectAllTasks } = require("../projectTask");

async function main() {
  await mongoose.connect(
    process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/event_sourcing_task_manager",
  );
  try {
    const events = await makeEventStore(TaskEvent).getAllEvents();
    const tasks = projectAllTasks(events);
    console.log(
      `Replayed ${events.length} event(s) to rebuild ${tasks.length} task(s):`,
    );
    console.table(
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.isCompleted,
        version: t.version,
      })),
    );
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
