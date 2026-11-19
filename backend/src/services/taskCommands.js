const { randomUUID } = require("node:crypto");
const { ApiError } = require("../errors");
const { projectTask } = require("../projectTask");

function makeTaskCommands({ eventStore, eventBus }) {
  return {
    async createTask({ title, description = "" } = {}) {
      if (typeof title !== "string" || !title.trim()) {
        throw new ApiError(400, "Task title must not be blank");
      }
      if (typeof description !== "string") {
        throw new ApiError(400, "Description must be text");
      }
      const event = await eventStore.append({
        taskId: randomUUID(),
        type: "TaskCreated",
        payload: { title: title.trim(), description: description.trim() },
        expectedVersion: 0,
      });
      eventBus.publish(event); // Other consumers react after the event is saved.
      return projectTask([event]);
    },

    async completeTask(id) {
      const history = await eventStore.getEvents(id);
      if (!history.length) throw new ApiError(404, "Task not found");
      const current = projectTask(history);
      if (current.isCompleted)
        throw new ApiError(409, "Task is already completed");
      const event = await eventStore.append({
        taskId: id,
        type: "TaskCompleted",
        payload: {},
        expectedVersion: current.version,
      });
      eventBus.publish(event);
      return projectTask([...history, event]);
    },
  };
}
module.exports = { makeTaskCommands };
