import React, { useMemo } from 'react';
import ApexChart from 'react-apexcharts';
import { Container } from '@/components/container';
import { Card, CardContent, Grid, Typography, Box, Divider } from '@mui/material';
import type { ApexOptions } from 'apexcharts';
import { useGetFinSummaryQuery } from '@/store/api/fin/reportApi';

export default function ClientsProvidersChart() {
  const { data: summary, isLoading } = useGetFinSummaryQuery({ limit: 100 });

  const clients = useMemo(() => {
    if (!summary) return [];
    // summary.clientes is an array of records with cliente and saldo
    return (summary.clientes || [])
      .map((c: any) => ({
        name: (c.cliente && c.cliente.nombre) || c.cliente_nombre || `#${c.id_cliente || c.id}`,
        saldo: Number(c.saldo || 0)
      }))
      .sort((a: any, b: any) => b.saldo - a.saldo)
      .slice(0, 15);
  }, [summary]);

  const providers = useMemo(() => {
    if (!summary) return [];
    return (summary.proveedores || [])
      .map((p: any) => ({
        name:
          (p.proveedor && (p.proveedor.nombre || p.proveedor.razon_social)) ||
          p.proveedor_nombre ||
          `#${p.id_proveedor || p.id}`,
        saldo: Number(p.saldo || 0)
      }))
      .sort((a: any, b: any) => b.saldo - a.saldo)
      .slice(0, 15);
  }, [summary]);

  const clientsOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: 'bar', height: 360 },
      plotOptions: { bar: { horizontal: true } },
      xaxis: { categories: clients.map((c) => c.name) },
      dataLabels: { enabled: false },
      tooltip: { y: { formatter: (val) => `$${Number(val).toLocaleString()}` } }
    }),
    [clients]
  );

  const providersOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: 'bar', height: 360 },
      plotOptions: { bar: { horizontal: true } },
      xaxis: { categories: providers.map((p) => p.name) },
      dataLabels: { enabled: false },
      tooltip: { y: { formatter: (val) => `$${Number(val).toLocaleString()}` } }
    }),
    [providers]
  );

  const clientsSeries = useMemo(
    () => [{ name: 'Saldo', data: clients.map((c) => c.saldo) }],
    [clients]
  );
  const providersSeries = useMemo(
    () => [{ name: 'Saldo', data: providers.map((p) => p.saldo) }],
    [providers]
  );

  return (
    <Container>
      <Typography variant="h5" mb={3} fontWeight={700}>
        Clientes y Proveedores — Saldo
      </Typography>

      {isLoading && (
        <Box sx={{ py: 6 }}>
          <Typography>Buscando datos...</Typography>
        </Box>
      )}

      {!isLoading && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={1} fontWeight={700}>
                  Top Clientes (mayor saldo)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {clients.length === 0 ? (
                  <Typography color="text.secondary">No hay clientes con saldo.</Typography>
                ) : (
                  <ApexChart
                    options={clientsOptions}
                    series={clientsSeries}
                    type="bar"
                    height={360}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={1} fontWeight={700}>
                  Top Proveedores (mayor saldo)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {providers.length === 0 ? (
                  <Typography color="text.secondary">No hay proveedores con saldo.</Typography>
                ) : (
                  <ApexChart
                    options={providersOptions}
                    series={providersSeries}
                    type="bar"
                    height={360}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
