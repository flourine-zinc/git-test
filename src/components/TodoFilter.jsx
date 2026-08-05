import { CATEGORIES } from "../constants/gameConfig.js";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  ...Object.entries(CATEGORIES).map(([value, label]) => ({
    value,
    label,
  })),
];

export default function TodoFilter({
  filter,
  onChange,
  counts,
  category,
  onCategoryChange,
}) {
  return (
    <div className="todo-filter" role="group" aria-label="Filter tasks">
      <div className="todo-filter__row">
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
      <div className="todo-filter__row">
        <label className="todo-filter__label" htmlFor="category-filter">
          Category
        </label>
        <select
          id="category-filter"
          className="todo-filter__select"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          aria-label="Filter by category"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
