import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card'; // Ajusta según tu librería UI
import AccountRow from '../balance-managment/AccountRow';
import { FetchData } from '@/utils/FetchData';
import { HorizonAiChat } from '@/components/ai/HorizonAiChat';

const EstadoResultadosPage = () => {
  // Estado para fechas (por defecto el mes actual)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState(firstDay);
  const [fechaFin, setFechaFin] = useState(lastDay);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Formateador de moneda
  const currency = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Asegúrate de que esta URL coincida con tu backend
      /* const response = await fetch(
            `http://localhost:8000/contabilidad/reportes/estado-resultados?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
        ); */
      const response = await FetchData(`contabilidad/reportes/estado-resultados`, 'GET', {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
      setData(response);
    } catch (e) {
      console.error(e);
      // Aquí podrías usar un toast para mostrar el error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]); // Recargar automáticamente si cambian las fechas

  // Datos para la IA
  const aiReportData = useMemo(() => {
    if (!data) return null;

    const margenPorcentaje =
      data.total_ingresos > 0 ? ((data.utilidad_neta / data.total_ingresos) * 100).toFixed(2) : 0;

    return {
      report_type: 'estado_resultados',
      period: {
        from: fechaInicio,
        to: fechaFin
      },
      resultados: {
        total_ingresos: data.total_ingresos.toFixed(2),
        total_gastos: data.total_gastos.toFixed(2),
        utilidad_neta: data.utilidad_neta.toFixed(2),
        margen_neto: margenPorcentaje + '%',
        resultado: data.utilidad_neta >= 0 ? 'UTILIDAD' : 'PÉRDIDA'
      },
      ingresos_detalle: data.ingresos.map((ing: any) => ({
        cuenta: `${ing.codigo} - ${ing.nombre}`,
        monto: ing.saldo?.toFixed(2) || 0
      })),
      gastos_detalle: data.gastos.map((gas: any) => ({
        cuenta: `${gas.codigo} - ${gas.nombre}`,
        monto: gas.saldo?.toFixed(2) || 0
      })),
      alertas: [
        ...(data.utilidad_neta < 0
          ? ['🚨 Periodo con PÉRDIDA - Gastos superan ingresos']
          : ['✅ Periodo con UTILIDAD']),
        ...(parseFloat(margenPorcentaje.toString()) < 10 && data.utilidad_neta > 0
          ? ['⚠️ Margen de utilidad bajo (<10%)']
          : []),
        ...(data.total_gastos > data.total_ingresos * 0.9
          ? ['⚠️ Gastos representan más del 90% de los ingresos']
          : [])
      ]
    };
  }, [data, fechaInicio, fechaFin]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* AI Chat */}
      {aiReportData && <HorizonAiChat modules={[]} reportData={aiReportData} />}
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Estado de Resultados</h1>
          <p className="text-sm text-gray-500">Pérdidas y Ganancias del Periodo</p>
        </div>

        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
          >
            Actualizar
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-10">Calculando resultados...</div>}

      {!loading && data && (
        <div className="grid grid-cols-1 gap-6">
          {/* Sección INGRESOS */}
          <Card className="p-5 shadow-sm border-l-4 border-l-green-500">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-semibold text-green-800">Ingresos Operativos</h2>
              <span className="text-xl font-bold text-green-700">
                {currency.format(data.total_ingresos)}
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {data.ingresos.length > 0 ? (
                  data.ingresos.map((nodo: any) => <AccountRow key={nodo.id} node={nodo} />)
                ) : (
                  <tr>
                    <td colSpan={2} className="text-gray-400 py-2 italic">
                      Sin movimientos de ingreso en este periodo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* Sección GASTOS */}
          <Card className="p-5 shadow-sm border-l-4 border-l-red-500">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-semibold text-red-800">Gastos y Costos</h2>
              <span className="text-xl font-bold text-red-700">
                {currency.format(data.total_gastos)}
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {data.gastos.length > 0 ? (
                  data.gastos.map((nodo: any) => <AccountRow key={nodo.id} node={nodo} />)
                ) : (
                  <tr>
                    <td colSpan={2} className="text-gray-400 py-2 italic">
                      Sin movimientos de gasto en este periodo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* RESUMEN FINAL / UTILIDAD */}
          <div className="flex justify-end mt-4">
            <div
              className={`p-6 rounded-lg border shadow-md w-full md:w-1/3 text-right ${data.utilidad_neta >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
            >
              <h3 className="text-gray-600 uppercase text-xs font-bold tracking-wider mb-1">
                Resultado del Ejercicio
              </h3>
              <div
                className={`text-3xl font-extrabold ${data.utilidad_neta >= 0 ? 'text-green-700' : 'text-red-700'}`}
              >
                {data.utilidad_neta >= 0 ? '+' : ''}
                {currency.format(data.utilidad_neta)}
              </div>
              <p className="text-sm mt-2 text-gray-500">
                {data.utilidad_neta >= 0 ? 'Utilidad Neta' : 'Pérdida Neta'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstadoResultadosPage;
