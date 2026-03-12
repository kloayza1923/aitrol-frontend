// src/providers/MUIThemeProvider.tsx
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useSettings } from '@/providers/SettingsProvider';
import { PropsWithChildren, useMemo } from 'react';

// Paletas de colores predefinidas
export const colorThemes = {
  default: {
    name: 'Por Defecto',
    light: {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#ffffff',
      surface: '#ffffff'
    },
    dark: {
      primary: '#90caf9',
      secondary: '#f48fb1',
      background: '#121212',
      surface: '#1e1e1e'
    }
  },
  ocean: {
    name: 'Océano',
    light: {
      primary: '#0277bd',
      secondary: '#00acc1',
      background: '#ffffff',
      surface: '#e3f2fd'
    },
    dark: {
      primary: '#29b6f6',
      secondary: '#26c6da',
      background: '#0d1421',
      surface: '#1a2332'
    }
  },
  forest: {
    name: 'Bosque',
    light: {
      primary: '#2e7d32',
      secondary: '#558b2f',
      background: '#ffffff',
      surface: '#f1f8e9'
    },
    dark: {
      primary: '#66bb6a',
      secondary: '#9ccc65',
      background: '#1b2515',
      surface: '#273326'
    }
  },
  sunset: {
    name: 'Atardecer',
    light: {
      primary: '#f57c00',
      secondary: '#e91e63',
      background: '#ffffff',
      surface: '#fff3e0'
    },
    dark: {
      primary: '#ffb74d',
      secondary: '#f06292',
      background: '#2d1b05',
      surface: '#3e2912'
    }
  },
  royal: {
    name: 'Real',
    light: {
      primary: '#673ab7',
      secondary: '#3f51b5',
      background: '#ffffff',
      surface: '#f3e5f5'
    },
    dark: {
      primary: '#9575cd',
      secondary: '#7986cb',
      background: '#1a0d2e',
      surface: '#2a1a3e'
    }
  },
  dark: {
    name: 'Oscuro',
    light: {
      primary: '#424242',
      secondary: '#616161',
      background: '#ffffff',
      surface: '#eeeeee'
    },
    dark: {
      primary: '#bdbdbd',
      secondary: '#e0e0e0',
      background: '#121212',
      surface: '#1e1e1e'
    }
  },
  dark_ocean: {
    name: 'Océano Oscuro',
    light: {
      primary: '#01579b',
      secondary: '#0288d1',
      background: '#ffffff',
      surface: '#e1f5fe'
    },
    dark: {
      primary: '#4fc3f7',
      secondary: '#81d4fa',
      background: '#0a1e2d',
      surface: '#142c3d'
    }
  },
  dark_forest: {
    name: 'Bosque Oscuro',
    light: {
      primary: '#1b5e20',
      secondary: '#388e3c',
      background: '#ffffff',
      surface: '#e8f5e9'
    },
    dark: {
      primary: '#81c784',
      secondary: '#a5d6a7',
      background: '#162215',
      surface: '#223322'
    }
  },
  dark_sunset: {
    name: 'Atardecer Oscuro',
    light: {
      primary: '#e65100',
      secondary: '#d81b60',
      background: '#ffffff',
      surface: '#fff3e0'
    },
    dark: {
      primary: '#ff8a50',
      secondary: '#f06292',
      background: '#2b1705',
      surface: '#3a2612'
    }
  },
  custom: {
    name: 'Personalizado',
    light: {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#ffffff',
      surface: '#f5f5f5'
    },
    dark: {
      primary: '#90caf9',
      secondary: '#f48fb1',
      background: '#121212',
      surface: '#1e1e1e'
    }
  }
};

export const MUIThemeProvider = ({ children }: PropsWithChildren) => {
  const { settings } = useSettings();

  const theme = useMemo(() => {
    const mode =
      settings.themeMode === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : settings.themeMode;

    // Obtener tema de color seleccionado o usar default
    const selectedTheme = settings.colorTheme || 'default';
    const themeColors =
      colorThemes[selectedTheme as keyof typeof colorThemes] || colorThemes.default;
    const modeColors = themeColors[mode as 'light' | 'dark'];

    // Si es tema personalizado, usar colores custom del settings
    const colors =
      selectedTheme === 'custom' && settings.customColors
        ? {
          primary: settings.customColors.primary || modeColors.primary,
          secondary: settings.customColors.secondary || modeColors.secondary,
          background: settings.customColors.background || modeColors.background,
          surface: settings.customColors.surface || modeColors.surface
        }
        : modeColors;

    return createTheme({
      palette: {
        mode,
        primary: {
          main: colors.primary
        },
        grey: {
          50: mode === 'dark' ? '#1a1d21' : '#fafafa',
          100: mode === 'dark' ? '#20242a' : '#f5f5f5',
          200: mode === 'dark' ? '#2a2f36' : '#eeeeee',
          300: mode === 'dark' ? '#343a43' : '#e0e0e0',
          400: mode === 'dark' ? '#3f4752' : '#bdbdbd',
          500: mode === 'dark' ? '#4b5663' : '#9e9e9e',
          600: mode === 'dark' ? '#5a6776' : '#757575',
          700: mode === 'dark' ? '#6b7a8b' : '#616161',
          800: mode === 'dark' ? '#7f90a3' : '#424242',
          900: mode === 'dark' ? '#94a8bd' : '#212121'
        },
        success: {
          main: mode === 'dark' ? '#66bb6a' : '#2e7d32'
        },
        warning: {
          main: mode === 'dark' ? '#ffa726' : '#ed6c02'
        },
        error: {
          main: mode === 'dark' ? '#ef5350' : '#d32f2f'
        },
        info: {
          main: mode === 'dark' ? colors.primary : colors.primary
        },
        secondary: {
          main: colors.secondary
        },
        action: {
          hover:
            mode === 'dark'
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.04)',
          selected:
            mode === 'dark'
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(0,0,0,0.08)',
          disabled:
            mode === 'dark'
              ? 'rgba(255,255,255,0.38)'
              : 'rgba(0,0,0,0.3)',
          disabledBackground:
            mode === 'dark'
              ? 'rgba(255,255,255,0.16)'
              : 'rgba(0,0,0,0.12)'
        },
        divider:
          mode === 'dark'
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(0,0,0,0.08)',
        background: {
          default: colors.background,
          paper: colors.surface
        },
        text: {
          primary: mode === 'dark' ? '#e6e9ee' : '#1B1B1B',
          secondary:
            mode === 'dark'
              ? '#a7b0bc'
              : 'rgba(0,0,0,0.6)',
          disabled: mode === 'dark' ? '#6f7a86' : 'rgba(0,0,0,0.38)'
        }
      },
      typography: {
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        h1: {
          fontWeight: 700,
          fontSize: '2.5rem',
          letterSpacing: '-0.5px'
        },
        h2: {
          fontWeight: 700,
          fontSize: '2rem',
          letterSpacing: '-0.5px'
        },
        h3: {
          fontWeight: 600,
          fontSize: '1.5rem',
          letterSpacing: '-0.5px'
        },
        h4: {
          fontWeight: 500,
          fontSize: '1.25rem'
        },
        h5: {
          fontWeight: 500,
          fontSize: '1.1rem'
        },
        h6: {
          fontWeight: 500,
          fontSize: '1rem'
        },
        body1: {
          fontSize: '1rem',
          fontWeight: 400
        },
        body2: {
          fontSize: '0.95rem',
          fontWeight: 400
        }
      }
    });
  }, [settings.themeMode, settings.colorTheme, settings.customColors]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
