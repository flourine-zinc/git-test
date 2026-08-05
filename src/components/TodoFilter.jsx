const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export default function TodoFilter({ filter, onChange, counts }) {
  return (
    <div className="todo-filter" role="group" aria-label="Filter tasks">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`todo-filter__button${
            filter === option.value ? " todo-filter__button--active" : ""
          }`}
          aria-pressed={filter === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          <span className="todo-filter__count">{counts[option.value]}</span>
        </button>
      ))}
    </div>
  );
}
