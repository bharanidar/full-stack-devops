import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5002/api/tasks";

const USER = { name: "Bharani", role: "Admin" };

const PRIORITIES = ["Low", "Medium", "High"];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "active", label: "My tasks", icon: "list" },
  { id: "completed", label: "Completed", icon: "done" },
];

const PANEL_TITLES = {
  dashboard: "All tasks",
  active: "Open tasks",
  completed: "Completed tasks",
};

/* ---------- helpers ---------- */

const priorityKey = (priority) => {
  const key = (priority || "medium").toLowerCase();
  return ["low", "medium", "high"].includes(key) ? key : "medium";
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const shortcutLabel =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/i.test(navigator.platform)
    ? "⌘K"
    : "Ctrl K";

/* ---------- icons ---------- */

const ICON_PATHS = {
  home: (
    <path d="M4 10.8 12 4.5l8 6.3V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  ),
  list: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.6" cy="6.5" r=".8" fill="currentColor" />
      <circle cx="4.6" cy="12" r=".8" fill="currentColor" />
      <circle cx="4.6" cy="17.5" r=".8" fill="currentColor" />
    </>
  ),
  done: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </>
  ),
  tasks: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <path d="m8.5 12.3 2.3 2.3 4.7-5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  trash: (
    <path d="M4.5 7h15M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l.8 11.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7M10 11v5M14 11v5" />
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ---------- progress ring ---------- */

const RING_RADIUS = 68;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ProgressRing({ value }) {
  const offset = RING_CIRCUMFERENCE * (1 - value / 100);

  return (
    <div className="ring-wrap">
      <svg
        className="ring"
        viewBox="0 0 176 176"
        role="img"
        aria-label={`${value}% of tasks complete`}
      >
        <circle className="ring-ticks" cx="88" cy="88" r="82" />
        <circle
          className="ring-track"
          cx="88"
          cy="88"
          r={RING_RADIUS}
        />
        <circle
          className={`ring-arc ${value === 0 ? "is-empty" : ""}`}
          cx="88"
          cy="88"
          r={RING_RADIUS}
          transform="rotate(-90 88 88)"
          strokeDasharray={RING_CIRCUMFERENCE}
          style={{ "--c": RING_CIRCUMFERENCE, strokeDashoffset: offset }}
        />
      </svg>

      <div className="ring-value">
        <strong>
          {value}
          <small>%</small>
        </strong>
        <span>complete</span>
      </div>
    </div>
  );
}

/* ---------- app ---------- */

function App() {
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
  });

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API_URL);
      setTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Ctrl/⌘ + K focuses search, Escape closes the dialog
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setShowModal(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const addTask = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) return;

    try {
      await axios.post(API_URL, {
        title: form.title,
        description: form.description,
        priority: form.priority,
      });

      setForm({
        title: "",
        description: "",
        priority: "Medium",
      });

      setShowModal(false);
      fetchTasks();
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const toggleTask = async (task) => {
    try {
      await axios.put(`${API_URL}/${task.id}`, {
        completed: !task.completed,
      });

      fetchTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    const active = tasks.length - completed;
    const open = { high: 0, medium: 0, low: 0 };

    tasks.forEach((task) => {
      if (!task.completed) open[priorityKey(task.priority)] += 1;
    });

    return {
      total: tasks.length,
      active,
      completed,
      high: open.high,
      open,
      progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query);

      if (activeView === "active") {
        return matchesSearch && !task.completed;
      }

      if (activeView === "completed") {
        return matchesSearch && task.completed;
      }

      return matchesSearch;
    });
  }, [tasks, search, activeView]);

  const currentView = NAV_ITEMS.find((item) => item.id === activeView);

  const heroLine = loading
    ? "Loading your tasks…"
    : tasks.length === 0
    ? "Nothing on your plate yet."
    : stats.active === 0
    ? "Every task is done."
    : `${plural(stats.active, "task")} left${
        stats.high ? `, ${stats.high} high priority` : ""
      }.`;

  const emptyState = (() => {
    if (search.trim()) {
      return {
        title: "No matching tasks",
        body: `Nothing matches “${search.trim()}”. Try a different word.`,
        action: false,
      };
    }
    if (activeView === "completed") {
      return {
        title: "Nothing completed yet",
        body: "Tasks you finish will show up here.",
        action: false,
      };
    }
    if (tasks.length > 0) {
      return {
        title: "You're all caught up",
        body: "There are no open tasks right now.",
        action: true,
      };
    }
    return {
      title: "No tasks yet",
      body: "Add your first task to start tracking your work.",
      action: true,
    };
  })();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 12.8 4.6 4.4L19 7" />
            </svg>
          </div>
          <div>
            <div className="brand-name">TaskFlow</div>
            <div className="brand-subtitle">Workspace</div>
          </div>
        </div>

        <nav className="nav-section" aria-label="Views">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => setActiveView(item.id)}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.id === "active" && stats.active > 0 && (
                <span className="nav-count">{stats.active}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button type="button" className="nav-item">
            <Icon name="settings" />
            Settings
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="sep">/</span>
            <strong>{currentView?.label}</strong>
          </div>

          <div className="top-actions">
            <label className="search-box">
              <Icon name="search" size={18} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks"
                aria-label="Search tasks"
              />
              <kbd>{shortcutLabel}</kbd>
            </label>

            <button
              type="button"
              className="icon-button"
              aria-label="Notifications"
            >
              <Icon name="bell" size={19} />
            </button>

            <div className="profile">
              <div className="avatar">{USER.name.charAt(0)}</div>
              <div className="profile-info">
                <strong>{USER.name}</strong>
                <span>{USER.role}</span>
              </div>
              <span className="chevron">
                <Icon name="chevron" size={16} />
              </span>
            </div>
          </div>
        </header>

        <section className="content">
          <div className="hero">
            <div>
              <h1>
                {getGreeting()}, {USER.name}
              </h1>
              <p className="hero-description">{heroLine}</p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => setShowModal(true)}
            >
              <Icon name="plus" size={18} />
              New task
            </button>
          </div>

          <div className="summary">
            <div className="summary-item">
              <span className="summary-label">Total tasks</span>
              <strong className="summary-value">{stats.total}</strong>
            </div>

            <div className="summary-item">
              <span className="summary-label">Active</span>
              <strong className="summary-value">{stats.active}</strong>
            </div>

            <div className="summary-item">
              <span className="summary-label">Completed</span>
              <strong className="summary-value">{stats.completed}</strong>
            </div>

            <div
              className={`summary-item ${stats.high > 0 ? "attention" : ""}`}
            >
              <span className="summary-label">High priority</span>
              <strong className="summary-value">{stats.high}</strong>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="tasks-panel">
              <div className="panel-header">
                <h2>{PANEL_TITLES[activeView]}</h2>
                <p>{plural(filteredTasks.length, "task")}</p>
              </div>

              {loading ? (
                <div className="empty-state">
                  <div className="loader" role="status" />
                  <p>Loading tasks…</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon name="tasks" size={24} />
                  </div>
                  <h3>{emptyState.title}</h3>
                  <p>{emptyState.body}</p>
                  {emptyState.action && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setShowModal(true)}
                    >
                      <Icon name="plus" size={18} />
                      New task
                    </button>
                  )}
                </div>
              ) : (
                <ul className="task-list">
                  {filteredTasks.map((task) => {
                    const key = priorityKey(task.priority);

                    return (
                      <li
                        className={`task-row ${
                          task.completed ? "completed-task" : ""
                        }`}
                        key={task.id}
                      >
                        <button
                          type="button"
                          className={`check-button ${
                            task.completed ? "checked" : ""
                          }`}
                          onClick={() => toggleTask(task)}
                          aria-label={
                            task.completed
                              ? `Mark “${task.title}” as not done`
                              : `Mark “${task.title}” as done`
                          }
                        >
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="m3.8 8.4 2.9 2.9 5.5-6" pathLength="1" />
                          </svg>
                        </button>

                        <div className="task-main">
                          <h3>{task.title}</h3>
                          {task.description && <p>{task.description}</p>}
                        </div>

                        <span className={`priority ${key}`}>
                          {capitalize(key)}
                        </span>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => deleteTask(task.id)}
                          aria-label={`Delete “${task.title}”`}
                          title="Delete task"
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <aside className="progress-panel">
              <div className="rail-header">
                <h2>Progress</h2>
                <p>
                  {stats.completed} of {plural(stats.total, "task")} done
                </p>
              </div>

              <div className="rail-body">
                <ProgressRing value={stats.progress} />

                <div className="rail-stats">
                  <div className="progress-details">
                    <div>
                      <span className="dot done" />
                      Completed
                      <strong>{stats.completed}</strong>
                    </div>
                    <div>
                      <span className="dot remaining" />
                      Remaining
                      <strong>{stats.active}</strong>
                    </div>
                  </div>

                  <div className="priority-breakdown">
                    <h3>Open by priority</h3>
                    {["high", "medium", "low"].map((key) => (
                      <div className={`breakdown-row ${key}`} key={key}>
                        <span>{capitalize(key)}</span>
                        <div className="breakdown-bar">
                          <i
                            style={{
                              width: `${
                                stats.active
                                  ? (stats.open[key] / stats.active) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <b>{stats.open[key]}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-task-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="new-task-title">New task</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={addTask}>
              <div className="field">
                <label htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  autoFocus
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="What needs to be done?"
                />
              </div>

              <div className="field">
                <label htmlFor="task-description">
                  Description <span className="optional">Optional</span>
                </label>
                <textarea
                  id="task-description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Add some details"
                  rows="4"
                />
              </div>

              <div className="field">
                <span className="field-label" id="priority-label">
                  Priority
                </span>
                <div
                  className="priority-options"
                  role="radiogroup"
                  aria-labelledby="priority-label"
                >
                  {PRIORITIES.map((priority) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={form.priority === priority}
                      key={priority}
                      className={`priority-option ${priority.toLowerCase()} ${
                        form.priority === priority ? "selected" : ""
                      }`}
                      onClick={() => setForm({ ...form, priority })}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={!form.title.trim()}
                >
                  Create task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;