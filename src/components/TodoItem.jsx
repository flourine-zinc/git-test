import { useState } from "react";
import TodoForm from "./TodoForm.jsx";

export default function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);

  function handleEditSubmit(title) {
    const success = onEdit(todo.id, title);
    if (success) {
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <li className="todo-item todo-item--editing">
        <TodoForm
          onAdd={handleEditSubmit}
          initialValue={todo.title}
          submitLabel="Save"
        />
        <button
          type="button"
          className="todo-item__cancel"
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className={`todo-item${todo.completed ? " todo-item--completed" : ""}`}>
      <label className="todo-item__label">
        <input
          type="checkbox"
          className="todo-item__checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span className="todo-item__title">{todo.title}</span>
      </label>
      <div className="todo-item__actions">
        <button
          type="button"
          className="todo-item__button"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className="todo-item__button todo-item__button--danger"
          onClick={() => onDelete(todo.id)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
