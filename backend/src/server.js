require("dotenv").config();
const mongoose = require("mongoose");
const { createApp } = require("./app");

const PORT = Number(process.env.PORT || 5000);
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/event_sourcing_task_manager";

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
  await new Promise((resolve, reject) => {
    mongoose.model("TaskEvent").init().then(resolve, reject);
  });
  createApp().listen(PORT, () =>
    console.log(`API running on http://localhost:${PORT}`),
  );
}
start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
