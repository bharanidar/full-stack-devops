import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5001/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");

  const loadTasks = async () => {
    const response = await axios.get(API);
    setTasks(response.data);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    await axios.post(API, {
      title,
      description,
      priority,
    });

    setTitle("");
    setDescription("");
    setPriority("Medium");

    loadTasks();
  };

  const toggleTask = async (task) => {
    await axios.put(`${API}/${task.id}`, {
      ...task,
      completed: !task.completed,
    });

    loadTasks();
  };

  const deleteTask = async (id) => {
    await axios.delete(`${API}/${id}`);
    loadTasks();
  };

  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;

  return (
    <div className="app">
      <header>
        <div>
          <h1>TaskFlow</h1>
          <p>Simple task management dashboard</p>
        </div>
      </header>

      <section className="stats">
        <div className="stat">
          <span>Total Tasks</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="stat">
          <span>Pending</span>
          <strong>{pending}</strong>
        </div>

        <div className="stat">
          <span>Completed</span>
          <strong>{completed}</strong>
        </div>
      </section>

      <main>
        <section className="card">
          <h2>Create Task</h2>

          <form onSubmit={addTask}>
            <input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <button type="submit">Add Task</button>
          </form>
        </section>

        <section className="card">
          <div className="task-header">
            <h2>Your Tasks</h2>
            <span>{tasks.length} tasks</span>
          </div>

          {tasks.length === 0 ? (
            <div className="empty">
              <h3>No tasks yet</h3>
              <p>Create your first task to get started.</p>
            </div>
          ) : (
            <div className="tasks">
              {tasks.map((task) => (
                <div className="task" key={task.id}>
                  <div className="task-info">
                    <h3 className={task.completed ? "done" : ""}>
                      {task.title}
                    </h3>

                    <p>{task.description}</p>

                    <span className={`priority ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="actions">
                    <button onClick={() => toggleTask(task)}>
                      {task.completed ? "Undo" : "Complete"}
                    </button>

                    <button
                      className="delete"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;