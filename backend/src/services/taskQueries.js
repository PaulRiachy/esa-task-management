const { ApiError } = require("../errors");
const { projectTask, projectAllTasks } = require("../projectTask");

function makeTaskQueries({ eventStore }) {
  return {
    async listTasks(completed) {
      const tasks = projectAllTasks(await eventStore.getAllEvents());
      return completed === undefined
        ? tasks
        : tasks.filter((t) => t.isCompleted === completed);
    },
    async getTask(id) {
      const history = await eventStore.getEvents(id);
      if (!history.length) throw new ApiError(404, "Task not found");
      return projectTask(history);
    },
    async getHistory(id) {
      const history = await eventStore.getEvents(id);
      if (!history.length) throw new ApiError(404, "Task not found");
      return history;
    },
    async getTaskAtVersion(id, version) {
      const history = await this.getHistory(id);
      if (
        !Number.isInteger(version) ||
        version < 1 ||
        version > history.length
      ) {
        throw new ApiError(400, "Invalid task version");
      }
      return projectTask(history.filter((e) => e.version <= version));
    },
  };
}
module.exports = { makeTaskQueries };
