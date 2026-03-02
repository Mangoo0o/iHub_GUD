import { useState, useEffect } from 'react';

const AUTH_KEY = 'csf-auth';

function checkAuth() {
    try {
        const auth = localStorage.getItem(AUTH_KEY);
        if (auth) {
            const parsed = JSON.parse(auth);
            return parsed.loggedIn === true;
        }
    } catch (_) { }
    return false;
}

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuth());

    useEffect(() => {
        const handleStorageChange = () => {
            setIsAuthenticated(checkAuth());
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = (userData) => {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ ...userData, loggedIn: true }));
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem(AUTH_KEY);
        setIsAuthenticated(false);
        window.location.href = '/';
    };

    return {
        isAuthenticated,
        login,
        logout,
    };
}
