export default function TodoStats({ remainingCount, totalCount }) {
  if (totalCount === 0) {
    return null;
  }

  const label = remainingCount === 1 ? "task left" : "tasks left";

  return (
    <p className="todo-stats" aria-live="polite">
      <strong>{remainingCount}</strong> {label} of {totalCount} total
    </p>
  );
}
