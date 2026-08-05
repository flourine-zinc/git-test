import { useCallback, useEffect, useMemo, useState } from "react";
import { loadTodos, saveTodos, validateTitle } from "../utils/storage.js";
import { getXpForPriority } from "../utils/gameMath.js";

const FILTERS = {
  ALL: "all",
  ACTIVE: "active",
  COMPLETED: "completed",
};

function createTodo(title, priority = "medium", category = "personal") {
  const timestamp = Date.now();
  return {
    id: `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    completed: false,
    priority,
    category,
    xpReward: getXpForPriority(priority),
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  };
}

/** Returns true when the given priority is one of the known values. */
function isKnownPriority(priority) {
  return ["low", "medium", "high", "critical"].includes(priority);
}

/** Returns true when the given category is one of the known values. */
function isKnownCategory(category) {
  return ["coding", "study", "exercise", "personal", "learning"].includes(
    category,
  );
}

/**
 * Owns all todo state and logic: CRUD operations, filtering,
 * gamification fields, and localStorage persistence.
 */
export default function useTodos() {
  const [todos, setTodos] = useState(loadTodos);
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [category, setCategory] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = useCallback(
    (title, priority = "medium", category = "personal") => {
      const validationError = validateTitle(title);
      if (validationError) {
        setError(validationError);
        return false;
      }
      const safePriority = isKnownPriority(priority) ? priority : "medium";
      const safeCategory = isKnownCategory(category) ? category : "personal";
      setTodos((current) => [
        createTodo(title, safePriority, safeCategory),
        ...current,
      ]);
      setError(null);
      return true;
    },
    [],
  );

  const toggleTodo = useCallback((id) => {
    setTodos((current) =>
      current.map((todo) => {
        if (todo.id !== id) {
          return todo;
        }
        const completed = !todo.completed;
        return {
          ...todo,
          completed,
          updatedAt: Date.now(),
          completedAt: completed ? Date.now() : null,
        };
      }),
    );
  }, []);

  const editTodo = useCallback((id, title, priority, category) => {
    const validationError = validateTitle(title);
    if (validationError) {
      setError(validationError);
      return false;
    }
    setTodos((current) =>
      current.map((todo) => {
        if (todo.id !== id) {
          return todo;
        }
        const nextPriority = isKnownPriority(priority)
          ? priority
          : todo.priority;
        const nextCategory = isKnownCategory(category)
          ? category
          : todo.category;
        return {
          ...todo,
          title: title.trim(),
          priority: nextPriority,
          category: nextCategory,
          xpReward: getXpForPriority(nextPriority),
          updatedAt: Date.now(),
        };
      }),
    );
    setError(null);
    return true;
  }, []);

  const editTodoTitleOnly = useCallback((id, title) => {
    const validationError = validateTitle(title);
    if (validationError) {
      setError(validationError);
      return false;
    }
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? { ...todo, title: title.trim(), updatedAt: Date.now() }
          : todo,
      ),
    );
    setError(null);
    return true;
  }, []);

  const deleteTodo = useCallback((id) => {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const visibleTodos = useMemo(() => {
    const categoryFiltered =
      category === "all"
        ? todos
        : todos.filter((todo) => todo.category === category);
    switch (filter) {
      case FILTERS.ACTIVE:
        return categoryFiltered.filter((todo) => !todo.completed);
      case FILTERS.COMPLETED:
        return categoryFiltered.filter((todo) => todo.completed);
      default:
        return categoryFiltered;
    }
  }, [todos, filter, category]);

  const remainingCount = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos],
  );

  return {
    todos,
    visibleTodos,
    remainingCount,
    filter,
    setFilter,
    category,
    setCategory,
    error,
    addTodo,
    toggleTodo,
    editTodo,
    editTodoTitleOnly,
    deleteTodo,
    clearError,
  };
}
