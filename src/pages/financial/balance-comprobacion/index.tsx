import React, { useState, useMemo } from 'react';
import { Container } from '@/components/container';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Button,
  Box
} from '@mui/material';
import { FetchData } from '@/utils/FetchData';
import { HorizonAiChat } from '@/components/ai/HorizonAiChat';

export default function BalanceComprobacion() {
  const [data, setData] = useState<any[]>([]);
  const [totales, setTotales] = useState<any>({});
  const [fechas, setFechas] = useState({ from: '', to: '' });

  const loadData = async () => {
    try {
      const q = `?date_from=${fechas.from}&date_to=${fechas.to}`;
      const res = await FetchData(`/contabilidad/reportes/balance-comprobacion`, 'GET', {
        date_from: fechas.from,
        date_to: fechas.to
      });
      setData(res.items);
      setTotales(res.totales);
    } catch (e) {
      console.error(e);
    }
  };

  const currency = (val: number) =>
    new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2 }).format(val || 0);

  // Datos para la IA
  const aiReportData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const cuentasDescuadradas = data.filter(
      (row: any) => Math.abs(row.debe - row.haber - (row.saldo_deudor - row.saldo_acreedor)) > 0.01
    );

    const mayorDeudor = [...data]
      .sort((a: any, b: any) => b.saldo_deudor - a.saldo_deudor)
      .slice(0, 5);
    const mayorAcreedor = [...data]
      .sort((a: any, b: any) => b.saldo_acreedor - a.saldo_acreedor)
      .slice(0, 5);

    return {
      report_type: 'balance_comprobacion',
      period: {
        from: fechas.from,
        to: fechas.to
      },
      totales: {
        total_debe: totales.debe?.toFixed(2) || 0,
        total_haber: totales.haber?.toFixed(2) || 0,
        cuadrado: totales.cuadra,
        diferencia: Math.abs((totales.debe || 0) - (totales.haber || 0)).toFixed(2)
      },
      resumen: {
        total_cuentas: data.length,
        cuentas_descuadradas: cuentasDescuadradas.length
      },
      top_deudores: mayorDeudor.map((c: any) => ({
        cuenta: `${c.codigo} - ${c.nombre}`,
        saldo: c.saldo_deudor?.toFixed(2)
      })),
      top_acreedores: mayorAcreedor.map((c: any) => ({
        cuenta: `${c.codigo} - ${c.nombre}`,
        saldo: c.saldo_acreedor?.toFixed(2)
      })),
      alertas: [
        ...(!totales.cuadra
          ? ['🚨 Balance DESCUADRADO - Debe y Haber no coinciden']
          : ['✅ Balance CUADRADO']),
        ...(cuentasDescuadradas.length > 0
          ? [`⚠️ ${cuentasDescuadradas.length} cuenta(s) con posibles inconsistencias`]
          : [])
      ]
    };
  }, [data, totales, fechas]);

  return (
    <Container>
      {/* AI Chat */}
      {aiReportData && <HorizonAiChat modules={[]} reportData={aiReportData} />}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="end">
          <TextField
            label="Desde"
            type="date"
            InputLabelProps={{ shrink: true }}
            onChange={(e) => setFechas({ ...fechas, from: e.target.value })}
          />
          <TextField
            label="Hasta"
            type="date"
            InputLabelProps={{ shrink: true }}
            onChange={(e) => setFechas({ ...fechas, to: e.target.value })}
          />
          <Button variant="contained" onClick={loadData}>
            Generar
          </Button>
        </Box>
      </Paper>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cuenta</TableCell>
              <TableCell align="right">Sumas Debe</TableCell>
              <TableCell align="right">Sumas Haber</TableCell>
              <TableCell align="right">Saldo Deudor</TableCell>
              <TableCell align="right">Saldo Acreedor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                <TableCell>
                  {row.codigo} - {row.nombre}
                </TableCell>
                <TableCell align="right">{currency(row.debe)}</TableCell>
                <TableCell align="right">{currency(row.haber)}</TableCell>
                <TableCell align="right" sx={{ color: 'green' }}>
                  {row.saldo_deudor > 0 ? currency(row.saldo_deudor) : '-'}
                </TableCell>
                <TableCell align="right" sx={{ color: 'red' }}>
                  {row.saldo_acreedor > 0 ? currency(row.saldo_acreedor) : '-'}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
              <TableCell>TOTALES</TableCell>
              <TableCell align="right">{currency(totales.debe)}</TableCell>
              <TableCell align="right">{currency(totales.haber)}</TableCell>
              <TableCell colSpan={2} align="center">
                {totales.cuadra ? '✅ CUADRADO' : '❌ DESCUADRADO'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
