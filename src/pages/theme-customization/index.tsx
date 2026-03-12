import { Container, Paper, Box, Typography, Divider } from '@mui/material';
import { ThemeSelector } from '@/components/theme-selector';

export const ThemeCustomizationPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Personalización de Temas
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Elige entre nuestros temas predefinidos o crea tu propia paleta de colores personalizada.
          Los cambios se aplicarán inmediatamente en toda la aplicación.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <ThemeSelector />

        {/* Ejemplo de componentes para mostrar los colores */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Vista Previa de Componentes
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              p: 3,
              bgcolor: 'background.default',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="h6" color="primary">
                Texto Primario
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Texto secundario en superficie
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="h6">Superficie Primaria</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Texto sobre color primario
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
              <Typography variant="h6">Superficie Secundaria</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Texto sobre color secundario
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};
