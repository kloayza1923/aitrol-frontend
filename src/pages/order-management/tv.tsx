import { Fragment, useEffect, useState, useRef } from 'react';
import { Container } from '@/components/container';
import { toast } from 'sonner';
import { useLayout } from '@/providers';
import { FetchData } from '@/utils/FetchData';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Modal,
  Avatar,
  Chip,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { KeenIcon } from '@/components';
import { EyeIcon } from 'lucide-react';

// Toolbar separada para evitar errores de referencia
const Toolbar = ({ searchInput, setSearchInput }: any) => {
  return (
    <Paper elevation={0} className="p-4 mb-4">
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Buscar por cliente, vehículo o guía..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

// Componente principal
const TvManagement = () => {
  useLayout();
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState([]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [inlineMapOpen, setInlineMapOpen] = useState(false);
  const modalMapRef = useRef<HTMLDivElement | null>(null);
  const modalMapInstance = useRef<any>(null);
  const modalMarkerRef = useRef<any>(null);
  const [modalLocation, setModalLocation] = useState<any>(null);
  const [refreshMinutes, setRefreshMinutes] = useState(1);
  const [modalDetails, setModalDetails] = useState(false);
  const [order, setOrder] = useState([]);
  const [order_id, setOrder_id] = useState(0);
  const get_data = async () => {
    setLoading(true);
    console.log('Obteniendo datos');
    const response = await FetchData('ordenes_viajes_tv', 'GET', {});
    if (response) {
      setRegistros(response);
    } else {
      toast.error('Error al obtener los datos');
    }
    setLoading(false);
  };
  const get_details = async (id: number) => {
    //setLoading(true);
    console.log('Obteniendo datos');
    const response = await FetchData('ordenes_viajes_log/' + id, 'GET', {});
    if (response) {
      setOrder(response);
      setModalDetails(true);
    } else {
      toast.error('Error al obtener los datos');
    }
    //setLoading(false);
  };
  // Controlar carga inicial y refresco según refreshMinutes
  useEffect(() => {
    get_data();
  }, []);

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

      // Resp is an array of viajes each with `ubicaciones` array. Pick the most recent ubicacion by timestamp.
      let latest: any = null;
      for (const viaje of resp) {
        if (!viaje.ubicaciones || viaje.ubicaciones.length === 0) continue;
        const u = viaje.ubicaciones[viaje.ubicaciones.length - 1];
        console.log('Ubicación encontrada:', viaje);
        if (!latest) latest = u;
        else if (new Date(u.timestamp) > new Date(latest.timestamp)) latest = u;
      }
      return latest;
    } catch (err) {
      return null;
    }
  };

  // Render markers when registros change
  useEffect(() => {
    // No inline map rendering anymore; we render per-record in modal when requested
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
    if (!loc) return toast.error('Ubicación no disponible');
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
  const formatpeso = (peso: number, peso2: number) => {
    let ps: number | string = 0;
    if (peso2 > 0) {
      ps = peso2;
    }
    if (peso > 0) {
      ps = peso;
    }
    return Number(ps).toFixed(2);
  };
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
          <Grid item xs={12} md={6}>
            <Typography variant="h5" component="h2" gutterBottom>
              Flota de vehículos
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Monitoreo en tiempo real de las órdenes y su estado
            </Typography>
          </Grid>

          <Grid item xs={12} md={6} className="text-right">
            <Button
              variant="contained"
              color="primary"
              onClick={() => get_data()}
              startIcon={<KeenIcon icon="arrows-circle" />}
              sx={{ backgroundColor: '#0D0E12', color: '#fff', borderRadius: 2 }}
            >
              Actualizar
            </Button>
          </Grid>
        </Grid>

        <Toolbar searchInput={searchInput} setSearchInput={setSearchInput} />

        {loading && (
          <Backdrop open={loading} sx={{ color: '#fff', zIndex: 1000 }}>
            <CircularProgress color="inherit" />
          </Backdrop>
        )}

        {/* Inline map area (visible when a registro map is opened) */}
        {inlineMapOpen && (
          <Box sx={{ width: '100%', mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
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

        <Modal open={modalDetails} onClose={() => setModalDetails(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 900,
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              p: 4
            }}
          >
            <div className="flex justify-between">
              <Typography variant="h6">Detalles de la orden #{order_id}</Typography>
              <Button size="small" onClick={() => setModalDetails(false)}>
                Cerrar
              </Button>
            </div>

            <Box mt={2}>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Hora</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell>{o.id}</TableCell>
                        <TableCell>{o.estado}</TableCell>
                        <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(o.created_at).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Modal>

        {!loading && (
          <TableContainer component={Paper} elevation={1} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#Orden</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Vehiculo Asignado</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                  <TableCell>Hora</TableCell>
                  <TableCell>Peso</TableCell>
                  <TableCell>Guía</TableCell>
                  <TableCell>Documento</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Mapa</TableCell>
                  <TableCell>Detalles</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registros.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} align="center">
                      No hay registros
                    </TableCell>
                  </TableRow>
                )}
                {registros.map((registro: any) => (
                  <TableRow key={registro.id} hover>
                    <TableCell>{registro.orden_id}</TableCell>
                    <TableCell>{registro.cliente_nombre}</TableCell>
                    <TableCell>{registro.vehiculo_nombre}</TableCell>
                    <TableCell>
                      <Avatar src={registro.vehiculo_foto} alt={registro.vehiculo_nombre} />
                    </TableCell>
                    <TableCell>{registro.usuario_nombre}</TableCell>
                    <TableCell>{new Date(registro.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(registro.created_at).toLocaleTimeString()}</TableCell>
                    <TableCell>{formatpeso(registro.peso, registro.peso2)}</TableCell>
                    <TableCell>{registro.numero_guia || registro.numero_guia2}</TableCell>
                    <TableCell>
                      <Avatar
                        src={formatImage(registro.documento_path, registro.documento_path2)}
                        variant="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      {registro.estado === 'En espera' && registro.en_vuelta === '1' ? (
                        <Chip label="Vuelta finalizada" color="error" size="small" />
                      ) : (
                        <Chip
                          label={registro.estado}
                          size="small"
                          sx={{
                            backgroundColor: color(registro.estado) || '#e0e0e0',
                            color: '#fff'
                          }}
                        />
                      )}
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
                    <TableCell>
                      <EyeIcon
                        className="cursor-pointer"
                        onClick={() => {
                          setOrder_id(registro.id);
                          get_details(registro.id);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Fragment>
  );
};

export { TvManagement };
