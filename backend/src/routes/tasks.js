const express = require("express");
const { ApiError } = require("../errors");

function makeTaskRouter(commands, queries) {
  const router = express.Router();
  const wrap = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res)).catch(next);

  router.post(
    "/",
    wrap(async (req, res) => {
      res.status(201).json(await commands.createTask(req.body || {}));
    }),
  );
  router.put(
    "/:id/complete",
    wrap(async (req, res) => {
      res.json(await commands.completeTask(req.params.id));
    }),
  );
  router.get(
    "/",
    wrap(async (req, res) => {
      const { completed } = req.query;
      if (completed !== undefined && !["true", "false"].includes(completed)) {
        throw new ApiError(400, "completed must be true or false");
      }
      res.json(
        await queries.listTasks(
          completed === undefined ? undefined : completed === "true",
        ),
      );
    }),
  );
  router.get(
    "/:id/history",
    wrap(async (req, res) => {
      res.json(await queries.getHistory(req.params.id));
    }),
  );
  router.get(
    "/:id/at/:version",
    wrap(async (req, res) => {
      res.json(
        await queries.getTaskAtVersion(
          req.params.id,
          Number(req.params.version),
        ),
      );
    }),
  );
  router.get(
    "/:id",
    wrap(async (req, res) => {
      res.json(await queries.getTask(req.params.id));
    }),
  );
  return router;
}
module.exports = { makeTaskRouter };
