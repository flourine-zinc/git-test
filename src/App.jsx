import TodoApp from "./components/TodoApp.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import { useAuth } from "./hooks/useAuth.js";

function LoadingScreen() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-icon">⚔️</div>
        <h1 className="login-title">Quest Log</h1>
        <p className="login-subtitle">Loading your adventure…</p>
      </div>
    </div>
  );
}

export default function App() {
  const { state, loginUrl } = useAuth();

  if (state === "loading") return <LoadingScreen />;

  if (state === "unauthenticated") {
    return <LoginScreen loginUrl={loginUrl} />;
  }

  // Authenticated — existing RPG app is preserved unchanged.
  // The todo/XP systems still run on localStorage; server sync is Phase 1.
  return <TodoApp />;
}
