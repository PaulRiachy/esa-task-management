// A projection rebuilds a task by replaying its events, in version order.
function projectTask(events) {
  let task = null;
  const ordered = [...events].sort((a, b) => a.version - b.version);
  for (const event of ordered) {
    if (event.type === "TaskCreated") {
      if (task) throw new Error("Invalid history: duplicate TaskCreated");
      task = {
        id: event.taskId,
        title: event.payload.title,
        description: event.payload.description || "",
        isCompleted: false,
        createdAt: new Date(event.occurredAt).toISOString(),
        completedAt: null,
        version: event.version,
      };
    } else if (event.type === "TaskCompleted") {
      if (!task || task.isCompleted)
        throw new Error("Invalid history: cannot complete task");
      task.isCompleted = true;
      task.completedAt = new Date(event.occurredAt).toISOString();
      task.version = event.version;
    } else {
      throw new Error(`Unknown event type: ${event.type}`);
    }
  }
  return task;
}

function projectAllTasks(events) {
  const streams = new Map();
  for (const event of events) {
    if (!streams.has(event.taskId)) streams.set(event.taskId, []);
    streams.get(event.taskId).push(event);
  }
  return [...streams.values()]
    .map(projectTask)
    .filter(Boolean)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
module.exports = { projectTask, projectAllTasks };
