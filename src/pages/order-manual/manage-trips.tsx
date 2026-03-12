import { Fragment, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '@/components/container';
import {
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { FetchData } from '@/utils/FetchData';
import { toast } from 'sonner';
import { Truck, User, MapPin, Clock, AlertCircle, Trash2 } from 'lucide-react';

interface Viaje {
  id: number;
  vehiculo_id: number;
  user_id: number;
  orden_id: number;
  estado: string;
  created_at: string;
}

const ManageTrips = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [orden, setOrden] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any>([]);
  const [users, setUsers] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedViajeId, setSelectedViajeId] = useState<number | null>(null);

  const estadosDisponibles = [
    { value: 'Sin iniciar', color: 'default', icon: '⏸️' },
    { value: 'Parada de mantenimiento', color: 'warning', icon: '🔧' },
    { value: 'En ruta', color: 'success', icon: '🚚' },
    { value: 'En empresa', color: 'info', icon: '🏢' },
    { value: 'Finalizado', color: 'secondary', icon: '✅' }
  ];

  const get_orden = async () => {
    const data = await FetchData(`ordenes_manual/${id}`, 'GET', null);
    if (data && !data.detail) {
      setOrden(data);
    } else {
      toast.error('Error al cargar la orden');
      navigate('/order-manual');
    }
  };

  const get_viajes = async () => {
    const data = await FetchData(`ordenes_manual_viajes/${id}`, 'GET', null);
    if (data && !data.detail) {
      setViajes(data);
    }
  };

  const get_vehiculos = async () => {
    const data = await FetchData('vehicles', 'GET', null);
    if (data && !data.detail) setVehicles(data);
  };

  const get_users = async () => {
    const data = await FetchData('users', 'GET', { limit: 1000 });
    if (data && !data.detail) setUsers(data);
  };

  useEffect(() => {
    if (id) {
      Promise.all([get_orden(), get_viajes(), get_vehiculos(), get_users()]).then(() => {
        setLoading(false);
      });
    }
  }, [id]);

  const handleEstadoChange = async (viajeId: number, nuevoEstado: string) => {
    try {
      const res = await FetchData(`ordenes_manual_viajes/${viajeId}`, 'PUT', {
        estado: nuevoEstado
      });
      if (res?.mensaje) {
        toast.success('Estado actualizado exitosamente');
        get_viajes();
      } else {
        toast.error('Error al actualizar el estado');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleDeleteViaje = async () => {
    if (!selectedViajeId) return;

    try {
      const res = await FetchData(`ordenes_manual_viajes/${selectedViajeId}`, 'DELETE', null);
      if (res?.mensaje) {
        toast.success('Viaje eliminado exitosamente');
        get_viajes();
        setDeleteDialogOpen(false);
        setSelectedViajeId(null);
      } else {
        toast.error('Error al eliminar el viaje');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar el viaje');
    }
  };

  const getEstadoColor = (estado: string) => {
    const estadoInfo = estadosDisponibles.find((e) => e.value === estado);
    return estadoInfo?.color || 'default';
  };

  const getEstadoIcon = (estado: string) => {
    const estadoInfo = estadosDisponibles.find((e) => e.value === estado);
    return estadoInfo?.icon || '❓';
  };

  const getVehiculo = (vehiculoId: number) => {
    return vehicles.find((v: any) => v.id === vehiculoId);
  };

  const getConductor = (userId: number) => {
    return users.find((u: any) => u.id === userId);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-96">
          <div className="text-lg">Cargando...</div>
        </div>
      </Container>
    );
  }

  return (
    <Fragment>
      <Container>
        <div className="card min-w-full mb-6">
          <div className="card-header">
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="card-title">Gestión de Viajes - Orden #{id}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {orden?.descripcion || 'Administra los estados de los viajes de esta orden'}
                </p>
              </div>
              <Button variant="contained" color="primary" onClick={() => navigate('/order-manual')}>
                Regresar
              </Button>
            </div>
          </div>

          {/* Información de la orden */}
          <div className="card-body bg-blue-50 border-b">
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <div className="flex items-center gap-2">
                  <User className="text-blue-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-600">Cliente</p>
                    <p className="font-semibold">{orden?.cliente_nombre || 'N/A'}</p>
                  </div>
                </div>
              </Grid>
              <Grid item xs={12} md={3}>
                <div className="flex items-center gap-2">
                  <MapPin className="text-blue-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-600">Ruta</p>
                    <p className="font-semibold text-sm">
                      {orden?.puerto_salida_nombre || 'N/A'} →{' '}
                      {orden?.puerto_destino_nombre || 'N/A'}
                    </p>
                  </div>
                </div>
              </Grid>
              <Grid item xs={12} md={3}>
                <div className="flex items-center gap-2">
                  <Truck className="text-blue-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-600">Vehículos</p>
                    <p className="font-semibold">{orden?.vehiculos_totales || 0}</p>
                  </div>
                </div>
              </Grid>
              <Grid item xs={12} md={3}>
                <div className="flex items-center gap-2">
                  <Clock className="text-blue-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-600">Fecha / Hora</p>
                    <p className="font-semibold text-sm">
                      {orden?.fecha || 'N/A'} - {orden?.hora_salida || 'N/A'}
                    </p>
                  </div>
                </div>
              </Grid>
            </Grid>
          </div>
        </div>

        {/* Lista de viajes */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold mb-4">Viajes ({viajes.length})</h4>

          {viajes.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500 text-center">
                    No hay viajes registrados para esta orden.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {viajes.map((viaje, index) => {
                const vehiculo = getVehiculo(viaje.vehiculo_id);
                const conductor = getConductor(viaje.user_id);

                return (
                  <Grid item xs={12} md={6} lg={4} key={viaje.id}>
                    <Card className="hover:shadow-lg transition-shadow h-full">
                      <CardContent>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h5 className="font-semibold text-lg">Viaje #{index + 1}</h5>
                            <p className="text-xs text-gray-500">ID: {viaje.id}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip
                              label={`${getEstadoIcon(viaje.estado)} ${viaje.estado}`}
                              color={getEstadoColor(viaje.estado) as any}
                              size="small"
                            />
                            <Tooltip title="Eliminar viaje" arrow>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedViajeId(viaje.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Truck className="text-gray-600" size={18} />
                            <div>
                              <p className="text-xs text-gray-600">Vehículo</p>
                              <p className="font-medium text-sm">
                                {vehiculo?.nombre || 'N/A'} - {vehiculo?.placa || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <User className="text-gray-600" size={18} />
                            <div>
                              <p className="text-xs text-gray-600">Conductor</p>
                              <p className="font-medium text-sm">
                                {conductor ? `${conductor.nombre} ${conductor.apellido}` : 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="text-gray-600" size={18} />
                            <div>
                              <p className="text-xs text-gray-600">Creado</p>
                              <p className="font-medium text-sm">
                                {viaje.created_at
                                  ? new Date(viaje.created_at).toLocaleString('es-ES')
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <FormControl fullWidth size="small">
                          <InputLabel id={`estado-label-${viaje.id}`}>Actualizar Estado</InputLabel>
                          <MuiSelect
                            labelId={`estado-label-${viaje.id}`}
                            value={viaje.estado}
                            label="Actualizar Estado"
                            onChange={(e) => handleEstadoChange(viaje.id, e.target.value)}
                          >
                            {estadosDisponibles.map((estado) => (
                              <MenuItem key={estado.value} value={estado.value}>
                                <span className="flex items-center gap-2">
                                  {estado.icon} {estado.value}
                                </span>
                              </MenuItem>
                            ))}
                          </MuiSelect>
                        </FormControl>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </div>

        {/* Dialog de confirmación para eliminar */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <p>
              ¿Estás seguro de que deseas eliminar este viaje? Esta acción no se puede deshacer.
            </p>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleDeleteViaje} color="error" variant="contained">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Fragment>
  );
};

export { ManageTrips };
