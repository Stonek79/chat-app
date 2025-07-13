'use client';

import { createContext, useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { TELEGRAM_THEME_COLORS } from '@chat-app/core';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
    mode: PaletteMode;
    toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [mode, setMode] = useState<PaletteMode>('dark');

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as PaletteMode | null;
        if (storedTheme) {
            setMode(storedTheme);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setMode(prevMode => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newMode);
            return newMode;
        });
    }, []);

    const theme = useMemo(() => {
        const palette = mode === 'dark' ? TELEGRAM_THEME_COLORS.dark : TELEGRAM_THEME_COLORS.light;
        return createTheme({
            palette: {
                mode,
                primary: {
                    main: palette.msgOutBg,
                },
                secondary: {
                    main: palette.dialogsSentIconFgActive,
                },
                background: {
                    default: palette.windowBg,
                    paper: palette.msgInBg,
                },
                text: {
                    primary: palette.historyTextInFg,
                    secondary: palette.historyTextOutFg,
                },
            },
        });
    }, [mode]);

    const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a CustomThemeProvider');
    }
    return context;
};
