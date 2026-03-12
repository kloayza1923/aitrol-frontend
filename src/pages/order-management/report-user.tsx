import { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { toast } from 'sonner';
import { useLayout } from '@/providers';
import { FetchData } from '@/utils/FetchData';
import {
  Box,
  Button,
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
  CircularProgress,
  Backdrop,
  Autocomplete
} from '@mui/material';
import Chart from 'react-apexcharts';
import * as XLSX from 'xlsx';

const ReportUser = () => {
  useLayout();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chartOptions, setChartOptions] = useState<any>({});
  const [chartSeries, setChartSeries] = useState<any[]>([]);

  const fetchReport = async () => {
    if (!userId) return toast.error('Ingrese el ID del usuario');
    setLoading(true);
    try {
      const resp = await FetchData('ordenes_por_conductor/' + userId, 'GET', {});
      if (resp && Array.isArray(resp)) {
        setReport(resp);
        // actualizar gráfico
        const categories = resp.map((r: any) => r.mes);
        const viajes = resp.map((r: any) => Number(r.total_viajes || 0));
        const pesos = resp.map((r: any) => Number(r.peso_total || 0));
        setChartOptions({
          chart: { id: 'report-chart' },
          xaxis: { categories },
          yaxis: [
            { title: { text: 'Total viajes' } },
            { opposite: true, title: { text: 'Peso total' } }
          ],
          dataLabels: { enabled: false }
        });
        setChartSeries([
          { name: 'Total viajes', type: 'column', data: viajes },
          { name: 'Peso total', type: 'line', data: pesos }
        ]);
      } else {
        setReport([]);
        toast.error('No se obtuvo información del servidor');
      }
    } catch (e) {
      toast.error('Error al obtener el reporte');
    }
    setLoading(false);
  };

  const fetchUsers = async (search = '') => {
    try {
      const resp = await FetchData('conductores_lista', 'GET', {});
      console.log('Usuarios obtenidos:', resp);
      if (resp && Array.isArray(resp)) setUsers(resp);
    } catch (err) {
      // no bloquear la UI si falla
    }
  };

  const handleExportCSV = () => {
    if (!report || report.length === 0) return toast.error('No hay datos para exportar');
    const header = ['mes', 'total_viajes', 'peso_total'];
    const rows = report.map((r: any) => [r.mes, r.total_viajes, r.peso_total]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_usuario_${userId || 'unknown'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    if (!report || report.length === 0) return toast.error('No hay datos para exportar');
    const ws = XLSX.utils.json_to_sheet(report);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte_usuario_${userId || 'unknown'}.xlsx`);
  };

  useEffect(() => {
    // obtener lista de usuarios para selector
    fetchUsers();
  }, []);

  return (
    <Fragment>
      <Container>
        <Grid container spacing={2} alignItems="center" className="mb-4">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" component="h2" gutterBottom>
              Reporte por usuario
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Ingresa el ID del usuario (conductor) para obtener el resumen mensual
            </Typography>
          </Grid>

          <Grid item xs={12} md={6} className="text-right">
            <Button
              variant="contained"
              color="primary"
              onClick={fetchReport}
              sx={{ backgroundColor: '#0D0E12', color: '#fff', borderRadius: 2 }}
            >
              Consultar
            </Button>
          </Grid>
        </Grid>

        <Paper elevation={0} className="p-4 mb-4">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={users}
                getOptionLabel={(option: any) => `${option.nombre || ''} ${option.apellido || ''}`}
                onChange={(_: any, value: any) => {
                  if (value && value.id) {
                    setUserId(String(value.id));
                    // realizar la consulta inmediatamente al seleccionar
                    setTimeout(() => fetchReport(), 10);
                  } else {
                    setUserId('');
                    setReport([]);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Conductor / Usuario" size="small" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                label="ID usuario (manual)"
                placeholder="Ej: 123"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={8} className="text-right">
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={fetchReport}>
                  Consultar
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setUserId('');
                    setReport([]);
                    setChartSeries([]);
                    setChartOptions({});
                  }}
                >
                  Limpiar
                </Button>
                <Button variant="outlined" onClick={handleExportCSV}>
                  Exportar CSV
                </Button>
                <Button variant="outlined" onClick={handleExportXLSX}>
                  Exportar Excel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {loading && (
          <Backdrop open={loading} sx={{ color: '#fff', zIndex: 1000 }}>
            <CircularProgress color="inherit" />
          </Backdrop>
        )}

        {report && report.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Chart options={chartOptions} series={chartSeries} type="line" height={300} />
          </Box>
        )}

        <TableContainer component={Paper} elevation={1} sx={{ mt: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mes</TableCell>
                <TableCell align="right">Total viajes</TableCell>
                <TableCell align="right">Peso total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No hay datos. Ejecuta la consulta.
                  </TableCell>
                </TableRow>
              )}
              {report.map((r: any, idx: number) => (
                <TableRow key={idx} hover>
                  <TableCell>{r.mes}</TableCell>
                  <TableCell align="right">{r.total_viajes}</TableCell>
                  <TableCell align="right">{Number(r.peso_total || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Fragment>
  );
};

export { ReportUser };
