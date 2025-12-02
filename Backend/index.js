const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

console.log("index.js file loaded ");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new Database("tasks.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

const allowedStatuses = ["pending", "in-progress", "completed"];

function isValidStatus(status) {
  return allowedStatuses.includes(status);
}
// To create a task
app.post("/api/tasks", (req, res) => {
  const { title, description = "", status = "pending" } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!isValidStatus(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const createdAt = new Date().toISOString();

  const insert = db.prepare(
    "INSERT INTO tasks (title, description, status, createdAt) VALUES (?, ?, ?, ?)"
  );
  const info = insert.run(title, description, status, createdAt);

  const select = db.prepare("SELECT * FROM tasks WHERE id = ?");
  const newTask = select.get(info.lastInsertRowid);

  res.status(201).json(newTask);
});

// To read all tasks (with optional status filter)

app.get("/api/tasks", (req, res) => {
  const { status } = req.query;

  if (status) {
    if (!isValidStatus(status)) {
      return res.status(400).json({ error: "Invalid status filter" });
    }
    const stmt = db.prepare("SELECT * FROM tasks WHERE status = ?");
    const tasks = stmt.all(status);
    return res.json(tasks);
  }

  const stmt = db.prepare("SELECT * FROM tasks");
  const tasks = stmt.all();
  res.json(tasks);
});

//To read a single task
app.get("/api/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const stmt = db.prepare("SELECT * FROM tasks WHERE id = ?");
  const task = stmt.get(id);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json(task);
});

//To update a task
app.put("/api/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, description, status } = req.body;

  const select = db.prepare("SELECT * FROM tasks WHERE id = ?");
  const existing = select.get(id);

  if (!existing) {
    return res.status(404).json({ error: "Task not found" });
  }

  let newTitle = existing.title;
  let newDescription = existing.description;
  let newStatus = existing.status;

  if (title !== undefined) newTitle = title;
  if (description !== undefined) newDescription = description;
  if (status !== undefined) {
    if (!isValidStatus(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    newStatus = status;
  }

  const update = db.prepare(
    "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?"
  );
  update.run(newTitle, newDescription, newStatus, id);

  const updated = select.get(id);
  res.json(updated);
});

//To delete a task
app.delete("/api/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);

  const del = db.prepare("DELETE FROM tasks WHERE id = ?");
  const info = del.run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json({ message: "Task deleted" });
});

app.get("/", (req, res) => {
  res.send("Task Management API with SQLite is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
