/**
 * Auth Context for Warung Meng
 *
 * AI AGENT NOTES:
 * - Simple authentication for admin access
 * - Uses localStorage to persist login state
 * - DEMO ONLY: Hardcoded credentials (username: admin, password: admin123)
 *
 * Context API:
 * - isAuthenticated: boolean - Is admin logged in?
 * - login(username: string, password: string) - Attempt login
 * - logout() - Log out admin
 *
 * Usage:
 * const { isAuthenticated, login, logout } = useAuth();
 *
 * Security Notes:
 * - This is NOT production-ready authentication
 * - Credentials are hardcoded for demo purposes
 * - In production, replace with:
 *   * JWT tokens from backend API
 *   * Proper password hashing
 *   * Session management
 *   * HTTPS only
 *
 * When modifying:
 * - For production: Remove hardcoded credentials
 * - Add API integration for real auth
 * - Implement token refresh logic
 * - Add role-based permissions if needed
 */

import React, { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// DEMO CREDENTIALS - Replace with real auth in production
const DEMO_ADMIN = {
  username: "admin",
  password: "admin123",
};

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>("meng_admin_auth", false);

  // Login function - validates credentials and sets auth state
  const login = (username: string, password: string): boolean => {
    // DEMO: Simple credential check
    // In production, this should call an API endpoint
    if (username === DEMO_ADMIN.username && password === DEMO_ADMIN.password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  // Logout function - clears auth state
  const logout = () => {
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
