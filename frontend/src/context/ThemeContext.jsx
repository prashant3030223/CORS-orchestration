import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initialize state properly from localStorage
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('cors_theme_v1');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const isDarkMode = theme === 'dark';

    // Synchronize theme with DOM
    useEffect(() => {
        const applyTheme = () => {
            const root = window.document.documentElement;
            const isDark = theme === 'dark';

            // Apply to HTML element (Tailwind requirement)
            if (isDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }

            // Apply to BODY element as fallback
            if (isDark) {
                document.body.classList.add('dark');
                document.body.style.backgroundColor = '#020617';
                document.body.style.color = '#f8fafc';
            } else {
                document.body.classList.remove('dark');
                document.body.style.backgroundColor = '#f8fafc';
                document.body.style.color = '#020617';
            }

            localStorage.setItem('cors_theme_v1', theme);
            console.log('Theme Engine: Switch to', theme);
        };

        applyTheme();
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    const value = React.useMemo(() => ({ theme, isDarkMode, toggleTheme }), [theme, isDarkMode, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
