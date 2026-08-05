import { useState } from "react";
import TodoForm from "./TodoForm.jsx";
import { CATEGORIES, PRIORITIES } from "../constants/gameConfig.js";

export default function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);

  function handleEditSubmit(title, priority, category) {
    const success = onEdit(todo.id, title, priority, category);
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
          initialPriority={todo.priority}
          initialCategory={todo.category}
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

  const priority = PRIORITIES[todo.priority] ?? PRIORITIES.medium;
  const categoryLabel = CATEGORIES[todo.category] ?? todo.category;

  return (
    <li
      className={`todo-item${todo.completed ? " todo-item--completed" : ""}`}
      style={{
        "--todo-priority-color": priority.color,
      }}
    >
      <label className="todo-item__label">
        <input
          type="checkbox"
          className="todo-item__checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span className="todo-item__content">
          <span className="todo-item__title">{todo.title}</span>
          <span className="todo-item__meta">
            <span
              className="todo-item__priority"
              style={{ color: priority.color }}
            >
              {priority.label}
            </span>
            <span className="todo-item__category">{categoryLabel}</span>
            <span className="todo-item__xp">+{todo.xpReward ?? 0} XP</span>
          </span>
        </span>
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
