import { createTheme, Theme } from '@mui/material/styles';
import type { ThemeMode } from './store';

// CSS variables for color management
const cssVariables = {
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-tertiary': '#f1f5f9',
    '--text-primary': '#1e293b',
    '--text-secondary': '#64748b',
    '--border-color': '#e2e8f0',
    '--accent-primary': '#2563eb',
    '--accent-light': '#eff6ff',
    '--message-user': '#eff6ff',
    '--message-assistant': '#f8fafc',
    '--sidebar-bg': '#ffffff',
    '--input-bg': '#ffffff',
  },
  dark: {
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--bg-tertiary': '#334155',
    '--text-primary': '#f1f5f9',
    '--text-secondary': '#94a3b8',
    '--border-color': '#334155',
    '--accent-primary': '#3b82f6',
    '--accent-light': '#1e3a5f',
    '--message-user': '#1e3a5f',
    '--message-assistant': '#1e293b',
    '--sidebar-bg': '#1e293b',
    '--input-bg': '#1e293b',
  },
};

// Apply CSS variables to document root
export const applyCssVariables = (mode: ThemeMode): void => {
  const root = document.documentElement;
  const variables = cssVariables[mode];
  
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

// Create theme based on mode
export const createAppTheme = (mode: ThemeMode): Theme => {
  const isDark = mode === 'dark';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#3b82f6' : '#2563eb',
        light: isDark ? '#60a5fa' : '#eff6ff',
      },
      background: {
        default: isDark ? '#0f172a' : '#f8fafc',
        paper: isDark ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? '#334155' : '#e2e8f0',
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#f1f5f9' : '#1e293b',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: 'background-color 0.3s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.2s ease',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(37, 99, 235, 0.08)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.24)' : 'rgba(37, 99, 235, 0.12)',
              },
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
            },
          },
        },
      },
    },
  });
};

// Legacy export for backward compatibility
export const theme = createAppTheme('light');
