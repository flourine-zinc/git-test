import { useState } from "react";
import { validateTitle } from "../utils/storage.js";

/**
 * Handles creating a new task (and is reused for inline editing
 * by TodoItem with a different submit handler).
 */
export default function TodoForm({
  onAdd,
  initialValue = "",
  submitLabel = "Add",
  onSubmitSuccess,
}) {
  const [title, setTitle] = useState(initialValue);
  const [error, setError] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateTitle(title);
    if (validationError) {
      setError(validationError);
      return;
    }

    const success = onAdd(title);
    if (success) {
      setTitle("");
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
      {error && (
        <p className="todo-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
