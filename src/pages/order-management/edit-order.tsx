import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import {
  current_user,
  get_count_travel,
  get_observation_order_data,
  get_order_travels,
  get_orders_status,
  get_orders_vehicles,
  update_order_to_end
} from '@/lib/api';
import StepLabel from '@mui/material/StepLabel';
import Step0 from '@/components/ui/Step';
import { SeparatorHorizontal } from 'lucide-react';
import { Separator } from '@radix-ui/react-select';
import {
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Divider
} from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'sonner';
// Componente principal
const EditOrder = () => {
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState<any[]>([]);
  const [order_id, setOrder_id] = useState<number>(0);
  const [countTravels, setCountTravels] = useState<any[]>([]);
  const [orderVehicles, setOrderVehicles] = useState<any[]>([]);
  const [expandedVehicles, setExpandedVehicles] = useState<{ [key: number]: boolean }>({});
  const [observations, setObservations] = useState([]);
  const toggleVehicle = (vehiculo_id: number) => {
    setExpandedVehicles((prev) => ({
      ...prev,
      [vehiculo_id]: !prev[vehiculo_id]
    }));
  };
  /* ordenes_observaciones */
  const get_order_data = async (id: number | string) => {
    const numericId = Number(id);
    if (!numericId || isNaN(numericId)) {
      alert('No se ha encontrado la orden');
      return;
    }
    const get_order_vehiclesdata = await get_orders_vehicles(numericId);
    console.log(get_order_vehiclesdata, 'get_order_vehiclesdata');
    get_order_vehiclesdata.map((vehicle: any) => {
      current_order_travel(numericId, vehicle.conductor_id);
    });
    setOrderVehicles(get_order_vehiclesdata);
  };
  const update_order_end = async (order_id: any) => {
    const confirm = window.confirm('¿Está seguro de que desea finalizar la orden?');
    if (confirm) {
      const data = await update_order_to_end(order_id);
      console.log(data, 'data from api');
    }
  };
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  const get_steps = async (id: number | string) => {
    const numericId = Number(id);
    if (!numericId || isNaN(numericId)) {
      console.error('get_steps: id inválido', id);
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchedSteps: any[] = await get_orders_status();
    //console.log(fetchedSteps.sort((a, b) => a.orden - b.orden));
    setSteps(fetchedSteps);
    get_order_data(numericId);
    const observation = await get_observation_order_data_response(numericId, 1);
    if (observation.length > 0) {
      setObservations(observation);
    } else {
      setObservations([]);
    }
    //get_count_travels(id);
  };
  const current_order_travel = async (id: any, conductor_id: any) => {
    const data = await get_order_travels(id, conductor_id);
    /*     const observation = await get_observation_order_data_response(id, conductor_id);
    if (observation.length > 0) {
      data.observaciones = observation;
    } else {
      data.observaciones = [];
    } */
    if (data.detail === 'Orden de viaje no encontrada') {
      setOrderVehicles((prevState: any) => {
        const newOrderVehicles = prevState.map((vehicle: any) => {
          if (vehicle.conductor_id === conductor_id) {
            return {
              ...vehicle,
              ordenes_viaje: []
            };
          }
          return vehicle;
        });
        return newOrderVehicles;
      });
    } else {
      setOrderVehicles((prevState: any) => {
        const newOrderVehicles = prevState.map((vehicle: any) => {
          if (vehicle.conductor_id === conductor_id) {
            return {
              ...vehicle,
              ordenes_viaje: data
            };
          }
          return vehicle;
        });
        return newOrderVehicles;
      });
      get_count_travels(id, conductor_id);
    }
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
  const get_count_travels = async (data_id: any, conductor_id?: any) => {
    console.log('get_count_travels', data_id, conductor_id);
    if (!data_id || !conductor_id) {
      console.error('No se ha proporcionado data_id o conductor_id');
      return;
    }
    const data = await get_count_travel(data_id, conductor_id);
    console.log(data, 'data from get_ordenes_contar_vueltas', data_id, conductor_id);
    if (data.detail === 'No se encontraron viajes para esta orden') {
      setCountTravels([]);
    }
    let cdata = {
      id: data_id,
      conductor_id: conductor_id,
      count: data.vueltas
    };
    //const observation = get_observation_order_data_response(data_id, conductor_id)
    setCountTravels((prevState: any) => {
      const existingIndex = prevState.findIndex(
        (item: any) => item.id === cdata.id && item.conductor_id === cdata.conductor_id
      );
      //console.log('existingIndex', existingIndex, cdata);
      if (existingIndex !== -1) {
        const updatedState = [...prevState];
        updatedState[existingIndex] = cdata;
        return updatedState;
      }
      return [...prevState, cdata];
    });
  };
  const get_observation_order_data_response = async (id: number, conductor_id: number) => {
    try {
      const response = await get_observation_order_data(id, conductor_id);
      if (response.detail === 'No se encontraron observaciones para esta orden') {
        console.error('No se encontraron observaciones para esta orden');
        return [];
      }
      console.log(response, 'response from get_observation_order_data');
      return response;
    } catch (error) {
      console.error('Error al obtener las observaciones de la orden:', error);
      return [];
    }
  };

  // --- Schema de validación para Step0 (asumimos que cada travel tiene al menos 'nombre')
  const travelSchema = Yup.object().shape({
    nombre: Yup.string().required('El nombre del viaje es requerido')
    // Puedes añadir otras validaciones según la estructura real de travel
    // por ejemplo: fecha, destino, etc.
  });

  const validateAndContinue = async (travel: any) => {
    try {
      //await travelSchema.validate(travel, { abortEarly: false });
      // Si pasa validación, continuar al siguiente paso
      handleNext();
    } catch (validationError: any) {
      if (validationError.inner && validationError.inner.length) {
        const messages = validationError.inner.map((e: any) => e.message).join('\n');
        toast.error(messages);
      } else {
        toast.error(validationError.message || 'Errores en el formulario');
      }
    }
  };

  useEffect(() => {
    const url = window.location.href;
    const ids = url.split('/').pop();
    const parsed = Number(ids) || 0;
    setOrder_id(parsed);
    get_steps(parsed);
  }, []);

  return (
    <Fragment>
      <Container>
        <h1 className="text-2xl font-bold mb-4">Editar orden</h1>
        <div className="flex flex-row justify-between items-center mb-4 overflow-x-auto max-w-full">
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              navigate('/order-management');
            }}
            className="mb-4"
          >
            Volver a la lista de ordenes
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const url = window.location.href;
              const ids = url.split('/').pop();
              const parsed = Number(ids) || 0;
              console.log('Refrescando orden con ID:', parsed);
              setOrder_id(parsed);
              get_steps(parsed);
            }}
            className="mb-4"
          >
            Refrescar orden
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              update_order_end(order_id);
            }}
            className="mb-4"
          >
            Finalizar orden
          </Button>
        </div>
        <SeparatorHorizontal className="my-4" size={1} color="gray" />
        {!loading && (
          <div className="space-y-4">
            {orderVehicles.map((vehicle: any) => {
              const isOpen = expandedVehicles[vehicle.vehiculo_id];
              return (
                <Paper key={vehicle.vehiculo_id} elevation={3} className="p-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleVehicle(vehicle.vehiculo_id)}
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        🚗 Placa: {vehicle.placa || 'Sin placa'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Conductor: {vehicle.conductor || 'Sin conductor'}
                      </p>
                    </div>
                    <Button size="small" variant="outlined">
                      {isOpen ? 'Ocultar' : 'Ver Detalles'}
                    </Button>
                  </div>

                  {isOpen && vehicle.ordenes_viaje?.length > 0 && (
                    <Grid container spacing={3} className="mt-4">
                      {vehicle.ordenes_viaje.map((travel: any, index: number) => (
                        <Grid item xs={12} md={6} lg={4} key={travel.id}>
                          <Card variant="outlined" className="h-full">
                            <CardContent>
                              <Typography variant="subtitle1" className="font-bold mb-2">
                                {travel.nombre}
                              </Typography>
                              <Divider className="mb-2" />
                              {/* Info breve */}
                              <Typography variant="body2" className="text-gray-600 mb-3">
                                ID: {travel.id}
                              </Typography>
                              {/* Aquí Step0 renderiza el flujo del paso; interceptamos onContinue para validar con Yup */}
                              <Step0
                                activeStep={activeStep}
                                steps={steps}
                                data={travel}
                                index={index}
                                data_id={travel.id}
                                id={order_id}
                                disabled={
                                  index !==
                                  countTravels.find(
                                    (item: any) =>
                                      item.id === order_id &&
                                      item.conductor_id === vehicle.conductor_id
                                  )?.count
                                }
                                onContinue={() => validateAndContinue(travel)}
                                user_id={vehicle.user_id}
                                vehiculo_id={vehicle.vehiculo_id}
                                travel_id={travel.id}
                                travel_data={travel}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>
              );
            })}
          </div>
        )}

        {!loading && observations.length > 0 && (
          <div className="mt-8 max-w-3xl align-middle">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Observaciones</h2>
            <ul className="border-l-2 border-gray-300 pl-4 space-y-6">
              {observations.map((observation: any, index: number) => (
                <li key={observation.id} className="relative">
                  {/* Ramita del árbol */}
                  <span className="absolute -left-[9px] top-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow" />

                  {/* Contenido */}
                  <div className="ml-2 p-4 bg-white border border-gray-200 rounded-md shadow-sm">
                    <p className="text-gray-800 mb-1">{observation.observacion}</p>
                    <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:justify-between">
                      <span>👤 {observation.nombre || 'Desconocido'}</span>
                      <span>📅 {new Date(observation.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Cargando ordenes...</p>
          </div>
        )}
        {orderVehicles.length === 0 && !loading && (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">No se encontraron vehículos para esta orden.</p>
          </div>
        )}
      </Container>
    </Fragment>
  );
};

export { EditOrder };
