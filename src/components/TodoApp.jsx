import useTodos from "../hooks/useTodos.js";
import TodoForm from "./TodoForm.jsx";
import TodoList from "./TodoList.jsx";
import TodoFilter from "./TodoFilter.jsx";
import TodoStats from "./TodoStats.jsx";

export default function TodoApp() {
  const {
    todos,
    visibleTodos,
    remainingCount,
    filter,
    setFilter,
    error,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    clearError,
  } = useTodos();

  return (
    <main className="app">
      <section className="app__card" aria-labelledby="app-title">
        <h1 id="app-title" className="app__title">
          Todo List
        </h1>
        <TodoForm onAdd={addTodo} />
        <TodoFilter
          filter={filter}
          onChange={setFilter}
          counts={{
            all: todos.length,
            active: remainingCount,
            completed: todos.length - remainingCount,
          }}
        />
        <TodoList
          todos={visibleTodos}
          onToggle={toggleTodo}
          onEdit={editTodo}
          onDelete={deleteTodo}
          filter={filter}
        />
        <TodoStats remainingCount={remainingCount} totalCount={todos.length} />
        {error && (
          <p className="app__error" role="alert">
            <button
              type="button"
              className="app__error-close"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              ×
            </button>
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
