import useTodos from "../hooks/useTodos.js";
import useProgress from "../hooks/useProgress.js";
import TodoForm from "./TodoForm.jsx";
import TodoList from "./TodoList.jsx";
import TodoFilter from "./TodoFilter.jsx";
import TodoStats from "./TodoStats.jsx";
import PlayerStatus from "./PlayerStatus.jsx";

export default function TodoApp() {
  const progress = useProgress();
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

  const { profile, levelInfo, rankInfo, registerTaskCompleted } = progress;

  /**
   * Wraps the todo toggle so completing a task (not un-completing
   * it) awards the player XP and counts toward the completed total.
   */
  function handleToggleTodo(id) {
    const todo = todos.find((item) => item.id === id);
    const isCompleting = todo && !todo.completed;
    toggleTodo(id);
    if (isCompleting) {
      registerTaskCompleted();
    }
  }

  return (
    <main className="app">
      <section className="app__card" aria-labelledby="app-title">
        <h1 id="app-title" className="app__title">
          Todo List
        </h1>
        <PlayerStatus
          profile={profile}
          levelInfo={levelInfo}
          rankInfo={rankInfo}
        />
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
          onToggle={handleToggleTodo}
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
