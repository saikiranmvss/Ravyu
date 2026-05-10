import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { UserProfile, useGetUserProfile, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string, refresh: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem("accessToken"));
  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(() => {
      return localStorage.getItem("accessToken");
    });
  }, []);

  const { data: user, isLoading, isError } = useGetUserProfile({
    query: {
      queryKey: getGetUserProfileQueryKey(),
      enabled: !!accessToken,
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError]);

  const login = (token: string, refresh: string) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refresh);
    setAccessToken(token);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, logout }}>
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
