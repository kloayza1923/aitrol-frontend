import React, { useMemo, useState } from 'react';
import ApexChart from 'react-apexcharts';
import { Container } from '@/components/container';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Stack,
  Divider
} from '@mui/material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ApexOptions } from 'apexcharts';
import { useGetPurchaseVsSalesReportQuery } from '@/store/api/inventory/purchasevssales';
import { HorizonAiChat } from '@/components/ai/HorizonAiChat';

// ApexChart imported directly above

type MockProduct = { name: string; totalPurchases: number; totalSales: number };
type MockSupplier = { name: string; totalSpent: number };
type MockCustomer = { name: string; totalSales: number };

export default function PurchaseVsSalesReport() {
  // Fechas y filtros
  const [from, setFrom] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [to, setTo] = useState<Date | null>(new Date());
  const { data, error, isLoading } = useGetPurchaseVsSalesReportQuery({
    fecha_inicio: new Date(from || '').toISOString().slice(0, 10),
    fecha_fin: to ? new Date(to).toISOString().slice(0, 10) : undefined
  });
  //console.log('Data from API:', data, error, isLoading);
  const apiItems = useMemo(() => data ?? [], [data]);

  // Productos ordenados por ventas (top)
  const topProducts = useMemo<MockProduct[]>(() => {
    if (!apiItems || apiItems.length === 0) return [];
    return apiItems
      .map((p: any) => ({
        name: p.producto_nombre || `#${p.producto_id}`,
        totalPurchases: Number(p.total_comprado || 0),
        totalSales: Number(p.total_vendido || 0),
        proveedores_top: p.proveedores_top || [],
        clientes_top: p.clientes_top || []
      }))
      .sort((a: any, b: any) => b.totalSales - a.totalSales)
      .slice(0, 10);
  }, [apiItems]);

  // Agregar proveedores/top sumando across products
  const topSuppliers = useMemo<MockSupplier[]>(() => {
    const map: Record<
      string,
      { proveedor_id: number; proveedor_nombre: string; total_compras: number }
    > = {};
    apiItems.forEach((p: any) => {
      (p.proveedores_top || []).forEach((s: any) => {
        const id = String(s.proveedor_id);
        if (!map[id]) {
          map[id] = {
            proveedor_id: s.proveedor_id,
            proveedor_nombre: s.proveedor_nombre || 'Sin nombre',
            total_compras: Number(s.total_compras || 0)
          };
        } else {
          map[id].total_compras += Number(s.total_compras || 0);
        }
      });
    });
    return Object.values(map)
      .sort((a, b) => b.total_compras - a.total_compras)
      .slice(0, 10)
      .map((s) => ({ name: s.proveedor_nombre, totalSpent: s.total_compras }));
  }, [apiItems]);

  // Agregar clientes/top sumando across products
  const topCustomers = useMemo<MockCustomer[]>(() => {
    const map: Record<
      string,
      { cliente_id: number; cliente_nombre: string; total_ventas: number }
    > = {};
    apiItems.forEach((p: any) => {
      (p.clientes_top || []).forEach((c: any) => {
        const id = String(c.cliente_id);
        if (!map[id]) {
          map[id] = {
            cliente_id: c.cliente_id,
            cliente_nombre: c.cliente_nombre || 'Sin nombre',
            total_ventas: Number(c.total_ventas || 0)
          };
        } else {
          map[id].total_ventas += Number(c.total_ventas || 0);
        }
      });
    });
    return Object.values(map)
      .sort((a, b) => b.total_ventas - a.total_ventas)
      .slice(0, 10)
      .map((c) => ({ name: c.cliente_nombre, totalSales: c.total_ventas }));
  }, [apiItems]);

  // KPIs calculados a partir del API (fallback a 0 si no hay datos)
  const totalPurchases = data?.[0]?.total_comprado || 0;

  const totalSales = data?.[0]?.total_vendido || 0;

  const difference = totalSales - totalPurchases;
  const aiReportData = useMemo(
    () => ({
      report_type: 'compras_vs_ventas',
      period: {
        from: from?.toLocaleDateString() || 'N/A',
        to: to?.toLocaleDateString() || 'N/A'
      },
      kpis: {
        total_compras: totalPurchases,
        total_ventas: totalSales,
        diferencia: difference,
        margen_porcentaje: totalPurchases > 0 ? ((difference / totalPurchases) * 100).toFixed(2) : 0
      },
      top_productos: topProducts.map((p) => ({
        nombre: p.name,
        compras: p.totalPurchases,
        ventas: p.totalSales,
        margen: p.totalSales - p.totalPurchases,
        margen_porcentaje:
          p.totalPurchases > 0
            ? (((p.totalSales - p.totalPurchases) / p.totalPurchases) * 100).toFixed(2)
            : 0
      })),
      top_proveedores: topSuppliers.map((s) => ({
        nombre: s.name,
        total_gastado: s.totalSpent
      })),
      top_clientes: topCustomers.map((c) => ({
        nombre: c.name,
        total_ventas: c.totalSales
      })),
      alertas: [
        ...(difference < 0 ? ['⚠️ Las compras superan las ventas en el periodo'] : []),
        ...(topProducts.filter((p) => p.totalSales < p.totalPurchases).length > 0
          ? [
              `⚠️ ${topProducts.filter((p) => p.totalSales < p.totalPurchases).length} productos con ventas menores a compras`
            ]
          : [])
      ]
    }),
    [topProducts, topSuppliers, topCustomers, totalPurchases, totalSales, difference, from, to]
  );

  // Gráfica: comparativa compras vs ventas (por producto)
  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: 'bar', height: 320 },
      plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
      xaxis: { categories: topProducts.map((p) => p.name) },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      dataLabels: { enabled: false },
      legend: { position: 'top' }
    }),
    [topProducts]
  );

  const chartSeries: { name: string; data: number[] }[] = useMemo(
    () => [
      { name: 'Compras', data: topProducts.map((p) => p.totalPurchases) },
      { name: 'Ventas', data: topProducts.map((p) => p.totalSales) }
    ],
    [topProducts]
  );

  const exportSummaryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte: Compras vs Ventas', 14, 18);
    doc.setFontSize(11);
    doc.text(
      `Periodo: ${from?.toLocaleDateString() || '-'} - ${to?.toLocaleDateString() || '-'}`,
      14,
      26
    );

    doc.setFontSize(12);
    doc.text('KPIs', 14, 40);
    autoTable(doc, {
      startY: 44,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total Compras', totalPurchases],
        ['Total Ventas', totalSales],
        ['Diferencia', difference]
      ],
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    doc.save(`purchase-vs-sales-summary_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportSummaryExcel = () => {
    const wb = XLSX.utils.book_new();
    const kpiSheet = XLSX.utils.json_to_sheet([
      { Metric: 'Total Compras', Value: totalPurchases },
      { Metric: 'Total Ventas', Value: totalSales },
      { Metric: 'Diferencia', Value: difference }
    ]);
    XLSX.utils.book_append_sheet(wb, kpiSheet, 'Resumen');
    const prodSheet = XLSX.utils.json_to_sheet(
      topProducts.map((p) => ({
        Producto: p.name,
        Compras: p.totalPurchases,
        Ventas: p.totalSales
      }))
    );
    XLSX.utils.book_append_sheet(wb, prodSheet, 'Top Products');
    XLSX.writeFile(wb, `purchase-vs-sales-summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Container>
      <Typography variant="h5" mb={3} fontWeight={700}>
        Reporte — Compras vs Ventas
      </Typography>

      {/* AI Chat con datos del reporte */}
      {!isLoading && data && data.length > 0 && (
        <HorizonAiChat modules={[]} reportData={aiReportData} />
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                label="Desde"
                type="date"
                size="small"
                fullWidth
                value={from ? from.toISOString().slice(0, 10) : ''}
                onChange={(e) => setFrom(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Hasta"
                type="date"
                size="small"
                fullWidth
                value={to ? to.toISOString().slice(0, 10) : ''}
                onChange={(e) => setTo(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="outlined" onClick={exportSummaryExcel}>
                Exportar Excel
              </Button>
              <Button variant="outlined" onClick={exportSummaryPDF}>
                Exportar PDF
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Total Compras</Typography>
              <Typography variant="h6" color="error" fontWeight={700}>
                ${totalPurchases}
              </Typography>
              <Typography variant="caption">Gasto total en compras durante el periodo</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Total Ventas</Typography>
              <Typography variant="h6" color="success.main" fontWeight={700}>
                ${totalSales}
              </Typography>
              <Typography variant="caption">Ingreso total por ventas durante el periodo</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2">Diferencia</Typography>
              <Typography variant="h6" fontWeight={700}>
                ${difference.toLocaleString()}
              </Typography>
              <Typography variant="caption">Ventas - Compras</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2} fontWeight={700}>
                Productos — Compras vs Ventas
              </Typography>
              <ApexChart options={chartOptions} series={chartSeries} type="bar" height={360} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>
                  Proveedores que más aportaron
                </Typography>
                <Divider sx={{ my: 1 }} />
                {(topSuppliers.length ? topSuppliers : []).map((s: MockSupplier) => (
                  <Box
                    key={s.name}
                    sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}
                  >
                    <Typography>{s.name}</Typography>
                    <Typography fontWeight={700}>${s.totalSpent.toLocaleString()}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>
                  Clientes principales
                </Typography>
                <Divider sx={{ my: 1 }} />
                {(topCustomers.length ? topCustomers : []).map((c: MockCustomer) => (
                  <Box
                    key={c.name}
                    sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}
                  >
                    <Typography>{c.name}</Typography>
                    <Typography fontWeight={700}>${c.totalSales.toLocaleString()}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
