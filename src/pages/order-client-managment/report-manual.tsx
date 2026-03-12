import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/utils';
import { Autocomplete } from '@mui/material';
import { AuthContext } from '@/auth/providers/JWTProvider';

const OrderManualReportLayout = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;
  const [registros, setRegistros] = useState<any[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<any | null>(null);
  const [viajes, setViajes] = useState<any[]>([]);
  const reactToPrintFn = useReactToPrint({ contentRef });

  const getOrdenesUsuario = async () => {
    try {
      const resp = await FetchData(`ordenes_manual_usuario/${currentUser?.id}`, 'GET', {});
      if (resp?.detail) {
        setRegistros([]);
        toast.error('No se pudieron obtener las órdenes manuales');
        return;
      }
      setRegistros(
        (resp || []).sort(
          (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
      );
    } catch (error) {
      console.error(error);
      toast.error('Error al obtener órdenes manuales');
    }
  };

  const getViajesPorOrden = async (ordenId: number) => {
    try {
      const resp = await FetchData(`ordenes_manual_usuarios_viajes/${ordenId}`, 'GET', {});
      if (resp?.detail) {
        setViajes([]);
        return;
      }
      // resp is expected to be array of { viaje, vehiculo, estado }
      setViajes(resp || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al obtener viajes de la orden');
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    getOrdenesUsuario();
  }, [currentUser]);

  useEffect(() => {
    if (selectedOrden?.id) {
      getViajesPorOrden(selectedOrden.id);
    } else {
      setViajes([]);
    }
  }, [selectedOrden]);

  return (
    <Fragment>
      <Container>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Reporte Viajes - Órdenes por Usuario</h1>
            <p className="text-gray-600">
              Selecciona una orden para ver los viajes y estados de los conductores
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Autocomplete
              options={registros}
              getOptionLabel={(option: any) =>
                `${option.descripcion || ''} - ${option.fecha || ''} - #${option.id}`
              }
              onChange={(e, newVal) => setSelectedOrden(newVal)}
              renderInput={(params) => (
                <div ref={params.InputProps.ref}>
                  <input
                    {...params.inputProps}
                    className="border border-gray-300 rounded p-2 w-full"
                    placeholder="Seleccione una orden manual"
                  />
                </div>
              )}
              renderOption={(props, option: any) => (
                <li
                  {...props}
                  key={option.id}
                >{`${option.descripcion || ''} - ${option.fecha || ''} - #${option.id}`}</li>
              )}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              noOptionsText="No hay órdenes"
              disablePortal
            />

            {selectedOrden && (
              <div className="bg-white shadow-md rounded-lg p-4" ref={contentRef}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">ORDEN MANUAL #{selectedOrden.id}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                      onClick={() => reactToPrintFn()}
                    >
                      Imprimir
                    </button>
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded"
                      onClick={() => {
                        try {
                          const url =
                            import.meta.env.VITE_APP_API_URL +
                            '/ordenes_manual_viajes_excel/' +
                            selectedOrden.id;
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', 'orden_viaje.xlsx');
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success('Descargando Excel...');
                        } catch (err) {
                          console.error(err);
                          toast.error('Error al iniciar descarga');
                        }
                      }}
                    >
                      Excel
                    </button>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold">Cliente:</p>
                    <p>{selectedOrden.cliente_nombre || selectedOrden.cliente_id}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Fecha:</p>
                    <p>{selectedOrden.fecha}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Ruta:</p>
                    <p>
                      {selectedOrden.puerto_salida_nombre || ''} -{' '}
                      {selectedOrden.puerto_destino_nombre || ''}
                    </p>
                  </div>
                </div>

                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="border px-4 py-2">#</th>
                      <th className="border px-4 py-2">Vehículo</th>
                      <th className="border px-4 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viajes.map((item, idx) => {
                      const viaje = item.viaje || item;
                      const vehiculoNombre =
                        item.vehiculo || viaje.vehiculo_nombre || viaje.placa || '-';
                      const conductorId =
                        viaje.conductor_id || viaje.user_id || viaje.conductor || '-';
                      const estado = item.estado || viaje.estado || '-';
                      return (
                        <tr key={idx} className="odd:bg-gray-50">
                          <td className="border px-4 py-2 text-center">{idx + 1}</td>
                          <td className="border px-4 py-2">{vehiculoNombre}</td>
                          <td className="border px-4 py-2">{estado}</td>
                        </tr>
                      );
                    })}
                    {viajes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="border px-4 py-4 text-center text-gray-500">
                          No hay viajes para esta orden
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="mt-4 flex justify-center">
                  <img
                    src={toAbsoluteUrl('/media/app/grain_logo.webp')}
                    alt="Logo"
                    className="h-10"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { OrderManualReportLayout };
