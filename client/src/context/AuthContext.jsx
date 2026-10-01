import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function restoreSession() {
      const savedToken = authService.getToken();
      if (!savedToken) {
        if (isCurrent) setLoading(false);
        return;
      }

      try {
        const session = await authService.getCurrentUser();
        if (isCurrent) {
          setUser(session.user);
          setToken(savedToken);
        }
      } catch {
        authService.clearToken();
        if (isCurrent) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    void restoreSession();
    return () => {
      isCurrent = false;
    };
  }, []);

  async function authenticate(action, details) {
    const session = await action(details);
    authService.storeToken(session.token);
    setToken(session.token);
    setUser(session.user);
    return session.user;
  }

  function login(credentials) {
    return authenticate(authService.login, credentials);
  }

  function signup(details) {
    return authenticate(authService.register, details);
  }

  function logout() {
    authService.clearToken();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}