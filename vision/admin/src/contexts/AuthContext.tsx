import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../services/api/apiClient";
import type { User } from "../services/api/types";

export type SessionMe = {
  tenantId: string | null;
  displayName: string | null;
  role: string | null;
  count: number;
};

interface AuthContextType {
  user: User | null;
  session: SessionMe | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionMe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await fetch("/session/me", { credentials: "include" });
        if (response.status !== 404 && response.ok) {
          const me = (await response.json()) as SessionMe;
          if (!me.tenantId) {
            const returnTo = encodeURIComponent(window.location.href);
            window.location.assign(`/session?return=${returnTo}`);
            return;
          }
          setSession(me);
          if (me.role === "tenant-admin") {
            setUser({
              id: me.tenantId,
              name: me.displayName || me.tenantId,
              email: me.displayName || me.tenantId,
              role: "admin",
            });
          } else {
            setUser(null);
          }
          setIsLoading(false);
          return;
        }

        const result = await apiClient.getCurrentUser();
        setUser(result.isOk() ? result.value.user : null);
      } catch (error) {
        console.error("Failed to get current user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
