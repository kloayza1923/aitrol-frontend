import { Fragment, useContext, useEffect, useState, useRef } from 'react';
import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import { FetchData } from '@/utils/FetchData';
import { useErrorHandler } from '@/hooks/useErrorHandler';
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
  MenuItem,
  Autocomplete,
  Modal,
  Box
} from '@mui/material';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { toast } from 'sonner';
import { AuthContext } from '@/auth/providers/JWTProvider';

// Componente principal
const TvClientShow = () => {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [inlineMapOpen, setInlineMapOpen] = useState(false);
  const modalMapRef = useRef<HTMLDivElement | null>(null);
  const modalMapInstance = useRef<any>(null);
  const modalMarkerRef = useRef<any>(null);
  const [modalLocation, setModalLocation] = useState<any>(null);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<any>(null);
  const [refreshMinutes, setRefreshMinutes] = useState(1);
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;
  const { handleApiError } = useErrorHandler();

  const get_ordenes = async () => {
    try {
      const response = await FetchData(`ordenes_usuarios/${currentUser?.id}`, 'GET', {});
      if (response) {
        setOrdenes(
          response.sort(
            (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          )
        );
      }
    } catch (error) {
      handleApiError(error, 'ordenes_usuarios');
      // Opcional: mantener estado anterior o mostrar UI de error
      setOrdenes([]);
    }
  };

  const get_data = async (ordenId: number) => {
    setLoading(true);
    try {
      const response = await FetchData('ordenes_compartir_usuarios/' + ordenId, 'GET', null);
      console.log('response', response);
      if (response.detail) {
        handleApiError(response, 'ordenes_compartir_usuarios');
        setRegistros([]);
      } else if (response) {
        setRegistros(response);
      }
    } catch (error) {
      handleApiError(error, 'ordenes_compartir_usuarios');
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    get_ordenes();
  }, []);

  useEffect(() => {
    let idinterval: any = null;
    if (selectedOrden) {
      const start = async () => {
        await get_data(selectedOrden.id);
        //idinterval = setInterval(() => get_data(selectedOrden.id), refreshMinutes * 60000);
      };
      start();
    }
  }, [selectedOrden]);

  // Load Google Maps script dynamically
  const loadGoogleMaps = (callback: () => void) => {
    if ((window as any).google && (window as any).google.maps) {
      callback();
      return;
    }

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', callback);
      return;
    }

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    if (!key) {
      // still attach a dummy script to avoid multiple attempts
      script.text = '';
      document.head.appendChild(script);
      callback();
      return;
    }
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
  };

  const fetchLocationByOrden = async (ordenId: number) => {
    try {
      const resp = await FetchData('tracking', 'GET', { orden_id: ordenId });
      if (!resp || !Array.isArray(resp) || resp.length === 0) return null;

      let latest: any = null;
      for (const viaje of resp) {
        if (!viaje.ubicaciones || viaje.ubicaciones.length === 0) continue;
        const u = viaje.ubicaciones[viaje.ubicaciones.length - 1];
        if (!latest) latest = u;
        else if (new Date(u.timestamp) > new Date(latest.timestamp)) latest = u;
      }
      return latest;
    } catch (err) {
      return null;
    }
  };

  // No inline map rendering anymore; we render per-record in modal when requested
  useEffect(() => {
    return undefined;
  }, [registros]);

  const centerOn = (registroId: number) => {
    const found = markersRef.current.find((m) => m.id === registroId);
    const mk = found ? found.marker || found : null;
    if (mk && typeof mk.getPosition === 'function') {
      const pos = mk.getPosition();
      mapInstance.current.setCenter(pos);
      mapInstance.current.setZoom(16);
    }
  };

  const openMapModal = async (registro: any) => {
    const ordenId = registro.orden_id || registro.id;
    if (!ordenId) return toast.error('Orden inválida');
    const loc = await fetchLocationByOrden(ordenId);
    if (!loc) return handleApiError({ message: 'Ubicación no disponible' }, 'tracking');
    setModalLocation({ ...loc, orden_id: ordenId, registroId: registro.id });
    setInlineMapOpen(true);
  };

  // Initialize or update modal map when modal is opened and modalLocation is set
  useEffect(() => {
    if (!inlineMapOpen || !modalLocation) return;
    loadGoogleMaps(() => {
      if (!modalMapRef.current) return;
      const lat = parseFloat(modalLocation.latitud);
      const lng = parseFloat(modalLocation.longitud);
      if (!modalMapInstance.current) {
        modalMapInstance.current = new (window as any).google.maps.Map(modalMapRef.current, {
          center: { lat, lng },
          zoom: 16
        });
      } else {
        (window as any).google.maps.event.trigger(modalMapInstance.current, 'resize');
        modalMapInstance.current.setCenter({ lat, lng });
        modalMapInstance.current.setZoom(16);
      }
      if (modalMarkerRef.current && typeof modalMarkerRef.current.setMap === 'function')
        modalMarkerRef.current.setMap(null);
      modalMarkerRef.current = new (window as any).google.maps.Marker({
        position: { lat, lng },
        map: modalMapInstance.current
      });
    });
  }, [inlineMapOpen, modalLocation]);

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
            {/*   <img src={toAbsoluteUrl('/media/app/logo.jpg')} alt="Logo" className="w-40 h-20" /> */}
            <Typography variant="h5">Grain Logistics</Typography>
          </Grid>

          <Grid item xs={12} md={4} className="text-right">
            <Button
              variant="contained"
              color="primary"
              onClick={() => selectedOrden && get_data(selectedOrden.id)}
              startIcon={<KeenIcon icon="arrows-circle" />}
              sx={{ backgroundColor: '#0D0E12' }}
              disabled={!selectedOrden}
            >
              Actualizar
            </Button>
          </Grid>
        </Grid>

        <Paper elevation={0} className="p-4 mb-4">
          <Typography variant="h6" className="mb-2">
            Seleccionar Orden
          </Typography>
          <Autocomplete
            options={ordenes}
            getOptionLabel={(option: any) =>
              `${option.descripcion} - ${option.fecha} - ORDEN# ${option.id}`
            }
            onChange={(event, newValue) => {
              setSelectedOrden(newValue);
            }}
            renderInput={(params) => (
              <div ref={params.InputProps.ref}>
                <TextField
                  {...params.inputProps}
                  fullWidth
                  size="small"
                  placeholder="Seleccione una orden"
                />
              </div>
            )}
            renderOption={(props, option: any) => (
              <li {...props} key={option.id}>
                {`${option.descripcion} - ${option.fecha} - ORDEN # ${option.id}`}
              </li>
            )}
            isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
            noOptionsText="No hay opciones"
            disablePortal
          />
        </Paper>

        {selectedOrden && (
          <>
            {loading && (
              <Backdrop open={loading} sx={{ color: '#fff', zIndex: 1000 }}>
                <CircularProgress color="inherit" />
              </Backdrop>
            )}

            {/* Inline map area (visible when a registro map is opened) */}
            {inlineMapOpen && (
              <Box
                sx={{ width: '100%', mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8
                  }}
                >
                  <div>
                    <strong>Ubicación</strong>
                    <div style={{ fontSize: 12 }}>
                      {modalLocation
                        ? `${modalLocation.orden_id ? 'Orden ' + modalLocation.orden_id : ''}`
                        : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {modalLocation && modalLocation.timestamp && (
                      <div style={{ fontSize: 12 }}>
                        {new Date(modalLocation.timestamp).toLocaleString()}
                      </div>
                    )}
                    <Button
                      size="small"
                      onClick={() => {
                        if (
                          modalMarkerRef.current &&
                          typeof modalMarkerRef.current.setMap === 'function'
                        )
                          modalMarkerRef.current.setMap(null);
                        modalMarkerRef.current = null;
                        modalMapInstance.current = null;
                        setInlineMapOpen(false);
                      }}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
                <div style={{ width: '100%', height: 420 }}>
                  <div ref={modalMapRef} style={{ width: '100%', height: '100%' }} />
                </div>
              </Box>
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
                      <TableCell>Mapa</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registros.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
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
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => openMapModal(registro)}
                            >
                              Ver mapa
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Container>
    </Fragment>
  );
};

export { TvClientShow };
