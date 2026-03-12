import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Badge as MUIBadge
} from '@mui/material';
import {
  useGetInventoryStatsQuery,
  useGetRecentMovementsQuery,
  useGetLowStockAlertsQuery
} from '@/store/api/inventory/inventoryDashboardApi';
import { KeenIcon } from '@/components';
import { Container } from '@/components/container';
import { HorizonAiChat } from '@/components/ai/HorizonAiChat';

const InventoryDashboardPage = () => {
  // Consumo de hooks de RTK Query
  const { data: stats, isLoading: statsLoading } = useGetInventoryStatsQuery();
  const { data: movements, isLoading: movesLoading } = useGetRecentMovementsQuery({ limit: 5 });
  const { data: lowStock, isLoading: stockLoading } = useGetLowStockAlertsQuery();

  // Datos para la IA
  const aiReportData = useMemo(() => {
    if (!stats || !movements || !lowStock) return null;

    const totalIngresos = movements
      .filter((m: any) => m.tipo === 'INGRESO')
      .reduce((sum: number, m: any) => sum + (m.cantidad || 0), 0);
    const totalSalidas = movements
      .filter((m: any) => m.tipo === 'SALIDA' || m.tipo === 'EGRESO')
      .reduce((sum: number, m: any) => sum + (m.cantidad || 0), 0);
    const rotacion =
      totalIngresos + totalSalidas > 0
        ? ((totalSalidas / (totalIngresos + totalSalidas)) * 100).toFixed(2)
        : 0;

    return {
      report_type: 'inventory_dashboard',
      resumen: {
        valor_total_inventario: stats.summary?.total_value?.toFixed(2) || '0',
        productos_activos: stats.summary?.active_products || 0,
        almacenes: stats.summary?.warehouses_count || 0,
        stock_critico: stats.summary?.low_stock_count || 0,
        porcentaje_rotacion: rotacion + '%'
      },
      categorias: {
        nombres: stats.categories?.labels || [],
        valores: stats.categories?.values || [],
        categoria_dominante: stats.categories?.labels?.[0] || 'N/A'
      },
      alertas_stock:
        lowStock?.slice(0, 10).map((item: any) => ({
          producto: item.nombre,
          stock_actual: item.stock_actual,
          stock_minimo: item.stock_minimo,
          deficit: item.stock_minimo - item.stock_actual
        })) || [],
      movimientos_recientes:
        movements?.map((m: any) => ({
          tipo: m.tipo,
          descripcion: m.descripcion,
          cantidad: m.cantidad,
          fecha: m.fecha
        })) || [],
      alertas: [
        ...(stats.summary?.low_stock_count > 0
          ? [`⚠️ ${stats.summary.low_stock_count} producto(s) con stock crítico`]
          : ['✅ Stock saludable']),
        ...(lowStock?.length > 5 ? ['🚨 Múltiples productos requieren reposición urgente'] : []),
        ...(parseFloat(rotacion.toString()) < 20
          ? ['⚠️ Baja rotación de inventario - Posible sobrestock']
          : [])
      ]
    };
  }, [stats, movements, lowStock]);

  if (statsLoading || movesLoading || stockLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      {/* AI Chat */}
      {aiReportData && <HorizonAiChat modules={[]} reportData={aiReportData} />}

      <Box sx={{ flexGrow: 1, py: 3 }}>
        <Grid container spacing={3}>
          {/* FILA 1: KPIs con MUI Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Valor Total Stock"
              value={`$${stats?.summary?.total_value?.toLocaleString() || '0'}`}
              icon="wallet"
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Stock Crítico"
              value={stats?.summary?.low_stock_count || '0'}
              icon="notification-status"
              color="error"
              trend="Urgente"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Productos Activos"
              value={stats?.summary?.active_products || '0'}
              icon="package"
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Almacenes"
              value={stats?.summary?.warehouses_count || '0'}
              icon="delivery-2"
              color="info"
            />
          </Grid>

          {/* FILA 2: Gráficos de Análisis */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: '100%' }}>
              <Box p={2} borderBottom="1px solid #f1f1f4">
                <Typography variant="h6" fontWeight="bold">
                  Distribución de Existencias
                </Typography>
              </Box>
              <CardContent>
                <Chart
                  type="bar"
                  height={350}
                  series={[{ name: 'Cantidad', data: stats?.categories?.values || [] }]}
                  options={{
                    chart: { toolbar: { show: false } },
                    colors: ['#3E97FF'],
                    plotOptions: { bar: { borderRadius: 5, columnWidth: '30%' } },
                    xaxis: { categories: stats?.categories?.labels || [] }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <Box p={2} borderBottom="1px solid #f1f1f4">
                <Typography variant="h6" fontWeight="bold">
                  Categorías
                </Typography>
              </Box>
              <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
                <Chart
                  type="donut"
                  width={320}
                  series={stats?.categories?.values || [100]}
                  options={{
                    labels: stats?.categories?.labels || ['Sin datos'],
                    legend: { position: 'bottom' },
                    stroke: { show: false },
                    colors: ['#7239EA', '#009EF7', '#50CD89', '#F1416C']
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* FILA 3: Alertas MUI Table y Timeline */}
          <Grid item xs={12} lg={6}>
            <Card>
              <Box
                p={2}
                borderBottom="1px solid #f1f1f4"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6" fontWeight="bold" color="error">
                  ⚠️ Reposición Urgente
                </Typography>
              </Box>
              <TableContainer component={Box} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        Actual
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        Mínimo
                      </TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lowStock?.map((item: any) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontWeight: '600' }}>{item.nombre}</TableCell>
                        <TableCell align="center">
                          <Typography color="error" fontWeight="bold">
                            {item.stock_actual}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'text.secondary' }}>
                          {item.stock_minimo}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Generar Pedido">
                            <IconButton size="small" color="primary">
                              <KeenIcon name="plus" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card>
              <Box p={2} borderBottom="1px solid #f1f1f4">
                <Typography variant="h6" fontWeight="bold">
                  Últimos Movimientos
                </Typography>
              </Box>
              <CardContent sx={{ height: 400, overflowY: 'auto' }}>
                <Box display="flex" flexDirection="column" gap={3}>
                  {movements?.map((move: any) => (
                    <Box key={move.id} display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: move.tipo === 'INGRESO' ? 'success.light' : 'error.light',
                          color: move.tipo === 'INGRESO' ? 'success.main' : 'error.main'
                        }}
                      >
                        <KeenIcon name={move.tipo === 'INGRESO' ? 'bottom-arrow' : 'top-arrow'} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {move.descripcion}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {move.fecha}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={move.tipo === 'INGRESO' ? 'success.main' : 'error.main'}
                      >
                        {move.tipo === 'INGRESO' ? '+' : '-'}
                        {move.cantidad}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

// Componente Interno para Cards de Estadística
const StatCard = ({ title, value, icon, color, trend }: any) => (
  <Card sx={{ borderBottom: 4, borderColor: `${color}.main` }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}.light`
          }}
        >
          <KeenIcon name={icon} className={`text-2xl text-${color}`} />
        </Box>
        {trend && (
          <Typography
            variant="caption"
            sx={{
              bgcolor: 'error.light',
              color: 'error.main',
              px: 1,
              borderRadius: 1,
              fontWeight: 'bold'
            }}
          >
            {trend}
          </Typography>
        )}
      </Box>
      <Typography variant="h4" fontWeight="900">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontWeight="500">
        {title}
      </Typography>
    </CardContent>
  </Card>
);

export default InventoryDashboardPage;
