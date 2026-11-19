function registerNotificationConsumer(eventBus) {
  eventBus.subscribe("TaskCreated", (event) => {
    console.log(`[Notification] New task: ${event.payload.title}`);
  });
  eventBus.subscribe("TaskCompleted", (event) => {
    console.log(`[Notification] Task completed: ${event.taskId}`);
  });
}
module.exports = { registerNotificationConsumer };
