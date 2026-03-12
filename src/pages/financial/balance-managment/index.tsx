import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card'; // Asumiendo que usas Shadcn o similar
import AccountRow from './AccountRow';
import { FetchData } from '@/utils/FetchData';
import { HorizonAiChat } from '@/components/ai/HorizonAiChat';
// Importa tu hook de API o usa fetch por ahora
// import { useGetBalanceGeneralQuery } from '@/store/api/accountingApi';

const BalanceGeneralPage = () => {
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Reemplazar con tu llamada real a la API
      const response = await FetchData('contabilidad/reportes/balance-general', 'GET', {
        fecha_corte: fechaCorte
      });
      setData(response);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fechaCorte]);

  // Datos para la IA
  const aiReportData = useMemo(() => {
    if (!data) return null;

    const diferencia = (data.total_activo || 0) - (data.total_pasivo_patrimonio || 0);
    const balanceado = Math.abs(diferencia) < 0.01;

    const totalPasivo = data.pasivos?.reduce((sum: number, p: any) => sum + (p.saldo || 0), 0) || 0;
    const totalPatrimonio =
      data.patrimonio?.reduce((sum: number, p: any) => sum + (p.saldo || 0), 0) || 0;

    const ratioEndeudamiento =
      data.total_activo > 0 ? ((totalPasivo / data.total_activo) * 100).toFixed(2) : 0;

    const capitalTrabajo = data.total_activo - totalPasivo;

    return {
      report_type: 'balance_general',
      fecha_corte: fechaCorte,
      totales: {
        total_activo: data.total_activo?.toFixed(2) || 0,
        total_pasivo: totalPasivo.toFixed(2),
        total_patrimonio: totalPatrimonio.toFixed(2),
        total_pasivo_patrimonio: data.total_pasivo_patrimonio?.toFixed(2) || 0,
        diferencia: diferencia.toFixed(2),
        balanceado: balanceado
      },
      ratios: {
        ratio_endeudamiento: ratioEndeudamiento + '%',
        capital_trabajo: capitalTrabajo.toFixed(2),
        proporcion_patrimonio:
          data.total_activo > 0
            ? ((totalPatrimonio / data.total_activo) * 100).toFixed(2) + '%'
            : '0%'
      },
      activos_principales:
        data.activos?.slice(0, 5).map((a: any) => ({
          cuenta: `${a.codigo} - ${a.nombre}`,
          saldo: a.saldo?.toFixed(2) || 0
        })) || [],
      pasivos_principales:
        data.pasivos?.slice(0, 5).map((p: any) => ({
          cuenta: `${p.codigo} - ${p.nombre}`,
          saldo: p.saldo?.toFixed(2) || 0
        })) || [],
      alertas: [
        ...(!balanceado
          ? ['🚨 Balance DESCUADRADO - Activos no igualan Pasivo + Patrimonio']
          : ['✅ Balance CUADRADO']),
        ...(parseFloat(ratioEndeudamiento.toString()) > 60
          ? ['⚠️ Alto nivel de endeudamiento (>60%)']
          : []),
        ...(capitalTrabajo < 0
          ? ['⚠️ Capital de trabajo negativo - Posible problema de liquidez']
          : [])
      ]
    };
  }, [data, fechaCorte]);

  if (!data && loading) return <div>Cargando reporte...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* AI Chat */}
      {aiReportData && <HorizonAiChat modules={[]} reportData={aiReportData} />}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Balance General</h1>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">Fecha de Corte:</label>
          <input
            type="date"
            value={fechaCorte}
            onChange={(e) => setFechaCorte(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna Izquierda: Activos */}
        <Card className="p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-green-700 border-b pb-2">Activos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2">Cuenta</th>
                  <th className="pb-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {data?.activos.map((nodo: any) => <AccountRow key={nodo.id} node={nodo} />)}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold text-lg">
                  <td className="pt-4">Total Activos</td>
                  <td className="pt-4 text-right text-green-700">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      data?.total_activo || 0
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Columna Derecha: Pasivo + Patrimonio */}
        <Card className="p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-red-700 border-b pb-2">
            Pasivo y Patrimonio
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2">Cuenta</th>
                  <th className="pb-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {/* Pasivos */}
                {data?.pasivos.map((nodo: any) => <AccountRow key={nodo.id} node={nodo} />)}

                {/* Patrimonio */}
                {data?.patrimonio.map((nodo: any) => <AccountRow key={nodo.id} node={nodo} />)}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold text-lg">
                  <td className="pt-4">Total Pasivo + Patrimonio</td>
                  <td className="pt-4 text-right text-red-700">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      data?.total_pasivo_patrimonio || 0
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BalanceGeneralPage;
