import { useCallback, useEffect, useMemo, useState } from "react";
import { loadTodos, saveTodos, validateTitle } from "../utils/storage.js";

const FILTERS = {
  ALL: "all",
  ACTIVE: "active",
  COMPLETED: "completed",
};

function createTodo(title) {
  const timestamp = Date.now();
  return {
    id: `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Owns all todo state and logic: CRUD operations, filtering,
 * and localStorage persistence.
 */
export default function useTodos() {
  const [todos, setTodos] = useState(loadTodos);
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [error, setError] = useState(null);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = useCallback((title) => {
    const validationError = validateTitle(title);
    if (validationError) {
      setError(validationError);
      return false;
    }
    setTodos((current) => [createTodo(title), ...current]);
    setError(null);
    return true;
  }, []);

  const toggleTodo = useCallback((id) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? { ...todo, completed: !todo.completed, updatedAt: Date.now() }
          : todo,
      ),
    );
  }, []);

  const editTodo = useCallback((id, title) => {
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
    switch (filter) {
      case FILTERS.ACTIVE:
        return todos.filter((todo) => !todo.completed);
      case FILTERS.COMPLETED:
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

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
    error,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    clearError,
  };
}
