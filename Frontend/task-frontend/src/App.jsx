import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

function App() {
  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [formMessage, setFormMessage] = useState({ text: "", type: "" });
  const [listMessage, setListMessage] = useState({ text: "", type: "" });

  const showFormMessage = (text, type = "error") => {
    setFormMessage({ text, type });
    if (text) {
      setTimeout(() => setFormMessage({ text: "", type: "" }), 3000);
    }
  };

  const showListMessage = (text, type = "error") => {
    setListMessage({ text, type });
    if (text) {
      setTimeout(() => setListMessage({ text: "", type: "" }), 3000);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("pending");
    setEditingTaskId(null);
  };

  const getStatusClass = (st) => {
    if (st === "in-progress") return "status-in-progress";
    if (st === "completed") return "status-completed";
    return "status-pending";
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  };

  const escapeHtml = (text) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/api/tasks`;
      if (filterStatus !== "all") {
        url += `?status=${encodeURIComponent(filterStatus)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
      showListMessage(err.message || "Error loading tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const createTask = async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create task");
      }
      await fetchTasks();
      resetForm();
      showFormMessage("Task created ✔", "success");
    } catch (err) {
      console.error(err);
      showFormMessage(err.message || "Error creating task");
    }
  };

  const updateTask = async (id, payload, silent = false) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update task");
      }
      await fetchTasks();
      if (!silent) {
        resetForm();
        showFormMessage("Task updated ✔", "success");
      }
    } catch (err) {
      console.error(err);
      if (!silent) showFormMessage(err.message || "Error updating task");
      else showListMessage(err.message || "Error updating status");
    }
  };

  const deleteTask = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete task");
      }
      await fetchTasks();
      showListMessage("Task deleted ✔", "success");
    } catch (err) {
      console.error(err);
      showListMessage(err.message || "Error deleting task");
    }
  };

  const startEditTask = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`);
      if (!res.ok) throw new Error("Failed to load task");
      const task = await res.json();
      setEditingTaskId(task.id);
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "pending");
    } catch (err) {
      console.error(err);
      showFormMessage(err.message || "Error loading task for edit");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      return showFormMessage("Title is required");
    }

    const payload = {
      title: trimmedTitle,
      description: trimmedDescription,
      status,
    };

    if (editingTaskId != null) {
      updateTask(editingTaskId, payload);
    } else {
      createTask(payload);
    }
  };

  const handleInlineStatusChange = (id, newStatus) => {
    updateTask(id, { status: newStatus }, true);
  };

  return (
    <div className="app">
      <h1>Task Manager</h1>
      <p></p>
      <div className="layout">
        {/* Left: Form */}
        <section className="card">
          <h2>
            {editingTaskId ? `Edit Task (ID ${editingTaskId})` : "Create Task"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Finish assignment"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details about this task..."
              />
            </div>

            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="buttons">
              <button type="submit" className="btn btn-primary">
                {editingTaskId ? "Update Task" : "Save Task"}
              </button>
              {editingTaskId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {formMessage.text && (
              <div
                className={`message ${
                  formMessage.type === "success"
                    ? "message-success"
                    : "message-error"
                }`}
              >
                {formMessage.text}
              </div>
            )}
          </form>
        </section>

        {/* Right: List */}
        <section className="card">
          <div className="filters">
            <div className="field">
              <label htmlFor="filter-status">Filter by Status</label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button
              className="btn btn-secondary btn-small"
              type="button"
              onClick={fetchTasks}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="task-list">
            {loading ? (
              <div className="empty-state">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                No tasks found. Create your first one on the left ✨
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <div className="task-title">{escapeHtml(task.title)}</div>
                    <span
                      className={`status-pill ${getStatusClass(task.status)}`}
                    >
                      {task.status.replace("-", " ")}
                    </span>
                  </div>

                  {task.description && (
                    <div className="task-desc">
                      {escapeHtml(task.description)}
                    </div>
                  )}

                  <div className="task-meta">
                    <span className="chip">ID: {task.id}</span>
                    <span>Created: {formatDate(task.createdAt)}</span>
                  </div>

                  <div className="task-actions">
                    <div className="task-actions-left">
                      <select
                        className="status-select-inline"
                        value={task.status}
                        onChange={(e) =>
                          handleInlineStatusChange(task.id, e.target.value)
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="task-actions-right">
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => startEditTask(task.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() =>
                          window.confirm("Delete this task?") &&
                          deleteTask(task.id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {listMessage.text && (
            <div
              className={`message ${
                listMessage.type === "success"
                  ? "message-success"
                  : "message-error"
              }`}
            >
              {listMessage.text}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
