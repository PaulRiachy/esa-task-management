import React from "react";
import { useCallback, useEffect, useState } from "react";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

export default function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [oldState, setOldState] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setTasks(await request("/api/tasks"));
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectTask = useCallback(async (id) => {
    setSelectedId(id);
    setOldState(null);
    try {
      setHistory(await request(`/api/tasks/${id}/history`));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  async function createTask(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const task = await request("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });
      setTitle("");
      setDescription("");
      await refresh();
      await selectTask(task.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function completeTask(id) {
    setError("");
    try {
      await request(`/api/tasks/${id}/complete`, { method: "PUT" });
      await refresh();
      await selectTask(id);
    } catch (e) {
      setError(e.message);
    }
  }

  async function showVersion(version) {
    setError("");
    try {
      setOldState(await request(`/api/tasks/${selectedId}/at/${version}`));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main>
      <header>
        <div className="eyebrow">MERN · EVENT SOURCING</div>
        <h1>Task Manager</h1>
        <p>
          Tasks are reconstructed from an append-only event history stored in
          MongoDB. Create a task, complete it, and inspect earlier versions.
        </p>
      </header>
      <section className="panel">
        <h2>Create a task</h2>
        <form onSubmit={createTask}>
          <input
            aria-label="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <input
            aria-label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
          <button disabled={busy}>Create</button>
        </form>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <div className="columns">
        <section className="panel">
          <h2>
            Current tasks <span className="count">{tasks.length}</span>
          </h2>
          <p className="muted">
            Read by replaying saved events, not a Task collection.
          </p>
          {!tasks.length && <p className="muted">No tasks yet.</p>}
          {tasks.map((task) => (
            <div key={task.id} className="item">
              <div>
                <strong>{task.title}</strong>
                <p className="muted">{task.description || "No description"}</p>
                <span className={task.isCompleted ? "done" : "pending"}>
                  {task.isCompleted ? "Completed" : "Pending"} · v{task.version}
                </span>
                <button className="textBtn" onClick={() => selectTask(task.id)}>
                  View history
                </button>
              </div>
              {!task.isCompleted && (
                <button className="small" onClick={() => completeTask(task.id)}>
                  Complete
                </button>
              )}
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Event history</h2>
          {!selectedId && (
            <p className="muted">Select a task to see its event stream.</p>
          )}
          {selectedId && (
            <>
              <p className="muted codeText">Task ID: {selectedId}</p>
              {history.map((event) => (
                <div key={event.version} className="event">
                  <span className="tag">v{event.version}</span>
                  <strong>{event.type}</strong>
                  <span className="muted">
                    {new Date(event.occurredAt).toLocaleString()}
                  </span>
                  <button
                    className="textBtn"
                    onClick={() => showVersion(event.version)}
                  >
                    Show state at v{event.version}
                  </button>
                </div>
              ))}
              {oldState && (
                <div className="stateBox">
                  <strong>Reconstructed at version {oldState.version}</strong>
                  <p>Title: {oldState.title}</p>
                  <p>
                    Status: {oldState.isCompleted ? "Completed" : "Pending"}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <footer>
        Saved events are permanent records in this learning project.
        Notifications print in the backend terminal.
      </footer>
    </main>
  );
}
