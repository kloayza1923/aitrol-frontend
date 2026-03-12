import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/utils';
import { Autocomplete } from '@mui/material';

// Componente principal
const OrderReportLayout = () => {
  const location = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [registros, setRegistros] = useState([]);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const reactToPrintFn = useReactToPrint({ contentRef });
  const [registrosAnteriores, setRegistrosAnteriores] = useState([]);
  const [orden, setOrden] = useState({});
  const [units, setUnits] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  // Helper to determine background color based on status
  const getStatusBgColor = (status) => {
    if (status === 'TRANSITO CARGADO PLANTA') return 'bg-orange-200';
    if (status === 'PLANTA') return 'bg-orange-200';
    return '';
  };
  const get_ordenes_viajes = async (id) => {
    const fetch_data = await FetchData('ordenes_viajes_reporte/' + id, 'GET', {});
    const response = await fetch_data;
    console.log(response);
    if (response.detail) {
      setUnits([]);
      return;
    }
    setUnits(response);
  };
  const get_orden_data = async (id) => {
    const data = await FetchData('ordenes/' + id, 'GET', null); // Obtener vehículo desde el backend
    const response = await data;
    console.log(response);
    if (response.detail) {
      setOrden({});
      return;
    }
    setOrden(response);
  };
  const get_ordenes_viajes_ubicacion = async (id) => {
    const fetch_data = await FetchData('ordenes_viajes_ubicacion/' + id, 'GET', {});
    const response = await fetch_data;
    console.log(response);
    if (response.detail) {
      setStatusCounts([]);
      return;
    }
    const resp = response.filter((item) => item.estado !== 'Finalizado');
    setStatusCounts(resp);
  };
  useEffect(() => {
    const get_data = async () => {
      const response = await FetchData('ordenes', 'GET', {});
      if (response) {
        setRegistros(response);
        setRegistrosAnteriores(response);
      } else {
        toast.error('Error al obtener los datos');
        setRegistros([]);
      }
    };
    get_data();
  }, []);
  useEffect(() => {
    const id = selectedOrden ? selectedOrden.id : null;
    if (id) {
      get_ordenes_viajes(id);
      get_ordenes_viajes_ubicacion(id);
      get_orden_data(id);
    }
  }, [selectedOrden]);
  return (
    <Fragment>
      <Container>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Reporte de Ordenes</h1>
            <p className="text-gray-600">Detalles de las ordenes realizadas</p>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-lg font-semibold">Ordenes</p>
            {/*  <select
              className="border border-gray-300 rounded p-2"
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedOrden = registros.find((orden) => orden.id === parseInt(selectedId));
                setSelectedOrden(selectedOrden);
              }}
            >
              <option value="">Seleccione una orden</option>
              {registros.map((orden) => (
                <option key={orden.id} value={orden.id}>
                  {orden.descripcion} - {orden.fecha} -# {orden.id}
                </option>
              ))}
            </select> */}
            <Autocomplete
              options={registrosAnteriores}
              getOptionLabel={(option) =>
                `${option?.descripcion} - ${option?.fecha} -# ${option?.id}`
              }
              onChange={(event, newValue) => {
                setSelectedOrden(newValue);
              }}
              renderInput={(params) => (
                <div ref={params.InputProps.ref}>
                  <input
                    {...params.inputProps}
                    className="border border-gray-300 rounded p-2 w-full"
                    placeholder="Seleccione una orden"
                  />
                </div>
              )}
              renderOption={(props, option) => (
                <li {...props} key={option?.id}>
                  {`${option?.descripcion} - ${option?.fecha} -# ${option?.id}`}
                </li>
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText="No hay opciones"
              disablePortal
            />
            {selectedOrden && (
              <div className="max-w-10xl mx-aut p-4 font-sans">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold">ORDEN DE VIAJE</h1>
                  <div className="flex items-center">
                    <h3 className="text-lg font-bold mr-2">N°: {selectedOrden.id}</h3>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      onClick={() => {
                        reactToPrintFn();
                      }}
                    >
                      Imprimir
                    </button>
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
                      onClick={() => {
                        /* const url = 'https://api.grainlogistics.net/ordenes_viajes_excel/' + selectedOrden.id; */
                        const url =
                          import.meta.env.VITE_APP_API_URL +
                          '/ordenes_viajes_excel/' +
                          selectedOrden.id;
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'orden_viaje.xlsx');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        toast.success('Descargando Excel...');
                      }}
                    >
                      Excel
                    </button>
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
                      onClick={() => {
                        //const url = 'https://api.grainlogistics.net/ordenes_guias/' + selectedOrden.id;
                        const url =
                          import.meta.env.VITE_APP_API_URL + '/ordenes_guias/' + selectedOrden.id;
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'orden_viaje.zip');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        toast.success('Descargando guía...');
                      }}
                    >
                      Descargar Guías
                    </button>
                  </div>
                </div>
                <div className="bg-white shadow-md rounded-lg p-4" ref={contentRef}>
                  <div className="flex flex-col md:flex-row justify-between mb-4">
                    {/* Location Table */}
                    <div className="w-full md:w-1/3">
                      <table className="w-full border-collapse border">
                        <thead>
                          <tr>
                            <th className="bg-green-100 border px-4 py-2 text-center">UBICACIÓN</th>
                            <th className="bg-green-100 border px-4 py-2 text-center">
                              CANT. UNIDADES
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* {Object.entries(statusCounts).map(([location, count]) => (
                           <tr key={location}>
                             <td className="border px-4 py-1 bg-green-50">{location}</td>
                             <td className="border px-4 py-1 text-center">{count}</td>
                           </tr>
                         ))} */}
                          {statusCounts.map((location) => (
                            <tr key={location.id}>
                              <td className="border px-4 py-1 bg-green-50">{location.estado}</td>
                              <td className="border px-4 py-1 text-center">{location.unidades}</td>
                            </tr>
                          ))}
                          <tr className="font-bold">
                            <td className="border px-4 py-1 bg-green-100">TOTAL UNIDADES</td>
                            <td className="border px-4 py-1 text-center bg-green-100">
                              {units.length}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Truck Image */}
                    <div className="flex justify-center items-center my-4 md:my-0">
                      <div className="w-full md:w-64">
                        <img
                          src={toAbsoluteUrl('/media/app/truck.webp')}
                          alt="Truck Icon"
                          className="mx-auto"
                        />
                      </div>
                    </div>

                    {/* Company Info */}
                    <div className="w-full md:w-1/3">
                      <table className="w-full border-collapse border">
                        <tbody>
                          <tr>
                            <td
                              colSpan={1}
                              className="border px-4 py-2 bg-white font-bold text-center"
                            >
                              FLOTA GRAIN LOGISTICS S.A.
                            </td>
                          </tr>
                          <tr>
                            <td className="border px-4 py-1">CLIENTE: {orden.cliente}</td>
                          </tr>
                          <tr>
                            <td className="border px-4 py-1">
                              FECHA: {new Date().toLocaleDateString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="border px-4 py-1">
                              HORA: {new Date().toLocaleTimeString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="border px-4 py-1">
                              RUTA: {orden.puerto_salida_nombre} - {orden.puerto_destino_nombre}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Units Table */}
                  <table className="w-full border-collapse border">
                    <thead>
                      <tr className="bg-black text-white">
                        <th className="border px-4 py-2 w-16">NO.</th>
                        <th className="border px-4 py-2">PLACA</th>
                        <th className="border px-4 py-2">CONDUCTOR</th>
                        <th className="border px-4 py-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((unit, index) => (
                        <tr key={unit.id} className={getStatusBgColor(unit.status)}>
                          <td className="border px-4 py-1 text-center bg-green-800 text-white">
                            {index + 1}
                          </td>
                          <td className="border px-4 py-1">{unit.placa}</td>
                          <td className="border px-4 py-1">{unit.conductor_nombre}</td>
                          <td className="border px-4 py-1">{unit.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Logo */}
                  <div className="mt-4 flex justify-center">
                    <img
                      src={toAbsoluteUrl('/media/app/grain_logo.webp')}
                      alt="GRAIN LOGISTICS Logo"
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { OrderReportLayout };
