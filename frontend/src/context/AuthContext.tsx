import { createContext, useContext, useState, type ReactNode } from "react";
import apiClient from "../api/client";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("quill_token")
  );
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("quill_user");
    return stored ? JSON.parse(stored) : null;
  });

  function saveSession(newToken: string, newUser: User) {
    localStorage.setItem("quill_token", newToken);
    localStorage.setItem("quill_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    const response = await apiClient.post("/auth/login", { email, password });
    saveSession(response.data.token, response.data.user);
  }

  async function signup(email: string, password: string) {
    const response = await apiClient.post("/auth/signup", { email, password });
    saveSession(response.data.token, response.data.user);
  }

  function logout() {
    localStorage.removeItem("quill_token");
    localStorage.removeItem("quill_user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}