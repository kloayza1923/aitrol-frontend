import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Stack
} from '@mui/material';
import { Palette, ColorLens } from '@mui/icons-material';
import { useSettings } from '@/providers/SettingsProvider';
import { colorThemes } from '@/providers/MUIThemeProvider';
import type { TColorTheme, ICustomColors } from '@/config/settings.config';

interface ColorPreviewProps {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
  };
  isSelected: boolean;
  onClick: () => void;
  name: string;
}

const ColorPreview = ({ colors, isSelected, onClick, name }: ColorPreviewProps) => (
  <Card
    sx={{
      cursor: 'pointer',
      border: isSelected ? 2 : 1,
      borderColor: isSelected ? 'primary.main' : 'divider',
      '&:hover': {
        boxShadow: 3,
        transform: 'translateY(-2px)'
      },
      transition: 'all 0.2s ease-in-out'
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
        {name}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 20,
            height: 20,
            bgcolor: colors.primary,
            borderRadius: 1,
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        />
        <Box
          sx={{
            width: 20,
            height: 20,
            bgcolor: colors.secondary,
            borderRadius: 1,
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        />
        <Box
          sx={{
            width: 20,
            height: 20,
            bgcolor: colors.surface,
            borderRadius: 1,
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        />
      </Stack>
      {isSelected && (
        <Chip label="Seleccionado" size="small" color="primary" sx={{ fontSize: '0.7rem' }} />
      )}
    </CardContent>
  </Card>
);

export const ThemeSelector = () => {
  const { settings, storeSettings } = useSettings();
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customColors, setCustomColors] = useState<ICustomColors>({
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#ffffff',
    surface: '#f5f5f5'
  });

  const currentTheme = settings.colorTheme || 'default';
  const isDarkMode =
    settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleThemeChange = (themeKey: TColorTheme) => {
    storeSettings({ colorTheme: themeKey });
  };

  const handleCustomColorChange = (colorKey: keyof ICustomColors, value: string) => {
    setCustomColors((prev) => ({
      ...prev,
      [colorKey]: value
    }));
  };

  const applyCustomColors = () => {
    storeSettings({
      colorTheme: 'custom',
      customColors: customColors
    });
    setCustomDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Palette />
        Temas de Color
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(colorThemes).map(([key, theme]) => {
          if (key === 'custom') return null; // Lo manejamos por separado

          const colors = theme[isDarkMode ? 'dark' : 'light'];
          return (
            <Grid item xs={6} sm={4} md={3} key={key}>
              <ColorPreview
                colors={colors}
                isSelected={currentTheme === key}
                onClick={() => handleThemeChange(key as TColorTheme)}
                name={theme.name}
              />
            </Grid>
          );
        })}

        {/* Tema personalizado */}
        <Grid item xs={6} sm={4} md={3}>
          <Card
            sx={{
              cursor: 'pointer',
              border: currentTheme === 'custom' ? 2 : 1,
              borderColor: currentTheme === 'custom' ? 'primary.main' : 'divider',
              borderStyle: 'dashed',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
            onClick={() => setCustomDialogOpen(true)}
          >
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <ColorLens sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="subtitle2">Personalizado</Typography>
              {currentTheme === 'custom' && (
                <Chip
                  label="Activo"
                  size="small"
                  color="primary"
                  sx={{ fontSize: '0.7rem', mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog para colores personalizados */}
      <Dialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Personalizar Colores del Tema</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              label="Color Primario"
              type="color"
              value={customColors.primary}
              onChange={(e) => handleCustomColorChange('primary', e.target.value)}
              fullWidth
              InputProps={{
                sx: { height: 56 }
              }}
            />
            <TextField
              label="Color Secundario"
              type="color"
              value={customColors.secondary}
              onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
              fullWidth
              InputProps={{
                sx: { height: 56 }
              }}
            />
            <TextField
              label="Color de Fondo"
              type="color"
              value={customColors.background}
              onChange={(e) => handleCustomColorChange('background', e.target.value)}
              fullWidth
              InputProps={{
                sx: { height: 56 }
              }}
            />
            <TextField
              label="Color de Superficie"
              type="color"
              value={customColors.surface}
              onChange={(e) => handleCustomColorChange('surface', e.target.value)}
              fullWidth
              InputProps={{
                sx: { height: 56 }
              }}
            />

            {/* Vista previa */}
            <Paper sx={{ p: 2, bgcolor: customColors.background }}>
              <Typography variant="h6" sx={{ color: customColors.primary, mb: 1 }}>
                Vista Previa
              </Typography>
              <Button
                variant="contained"
                sx={{
                  bgcolor: customColors.primary,
                  mr: 1,
                  '&:hover': {
                    bgcolor: customColors.primary,
                    filter: 'brightness(0.9)'
                  }
                }}
              >
                Primario
              </Button>
              <Button
                variant="outlined"
                sx={{
                  color: customColors.secondary,
                  borderColor: customColors.secondary
                }}
              >
                Secundario
              </Button>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={applyCustomColors}>
            Aplicar Tema
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
