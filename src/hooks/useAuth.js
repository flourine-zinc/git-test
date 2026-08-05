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
        setUser(null);
        setProfile(null);
        setState(AUTH_STATE.UNAUTHENTICATED);
      } else {
        setError(err.message);
        setState(AUTH_STATE.UNAUTHENTICATED);
      }
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

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
