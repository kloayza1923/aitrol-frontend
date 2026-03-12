import React, { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import {
  TextField,
  Box,
  Typography,
  Paper,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Button
} from '@mui/material';
import { FetchData } from '@/utils/FetchData';
import { Download } from '@mui/icons-material';
import * as XLSX from 'xlsx';

type Mayor = {
  id?: number;
  id_asiento?: number;
  id_cuenta?: number;
  fecha?: string;
  descripcion?: string;
  debe?: number;
  haber?: number;
  saldo?: number;
  tipo_mov?: string;
  id_sucursal?: number;
  cuenta_nombre?: string;
  cuenta_codigo?: string;
};

export default function LibroMayorList() {
  const [planCuentas, setPlanCuentas] = useState<any[]>([]);
  const [selectedCuenta, setSelectedCuenta] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [movimientos, setMovimientos] = useState<Mayor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await FetchData('/contabilidad/plan_cuentas', 'GET');
        const items = res.data || [];
        setPlanCuentas(items);
      } catch (err) {
        console.error('Error loading plan cuentas', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (selectedCuenta) {
      loadMovimientos();
    } else {
      setMovimientos([]);
    }
  }, [selectedCuenta, dateFrom, dateTo]);

  const loadMovimientos = async () => {
    setLoading(true);
    try {
      const params: any = { id_cuenta: selectedCuenta };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const queryString = new URLSearchParams(params).toString();
      const res = await FetchData(`/contabilidad/mayor`, 'GET', {
        id_cuenta: parseInt(String(selectedCuenta), 10),
        date_from: dateFrom,
        date_to: dateTo
      });
      setMovimientos(res.data || []);
    } catch (err) {
      console.error('Error loading movimientos', err);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES');
    } catch {
      return dateStr;
    }
  };

  const calcularTotales = () => {
    const totalDebe = movimientos.reduce((sum, mov) => sum + (mov.debe || 0), 0);
    const totalHaber = movimientos.reduce((sum, mov) => sum + (mov.haber || 0), 0);
    const saldoFinal = totalDebe - totalHaber;
    return { totalDebe, totalHaber, saldoFinal };
  };

  const exportToExcel = () => {
    const data = movimientos.map((mov) => ({
      Fecha: formatDate(mov.fecha || ''),
      Asiento: mov.id_asiento,
      Descripción: mov.descripcion,
      Debe: mov.debe || 0,
      Haber: mov.haber || 0,
      Saldo: mov.saldo || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Libro Mayor');
    XLSX.writeFile(wb, `libro-mayor-${selectedCuenta}.xlsx`);
  };

  const { totalDebe, totalHaber, saldoFinal } = calcularTotales();
  const selectedCuentaInfo = planCuentas.find((c) => c.id === selectedCuenta);

  return (
    <Container>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros de Búsqueda
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Cuenta"
              fullWidth
              value={selectedCuenta || ''}
              onChange={(e) => setSelectedCuenta(e.target.value ? Number(e.target.value) : null)}
            >
              <MenuItem value="">Seleccione una cuenta</MenuItem>
              {planCuentas.map((cuenta) => (
                <MenuItem key={cuenta.id} value={cuenta.id}>
                  {cuenta.codigo} - {cuenta.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Fecha Desde"
              type="date"
              fullWidth
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Fecha Hasta"
              type="date"
              fullWidth
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {!selectedCuenta ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Seleccione una cuenta para ver su libro mayor
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Encabezado de la Cuenta T */}
          <Paper sx={{ p: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {selectedCuentaInfo?.codigo} - {selectedCuentaInfo?.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Libro Mayor
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportToExcel}
                disabled={movimientos.length === 0}
              >
                Exportar
              </Button>
            </Box>
          </Paper>

          {/* Tabla estilo libro mayor (Cuenta T) */}
          <Paper sx={{ overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {/* Columnas del DEBE */}
                  <TableCell
                    sx={{ width: '10%', bgcolor: '#1976d2', color: 'white', fontWeight: 700 }}
                  >
                    Fecha
                  </TableCell>
                  <TableCell
                    sx={{ width: '10%', bgcolor: '#1976d2', color: 'white', fontWeight: 700 }}
                  >
                    Asiento
                  </TableCell>
                  <TableCell
                    sx={{ width: '20%', bgcolor: '#1976d2', color: 'white', fontWeight: 700 }}
                  >
                    Descripción
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '10%',
                      bgcolor: '#1976d2',
                      color: 'white',
                      fontWeight: 700,
                      textAlign: 'right'
                    }}
                  >
                    Debe
                  </TableCell>

                  {/* Divisor central */}
                  <TableCell sx={{ width: '1%', bgcolor: '#212121', p: 0 }} />

                  {/* Columnas del HABER */}
                  <TableCell
                    sx={{ width: '10%', bgcolor: '#d32f2f', color: 'white', fontWeight: 700 }}
                  >
                    Fecha
                  </TableCell>
                  <TableCell
                    sx={{ width: '10%', bgcolor: '#d32f2f', color: 'white', fontWeight: 700 }}
                  >
                    Asiento
                  </TableCell>
                  <TableCell
                    sx={{ width: '20%', bgcolor: '#d32f2f', color: 'white', fontWeight: 700 }}
                  >
                    Descripción
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '10%',
                      bgcolor: '#d32f2f',
                      color: 'white',
                      fontWeight: 700,
                      textAlign: 'right'
                    }}
                  >
                    Haber
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <Typography>Cargando...</Typography>
                    </TableCell>
                  </TableRow>
                ) : movimientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">
                        No hay movimientos para esta cuenta
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Generamos filas emparejadas: izquierda = debe, derecha = haber */}
                    {(() => {
                      const debitos = movimientos.filter((m) => (m.debe || 0) > 0);
                      const creditos = movimientos.filter((m) => (m.haber || 0) > 0);
                      const maxRows = Math.max(debitos.length, creditos.length);

                      return Array.from({ length: maxRows }).map((_, idx) => {
                        const debitoRow = debitos[idx];
                        const creditoRow = creditos[idx];

                        return (
                          <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                            {/* DEBE lado izquierdo */}
                            <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                              {debitoRow ? formatDate(debitoRow.fecha || '') : ''}
                            </TableCell>
                            <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                              {debitoRow?.id_asiento || ''}
                            </TableCell>
                            <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                              {debitoRow?.descripcion || ''}
                            </TableCell>
                            <TableCell
                              sx={{
                                textAlign: 'right',
                                fontWeight: 600,
                                borderRight: '2px solid #212121'
                              }}
                            >
                              {debitoRow ? formatCurrency(debitoRow.debe || 0) : ''}
                            </TableCell>

                            {/* Divisor central */}
                            <TableCell sx={{ bgcolor: '#212121', p: 0 }} />

                            {/* HABER lado derecho */}
                            <TableCell sx={{ borderLeft: '1px solid #e0e0e0' }}>
                              {creditoRow ? formatDate(creditoRow.fecha || '') : ''}
                            </TableCell>
                            <TableCell sx={{ borderLeft: '1px solid #e0e0e0' }}>
                              {creditoRow?.id_asiento || ''}
                            </TableCell>
                            <TableCell sx={{ borderLeft: '1px solid #e0e0e0' }}>
                              {creditoRow?.descripcion || ''}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right', fontWeight: 600 }}>
                              {creditoRow ? formatCurrency(creditoRow.haber || 0) : ''}
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}

                    {/* Fila de totales */}
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell
                        colSpan={3}
                        sx={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          borderRight: '1px solid #e0e0e0',
                          color: '#1976d2'
                        }}
                      >
                        TOTAL DEBE
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: '#1976d2',
                          borderRight: '2px solid #212121'
                        }}
                      >
                        {formatCurrency(totalDebe)}
                      </TableCell>

                      <TableCell sx={{ bgcolor: '#212121', p: 0 }} />

                      <TableCell
                        colSpan={3}
                        sx={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          borderLeft: '1px solid #e0e0e0',
                          color: '#d32f2f'
                        }}
                      >
                        TOTAL HABER
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: '#d32f2f'
                        }}
                      >
                        {formatCurrency(totalHaber)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </Paper>

          {/* Resumen del Saldo */}
          <Paper sx={{ p: 3, mt: 3, bgcolor: saldoFinal >= 0 ? '#e8f5e9' : '#ffebee' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="background.paper" gutterBottom>
                Saldo Final
              </Typography>
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{
                  color: saldoFinal >= 0 ? '#2e7d32' : '#c62828'
                }}
              >
                {formatCurrency(Math.abs(saldoFinal))}
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1, color: saldoFinal >= 0 ? '#2e7d32' : '#c62828' }}
              >
                {saldoFinal >= 0 ? 'Deudor' : 'Acreedor'}
              </Typography>
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
}
