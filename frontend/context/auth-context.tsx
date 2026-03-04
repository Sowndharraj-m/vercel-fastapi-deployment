"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import type { UserResponse, TokenResponse } from "@/lib/types";

interface AuthState {
    user: UserResponse | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    registerAdmin: (email: string, password: string, role?: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        try {
            const { data } = await api.get<UserResponse>("/api/v1/auth/me");
            setUser(data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            fetchMe();
        } else {
            setLoading(false);
        }
    }, [fetchMe]);

    const login = async (email: string, password: string) => {
        const { data } = await api.post<TokenResponse>("/api/v1/auth/login", {
            email,
            password,
        });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        await fetchMe();
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
        window.location.href = "/login";
    };

    const registerAdmin = async (email: string, password: string, role = "ADMIN") => {
        await api.post("/api/v1/auth/register-admin", { email, password, role });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, registerAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
