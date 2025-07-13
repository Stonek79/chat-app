import { createTheme } from '@mui/material/styles';
import { TELEGRAM_THEME_COLORS } from '@chat-app/core';

// Расширяем PaletteOptions, чтобы TypeScript знал о наших кастомных цветах
declare module '@mui/material/styles' {
    interface Palette {
        msgInBg?: string;
        msgOutBg?: string;
    }
    interface PaletteOptions {
        msgInBg?: string;
        msgOutBg?: string;
    }
}

const commonComponents = {
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 8,
            },
        },
    },
};

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: TELEGRAM_THEME_COLORS.dark.windowBg,
            paper: TELEGRAM_THEME_COLORS.dark.msgInBg,
        },
        primary: {
            main: TELEGRAM_THEME_COLORS.dark.dialogsSentIconFgActive,
        },
        text: {
            primary: TELEGRAM_THEME_COLORS.dark.historyTextInFg,
            secondary: '#a9a9a9',
        },
        msgInBg: TELEGRAM_THEME_COLORS.dark.msgInBg,
        msgOutBg: TELEGRAM_THEME_COLORS.dark.msgOutBg,
    },
    components: commonComponents,
});

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        // TODO: Заполнить цветами из светлой темы Telegram
        background: {
            default: '#f0f2f5',
            paper: '#ffffff',
        },
        primary: {
            main: '#1976d2',
        },
        text: {
            primary: '#000000',
            secondary: '#657786',
        },
    },
    components: commonComponents,
});
