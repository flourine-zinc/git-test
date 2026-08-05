# Todo List App

A clean, maintainable, and user-friendly task management application built with React and Vite.

## Features

- Create new tasks
- Display a list of tasks
- Mark tasks as completed
- Edit existing tasks
- Delete tasks
- Filter tasks (All, Active, Completed)
- Persist tasks using browser localStorage

## Getting Started

### Prerequisites

- Node.js (18+ recommended)
- npm

### Install

```sh
npm install
```

### Run in development

```sh
npm run dev
```

Open the local URL printed in the terminal (usually `http://localhost:5173`).

### Build for production

```sh
npm run build
```

### Preview the production build

```sh
npm run preview
```

## Project Structure

```
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx          # React entry point
    ├── App.jsx           # Root component
    ├── styles/
    │   └── styles.css    # Global styles and design tokens
    ├── hooks/
    │   └── useTodos.js   # Todo state logic (CRUD, filter, persistence)
    ├── components/
    │   ├── TodoApp.jsx   # Layout/composition
    │   ├── TodoForm.jsx  # Create/edit input
    │   ├── TodoList.jsx  # List rendering
    │   ├── TodoItem.jsx  # Single item row
    │   ├── TodoFilter.jsx# All / Active / Completed tabs
    │   └── TodoStats.jsx # Remaining count
    └── utils/
        └── storage.js    # localStorage helpers with validation
```

## Tech Stack

- React 18
- Vite 5
- Plain CSS
- localStorage for persistence
