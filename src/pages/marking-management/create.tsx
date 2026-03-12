import { useState, useEffect, useRef, useContext } from 'react';
import { Container } from '@/components/container';
import { Box, Button, Typography, List, ListItem, ListItemText, Paper, Card } from '@mui/material';
import { FetchData } from '@/utils/FetchData';
import { AuthContext } from '@/auth/providers/JWTProvider';

const tiposMarcacion = ['entrada', 'entrada_almuerzo', 'salida_almuerzo', 'salida'];

type Marcacion = {
  tipo: string;
  latitud: number;
  longitud: number;
  timestamp: string;
};

export default function MarcacionEmpleadoList() {
  const [indexMarcacion, setIndexMarcacion] = useState(0);
  const [horaActual, setHoraActual] = useState(new Date());
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([]);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    cargarMarcaciones();
  }, []);

  useEffect(() => {
    // Actualizar la hora cada segundo
    intervaloRef.current = setInterval(() => {
      setHoraActual(new Date());
    }, 1000);

    // Cleanup al desmontar
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    };
  }, []);

  const cargarMarcaciones = async () => {
    try {
      const res = await FetchData('/empleado/marcaciones', 'GET', { usuario_id: currentUser?.id });

      // Ordenar marcaciones por timestamp ascendente
      const marcacionesOrdenadas = res.sort(
        (a: Marcacion, b: Marcacion) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setMarcaciones(marcacionesOrdenadas);

      if (marcacionesOrdenadas.length > 0) {
        const ultTipo = marcacionesOrdenadas[marcacionesOrdenadas.length - 1].tipo;
        const siguienteIndex = tiposMarcacion.indexOf(ultTipo) + 1;
        if (siguienteIndex <= tiposMarcacion.length) {
          setIndexMarcacion(siguienteIndex);
        }
      }
    } catch (error) {
      console.error('Error al cargar marcaciones', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const hacerMarcacion = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const tipo = tiposMarcacion[indexMarcacion];

        try {
          const resp = await FetchData('/empleado/marcaciones/', 'POST', {
            tipo,
            latitud: lat,
            longitud: lon,
            empleado_id: currentUser?.id
          });
          if (resp.detail) {
            throw new Error(resp.detail);
          }

          const nuevaMarcacion: Marcacion = {
            tipo,
            latitud: lat,
            longitud: lon,
            timestamp: new Date().toISOString()
          };

          setMarcaciones((prev) => [...prev, nuevaMarcacion]);
          setIndexMarcacion((prev) => prev + 1);
        } catch (error) {
          console.error('Error al registrar la marcación', error);
          setError(error instanceof Error ? error.message : 'Error desconocido');
        }
      },
      (err) => alert('Error al obtener ubicación: ' + err.message)
    );
  };

  return (
    <Container>
      <Card
        sx={{
          p: 3,
          bgcolor: 'background.default',
          minHeight: '100vh',
          color: 'white',
          borderRadius: 6
        }}
      >
        <Typography
          variant="h4"
          sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2, color: 'primary.main' }}
        >
          Sistema de Marcaciones
        </Typography>
        {error && (
          <Typography variant="body1" color="error" sx={{ textAlign: 'center', mb: 2 }}>
            {error}
          </Typography>
        )}
        <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 3 }}>
          {indexMarcacion < tiposMarcacion.length
            ? `Marcar: ${tiposMarcacion[indexMarcacion]}`
            : 'Todas las marcaciones completadas'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Paper
            elevation={3}
            sx={{
              color: 'black',
              px: 4,
              py: 2,
              borderRadius: 2,
              fontFamily: "'Courier New', monospace",
              fontSize: '2.5rem',
              fontWeight: 'bold',
              boxShadow: '0px 4px 10px rgba(0,0,0,0.5)'
            }}
          >
            {horaActual.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </Paper>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button
            variant="contained"
            onClick={hacerMarcacion}
            disabled={indexMarcacion >= tiposMarcacion.length}
            sx={{
              borderRadius: '50px',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'medium',
              bgcolor: indexMarcacion >= tiposMarcacion.length ? 'grey.600' : 'success.main',
              '&:hover': {
                bgcolor: indexMarcacion >= tiposMarcacion.length ? 'grey.600' : 'success.dark'
              },
              textTransform: 'none'
            }}
          >
            {indexMarcacion < tiposMarcacion.length
              ? `Marcar ${tiposMarcacion[indexMarcacion]}`
              : 'Completado'}
          </Button>
        </Box>

        <Paper sx={{ bgcolor: 'background.default', borderRadius: 2, boxShadow: 2 }}>
          <List>
            {marcaciones.map((m, i) => (
              <ListItem
                key={i}
                divider
                sx={{
                  color: 'white',
                  '&:hover': { bgcolor: 'grey.700' }
                }}
              >
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: 'medium' }}>
                      {m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)} -{' '}
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{ color: 'grey.400' }}>
                      Lat: {m.latitud?.toFixed(4)}, Lon: {m.longitud?.toFixed(4)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Card>
    </Container>
  );
}
