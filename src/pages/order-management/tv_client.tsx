import { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import { FetchData } from '@/utils/FetchData';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Backdrop,
  Button,
  CircularProgress,
  Paper,
  Grid,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Chip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
// Toolbar
const Toolbar = ({ searchInput, setSearchInput }: any) => (
  <Paper elevation={0} className="p-4 mb-4">
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} md={8}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por orden o vehículo..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={4} className="text-right">
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => window.location.reload()}
          startIcon={<KeenIcon icon="arrows-circle" />}
        >
          Refrescar
        </Button>
      </Grid>
    </Grid>
  </Paper>
);

// Componente principal
const TvClient = () => {
  useLayout();
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [refreshMinutes, setRefreshMinutes] = useState(1);

  const get_data = async () => {
    setLoading(true);
    console.log('Obteniendo datos');
    const url = window.location.href;
    const id = url.split('/').pop();
    const response = await FetchData('ordenes_compartir/' + id, 'GET', null);
    if (response.detail) {
      alert('El link no es válido, se redirigirá al inicio');
      window.location.href = '/';
    }
    if (response) {
      setRegistros(response);
    }
    setLoading(false);
  };
  useEffect(() => {
    let idinterval: any = null;
    const start = async () => {
      await get_data();
      idinterval = setInterval(() => get_data(), refreshMinutes * 60000);
    };
    start();
    return () => {
      if (idinterval) clearInterval(idinterval);
    };
  }, [refreshMinutes]);
  const formatImage = (image: string, image2: string) => {
    let img =
      'https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ=';
    if (image2 !== '') {
      img = image2;
    } else if (image !== '') {
      img = image;
    }
    if (img.includes('None') || img.includes('null')) {
      img =
        'https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ=';
    }
    return img;
  };
  const color = (estado: string) => {
    const status: Record<string, string> = {
      'En transito a puerto': '#10B981',
      'Llegada a puerto': '#F59E0B',
      'En carga de material': '#3B82F6',
      'Carga finalizada': '#2563EB',
      'En transito a destino': '#0EA5A4',
      'Lugar de destino': '#06B6D4',
      'En espera': '#EF4444',
      'Sin iniciar': '#64748B',
      Finalizado: '#14B8A6',
      'Descarga de material': '#1D4ED8'
    };
    return status[estado] || '#6B7280';
  };
  return (
    <Fragment>
      <Container>
        <Grid container spacing={2} alignItems="center" className="mb-4">
          <Grid item xs={12} md={8}>
            <img src={toAbsoluteUrl('/media/app/logo.png')} alt="Logo" className="w-40 h-20" />
            <Typography variant="h5">Grain Logistics</Typography>
          </Grid>

          <Grid item xs={12} md={4} className="text-right">
            <Button
              variant="contained"
              color="primary"
              onClick={() => get_data()}
              startIcon={<KeenIcon icon="arrows-circle" />}
              sx={{ backgroundColor: '#0D0E12' }}
            >
              Actualizar
            </Button>
          </Grid>
        </Grid>

        <Toolbar searchInput={searchInput} setSearchInput={setSearchInput} />

        <Accordion>
          <AccordionSummary expandIcon={<KeenIcon icon="chevron-down" />}>
            <strong>Refrescando cada {refreshMinutes} minutos</strong>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel id="refresh-label">Intervalo</InputLabel>
              <Select
                labelId="refresh-label"
                value={refreshMinutes}
                label="Intervalo"
                onChange={(e: any) => setRefreshMinutes(e.target.value)}
              >
                <MenuItem value={0.5}>30 segundos</MenuItem>
                <MenuItem value={0.75}>45 segundos</MenuItem>
                <MenuItem value={1}>1 minuto</MenuItem>
                <MenuItem value={2}>2 minutos</MenuItem>
                <MenuItem value={3}>3 minutos</MenuItem>
                <MenuItem value={5}>5 minutos</MenuItem>
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {loading && (
          <Backdrop open={loading} sx={{ color: '#fff', zIndex: 1000 }}>
            <CircularProgress color="inherit" />
          </Backdrop>
        )}

        {!loading && (
          <TableContainer component={Paper} elevation={1} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#Orden</TableCell>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Vehiculo Asignado</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No hay registros
                    </TableCell>
                  </TableRow>
                ) : (
                  registros.map((registro: any) => (
                    <TableRow key={registro.id} hover>
                      <TableCell>{registro.orden_id}</TableCell>
                      <TableCell>
                        <Avatar
                          src={formatImage(registro.vehiculo_foto, '')}
                          alt={registro.vehiculo_nombre}
                        />
                      </TableCell>
                      <TableCell>{registro.vehiculo_nombre}</TableCell>
                      <TableCell>
                        <Chip
                          label={registro.estado}
                          size="small"
                          sx={{ backgroundColor: color(registro.estado), color: '#fff' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Fragment>
  );
};

export { TvClient };
