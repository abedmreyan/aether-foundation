/**
 * Auth Context
 * Manages user authentication and company state
 * 
 * @ai-context This context handles:
 * - User login/logout/registration
 * - Current user state
 * - Current company state
 * - Multi-tenant authentication via platformDb
 * - Legacy authentication fallback via db
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User, Company } from '../types';
import { platformDb } from '../services/platformDatabase';
import { db } from '../services/database';
import { AppState } from '../types';

// ===== TYPES =====

export interface AuthContextType {
    /** Currently authenticated user, null if not logged in */
    user: User | null;
    /** Current company for multi-tenant access */
    company: Company | null;
    /** Whether authentication is in progress */
    isLoading: boolean;
    /** Last authentication error message */
    error: string | null;
    /** 
     * Authenticate user with email and password
     * @returns true if successful, false otherwise
     */
    login: (email: string, password: string) => Promise<boolean>;
    /** 
     * Register new user (legacy system)
     * @returns true if successful, false otherwise
     */
    register: (name: string, email: string, password: string) => Promise<boolean>;
    /** Clear authentication state and logout */
    logout: () => void;
    /** Check if user has specific role */
    hasRole: (role: string) => boolean;
    /** Check if user is admin or dev */
    isPrivileged: () => boolean;
}

const defaultAuthContext: AuthContextType = {
    user: null,
    company: null,
    isLoading: false,
    error: null,
    login: async () => false,
    register: async () => false,
    logout: () => { },
    hasRole: () => false,
    isPrivileged: () => false,
};

// ===== CONTEXT =====

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// ===== HOOK =====

/**
 * Hook to access authentication context
 * @ai-usage Use this hook to:
 * - Get current user: const { user } = useAuth()
 * - Check login status: if (user) { ... }
 * - Perform logout: logout()
 * - Check permissions: if (isPrivileged()) { ... }
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// ===== PROVIDER =====

interface AuthProviderProps {
    children: ReactNode;
    /** Callback when login succeeds */
    onLoginSuccess?: (user: User, company: Company | null) => void;
    /** Callback when logout occurs */
    onLogout?: () => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
    children,
    onLoginSuccess,
    onLogout
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Try multi-tenant authentication first
            const result = await platformDb.authenticate(email, password);

            if (result.success && result.user && result.company) {
                setUser(result.user);
                setCompany(result.company);
                onLoginSuccess?.(result.user, result.company);
                setIsLoading(false);
                return true;
            }

            // Fall back to legacy auth
            const legacyUser = await db.authenticate(email, password);

            if (legacyUser) {
                const convertedUser: User = {
                    id: legacyUser.email,
                    companyId: 'legacy',
                    email: legacyUser.email,
                    name: legacyUser.name,
                    role: legacyUser.role === 'admin' ? 'admin' : 'team',
                    avatar: legacyUser.avatar,
                    createdAt: Date.now()
                };

                setUser(convertedUser);
                onLoginSuccess?.(convertedUser, null);
                setIsLoading(false);
                return true;
            }

            setError('Invalid email or password');
            setIsLoading(false);
            return false;
        } catch (e) {
            console.error('Login failed', e);
            setError('Login failed. Please try again.');
            setIsLoading(false);
            return false;
        }
    }, [onLoginSuccess]);

    const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            await db.registerUser(email, name, password);
            const success = await login(email, password);
            setIsLoading(false);
            return success;
        } catch (e) {
            console.error('Registration failed', e);
            setError('Registration failed. Please try again.');
            setIsLoading(false);
            return false;
        }
    }, [login]);

    const logout = useCallback(() => {
        setUser(null);
        setCompany(null);
        setError(null);
        onLogout?.();
    }, [onLogout]);

    const hasRole = useCallback((role: string): boolean => {
        return user?.role === role;
    }, [user]);

    const isPrivileged = useCallback((): boolean => {
        return user?.role === 'admin' || user?.role === 'dev';
    }, [user]);

    const value: AuthContextType = {
        user,
        company,
        isLoading,
        error,
        login,
        register,
        logout,
        hasRole,
        isPrivileged,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
