# Task Manager - Event Sourcing (MERN)

A simple full-stack learning project using **MongoDB, Express, React, and Node.js**.
It is the complete solution to the included Event Sourcing assignment.

## Main idea

Instead of storing a mutable `Task` document, we store **TaskCreated** and **TaskCompleted** events in MongoDB. Each event is appended to a task's history. The **current task state is calculated by replaying those events**.

```text
POST /api/tasks             PUT /api/tasks/:id/complete
       |                              |
       +---------- Commands ----------+
                        |
                 Event Store (MongoDB)
               TaskCreated, TaskCompleted
                        |
                 Replay / Projection
                        |
               GET queries -> React UI
```

The small in-process EventBus also notifies a `NotificationConsumer` after events are persisted. **It is separate from the persistent Event Store.**

## Structure

```text
backend/    Express API, TaskEvent model, event store, commands, queries, projector, tests
frontend/   React interface for tasks, history, and earlier versions
```

## Run

Requires **Node.js 18+** and **MongoDB running locally** (or change the connection string to your MongoDB instance).

First terminal:

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Windows PowerShell: use `Copy-Item .env.example .env` instead of `cp`.

Second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Backend runs on **http://localhost:5000**.

## API

| Method | Route                        | Description                                           |
| ------ | ---------------------------- | ----------------------------------------------------- |
| POST   | `/api/tasks`                 | Append `TaskCreated` event                            |
| PUT    | `/api/tasks/:id/complete`    | Append `TaskCompleted` event                          |
| GET    | `/api/tasks`                 | Replay all task histories; optional `?completed=true` |
| GET    | `/api/tasks/:id`             | Rebuild one task's latest state                       |
| GET    | `/api/tasks/:id/history`     | View all persisted events for one task                |
| GET    | `/api/tasks/:id/at/:version` | Time travel: state at a previous event version        |
| GET    | `/api/health`                | API health check                                      |

## Replay

```bash
cd backend
npm run replay       # Rebuild task list from MongoDB's event history
```

## Key learning points

1. **Event Store:** MongoDB keeps the event history permanently; there is no mutable `Task` collection.
2. **Projection:** `projectTask.js` rebuilds a task by applying its events in order.
3. **CQRS:** `taskCommands.js` appends events; `taskQueries.js` reconstructs task data for reads.
4. **EventBus:** Notification consumers subscribe at startup and react after events are saved.
5. **Time travel:** GET `/at/1` shows the task before completion; `/at/2` shows it after completion.
6. **Version:** A unique `(taskId, version)` index prevents two events occupying the same position.

**Educational simplifications:** The queries replay all events for each request, which is fine for small datasets but not scalable. Production systems often use read projections, snapshots, durable message delivery, and more careful event-schema evolution. The in-process EventBus has no durable retry/guaranteed notification delivery: saved task events are the reliable source of truth, not notification delivery.
