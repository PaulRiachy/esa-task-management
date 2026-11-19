const express = require("express");
const cors = require("cors");
const TaskEvent = require("./models/TaskEvent");
const { makeEventStore } = require("./eventStore");
const { makeEventBus } = require("./eventBus");
const {
  registerNotificationConsumer,
} = require("./consumers/notificationConsumer");
const { makeTaskCommands } = require("./services/taskCommands");
const { makeTaskQueries } = require("./services/taskQueries");
const { makeTaskRouter } = require("./routes/tasks");

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const eventStore = makeEventStore(TaskEvent);
  const eventBus = makeEventBus();
  registerNotificationConsumer(eventBus); // Subscription happens at startup.

  const commands = makeTaskCommands({ eventStore, eventBus });
  const queries = makeTaskQueries({ eventStore });
  app.use("/api/tasks", makeTaskRouter(commands, queries));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && error.status === 400) {
      return res.status(400).json({ error: "Invalid JSON" });
    }
    if (error.status)
      return res.status(error.status).json({ error: error.message });
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  });
  return app;
}
module.exports = { createApp };
