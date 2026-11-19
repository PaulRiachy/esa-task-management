const { ApiError } = require("./errors");

function makeEventStore(TaskEvent) {
  return {
    async getEvents(taskId) {
      return TaskEvent.find({ taskId }).sort({ version: 1 }).lean();
    },
    async getAllEvents() {
      return TaskEvent.find({}).sort({ occurredAt: 1, _id: 1 }).lean();
    },
    async append({ taskId, type, payload, expectedVersion }) {
      const latest = await TaskEvent.findOne({ taskId })
        .sort({ version: -1 })
        .lean();
      const actualVersion = latest ? latest.version : 0;
      if (actualVersion !== expectedVersion) {
        throw new ApiError(409, "Task changed; reload and try again");
      }
      try {
        const event = await TaskEvent.create({
          taskId,
          type,
          payload,
          version: expectedVersion + 1,
        });
        return event.toObject();
      } catch (error) {
        // The unique index also protects against two concurrent writes.
        if (error.code === 11000) {
          throw new ApiError(409, "Task changed; reload and try again");
        }
        throw error;
      }
    },
  };
}
module.exports = { makeEventStore };
