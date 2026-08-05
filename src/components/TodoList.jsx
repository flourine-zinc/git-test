import TodoItem from "./TodoItem.jsx";

const EMPTY_MESSAGES = {
  all: "No tasks yet. Add one above!",
  active: "No active tasks. 🎉",
  completed: "No completed tasks yet.",
};

export default function TodoList({
  todos,
  onToggle,
  onEdit,
  onDelete,
  filter,
}) {
  if (todos.length === 0) {
    return (
      <p className="todo-list__empty">
        {EMPTY_MESSAGES[filter] ?? EMPTY_MESSAGES.all}
      </p>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
