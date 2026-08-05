import { useState } from "react";
import { validateTitle } from "../utils/storage.js";
import { CATEGORIES, PRIORITIES } from "../constants/gameConfig.js";
import { PRIORITY_XP } from "../utils/gameMath.js";

/**
 * Handles creating a new task. In edit mode (reused by TodoItem)
 * initialPriority / initialCategory seed the selectors and the
 * submit handler receives (title, priority, category).
 */
export default function TodoForm({
  onAdd,
  initialValue = "",
  initialPriority = "medium",
  initialCategory = "personal",
  submitLabel = "Add",
  onSubmitSuccess,
  showDetails = true,
}) {
  const [title, setTitle] = useState(initialValue);
  const [priority, setPriority] = useState(initialPriority);
  const [category, setCategory] = useState(initialCategory);
  const [error, setError] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateTitle(title);
    if (validationError) {
      setError(validationError);
      return;
    }

    const success = onAdd(title, priority, category);
    if (success) {
      setTitle("");
      setPriority("medium");
      setCategory("personal");
      setError(null);
      onSubmitSuccess?.();
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate>
      <div className="todo-form__row">
        <input
          type="text"
          className="todo-form__input"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (error) setError(null);
          }}
          placeholder="What needs to be done?"
          aria-label="Task title"
          aria-invalid={error ? "true" : "false"}
        />
        <button type="submit" className="todo-form__submit">
          {submitLabel}
        </button>
      </div>

      {showDetails && (
        <div className="todo-form__details">
          <div className="todo-form__field">
            <label className="todo-form__label" htmlFor="todo-priority">
              Priority
            </label>
            <select
              id="todo-priority"
              className="todo-form__select"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              aria-label="Task priority"
            >
              {Object.entries(PRIORITIES).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label} (+{PRIORITY_XP[value]} XP)
                </option>
              ))}
            </select>
          </div>
          <div className="todo-form__field">
            <label className="todo-form__label" htmlFor="todo-category">
              Category
            </label>
            <select
              id="todo-category"
              className="todo-form__select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Task category"
            >
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <p className="todo-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
