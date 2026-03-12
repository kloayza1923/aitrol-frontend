import { Fragment, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container } from '@/components/container';
import { toAbsoluteUrl } from '@/utils';
import { FetchData } from '@/utils/FetchData';
import { useReactToPrint } from 'react-to-print';
const ShowManagementOrder = () => {
  const location = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const reactToPrintFn = useReactToPrint({ contentRef });
  const [orden, setOrden] = useState({});
  const [units, setUnits] = useState([
    { id: 1, placa: 'GBO-4707', conductor: 'EDDY JAVIER MORAN BERNARDINO', estado: 'PUERTO' },
    { id: 2, placa: 'GBP-7646', conductor: 'PABLO ANDRADE', estado: 'TRANSITO CARGADO' },
    {
      id: 3,
      placa: 'GBP-8012',
      conductor: 'CESAR ENRIQUE MACIAS VELEZ',
      estado: 'TRANSITO CARGADO'
    },
    { id: 4, placa: 'GSO-5104', conductor: 'ADONIS GILMAR VILLACIS SABANDO', estado: 'PUERTO' },
    { id: 5, placa: 'GSQ-9492', conductor: 'LEONARDO ENRIQUE ANDRADE SABANDO', estado: 'PUERTO' },
    {
      id: 6,
      placa: 'GBP-9792',
      conductor: 'CRISTOBAL FRANCISCO CRUZ GONZALES',
      estado: 'TRANSITO CARGADO'
    },
    {
      id: 7,
      placa: 'JAK-0357',
      conductor: 'ITER ALEXANDER DELGADO ZAMBRANO',
      estado: 'TRANSITO PUERTO'
    },
    {
      id: 8,
      placa: 'GBP7603',
      conductor: 'RUBÉN AGUSTÍN POZO VILLACIS',
      estado: 'TRANSITO CARGADO PLANTA'
    },
    { id: 9, placa: 'GBQ-1038', conductor: 'AQUILES NAVARRETE', estado: 'TRANSITO CARGADO PLANTA' },
    { id: 10, placa: 'OBX-0480', conductor: 'PETER ASIQUIMBAY', estado: 'PUERTO' },
    { id: 11, placa: 'GBN-2563', conductor: 'JACKSON CACERES', estado: 'TRANSITO PUERTO' },
    { id: 12, placa: 'GOY-0197', conductor: 'MARIO POZO', estado: 'PUERTO' },
    { id: 13, placa: 'PBC-5671', conductor: 'YERZON XAVIER PANEZO CHEME', estado: 'PLANTA' }
  ]);

  const estadoCountsdata = {
    PUERTO: 5,
    'TRANSITO CARGADO': 3,
    'TRANSITO CARGADO PLANTA': 2,
    PLANTA: 1,
    'TRANSITO PUERTO': 2
  };
  const [statusCounts, setStatusCounts] = useState([]);
  // Helper to determine background color based on status
  const getStatusBgColor = (status) => {
    if (status === 'TRANSITO CARGADO PLANTA') return 'bg-orange-200';
    if (status === 'PLANTA') return 'bg-orange-200';
    return '';
  };
  const get_ordenes_viajes = async () => {
    const id = window.location.href.split('/').pop();
    const fetch_data = await FetchData('ordenes_viajes_reporte/' + id, 'GET', {});
    const response = await fetch_data;
    console.log(response);
    if (response.detail) {
      setUnits([]);
      return;
    }
    setUnits(response);
  };
  const get_orden_data = async () => {
    const id = window.location.href.split('/').pop();
    const data = await FetchData('ordenes/' + id, 'GET', null); // Obtener vehículo desde el backend
    const response = await data;
    console.log(response);
    if (response.detail) {
      setOrden({});
      return;
    }
    setOrden(response);
  };
  const get_ordenes_viajes_ubicacion = async () => {
    const id = window.location.href.split('/').pop();
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
    get_ordenes_viajes();
    get_ordenes_viajes_ubicacion();
    get_orden_data();
  }, []);
  return (
    <Fragment>
      <Container>
        <div className="max-w-10xl mx-aut p-4 font-sans">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">ORDEN DE VIAJE</h1>
            <div className="flex items-center">
              <h3 className="text-lg font-bold mr-2">
                N°: {window.location.href.split('/').pop()}
              </h3>
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
                  location('/order-management');
                }}
              >
                Regresar
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
                      <th className="bg-green-100 border px-4 py-2 text-center">CANT. UNIDADES</th>
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
                      <td className="border px-4 py-1 text-center bg-green-100">{units.length}</td>
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
                      <td colSpan={1} className="border px-4 py-2 bg-white font-bold text-center">
                        FLOTA GRAIN LOGISTICS S.A.
                      </td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-1">CLIENTE: {orden.cliente}</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-1">FECHA: {orden.fecha}</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-1">HORA: {orden.hora_salida}</td>
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
      </Container>
    </Fragment>
  );
};
export default ShowManagementOrder;
