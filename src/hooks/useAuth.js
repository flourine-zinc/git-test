import { useCallback, useEffect, useState } from "react";
import api from "../api/client.js";

const AUTH_STATE = {
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
};

/**
 * useAuth — session-aware auth state.
 * - On mount: call GET /auth/me to restore the session (httpOnly cookie).
 * - Exposes user + profile once authenticated, plus login/logout helpers.
 */
export function useAuth() {
  const [state, setState] = useState(AUTH_STATE.LOADING);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const checkSession = useCallback(async () => {
    setState(AUTH_STATE.LOADING);
    setError(null);
    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
      setState(AUTH_STATE.AUTHENTICATED);
    } catch (err) {
      if (err.status === 401) {
        // Definitive: the server rejected the session cookie.
        setUser(null);
        setProfile(null);
        setState(AUTH_STATE.UNAUTHENTICATED);
      } else {
        // Network/CORS/5xx errors are NOT proof of being logged out — the
        // server might be redeploying or briefly unreachable. Stay in LOADING
        // and retry shortly instead of bouncing to the Login screen.
        setError(err.message || "Could not reach the server. Retrying…");
        setState(AUTH_STATE.LOADING);
      }
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Retry the session check when the server was unreachable (network/CORS/5xx),
  // so a transient deploy or blip doesn't leave users stuck on Loading.
  useEffect(() => {
    if (state !== AUTH_STATE.LOADING) return;
    const timer = setTimeout(() => {
      checkSession();
    }, 3000);
    return () => clearTimeout(timer);
  }, [state, checkSession]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Even if the server call fails, clear client state.
    }
    setUser(null);
    setProfile(null);
    setState(AUTH_STATE.UNAUTHENTICATED);
  }, []);

  return {
    state,
    user,
    profile,
    error,
    loginUrl: api.loginUrl(),
    logout,
    checkSession,
  };
}

export default useAuth;
