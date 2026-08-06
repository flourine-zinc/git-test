import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/client.js";

const AUTH_STATE = {
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
};

// TEMPORARY auth diagnostics — remove after production debugging is done.
function debugAuth(...args) {
  console.debug("[useAuth]", ...args);
}

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

  // Monotonic sequence so a stale in-flight /auth/me response can never
  // overwrite the result of a newer check. Without this, a slow first
  // request that fails 401 AFTER a retry already succeeded would flip the
  // app back to Login even though a newer check proved authentication.
  const checkSequence = useRef(0);

  const checkSession = useCallback(async () => {
    const seq = ++checkSequence.current;
    setState(AUTH_STATE.LOADING);
    setError(null);
    debugAuth(`checkSession #${seq} START`);
    try {
      const data = await api.getMe();
      if (seq !== checkSequence.current) {
        debugAuth(
          `checkSession #${seq} IGNORED (superseded by #${checkSequence.current})`,
        );
        return;
      }
      debugAuth(
        `checkSession #${seq} SUCCESS user=`,
        data.user?.id,
        "profile=",
        data.profile?.id,
      );
      setUser(data.user);
      setProfile(data.profile);
      setState(AUTH_STATE.AUTHENTICATED);
    } catch (err) {
      if (seq !== checkSequence.current) {
        debugAuth(
          `checkSession #${seq} IGNORED failure (superseded by #${checkSequence.current})`,
        );
        return;
      }
      if (err.status === 401) {
        // Definitive: the server rejected the session cookie.
        debugAuth(`checkSession #${seq} FAILED 401 → UNAUTHENTICATED`);
        setUser(null);
        setProfile(null);
        setState(AUTH_STATE.UNAUTHENTICATED);
      } else {
        // Network/CORS/5xx errors are NOT proof of being logged out — the
        // server might be redeploying or briefly unreachable. Stay in LOADING
        // and retry shortly instead of bouncing to the Login screen.
        debugAuth(
          `checkSession #${seq} FAILED`,
          err.status || "",
          err.message,
          "→ stay LOADING, retry",
        );
        setError(err.message || "Could not reach the server. Retrying…");
        setState(AUTH_STATE.LOADING);
      }
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // TEMPORARY diagnostics — log every auth-state transition.
  useEffect(() => {
    debugAuth("state →", state, error ? `(error: ${error})` : "");
  }, [state, error]);

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
