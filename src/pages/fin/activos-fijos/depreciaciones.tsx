import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, Button, Box, Grid, Alert, Card, CardContent, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import * as yup from 'yup';

type Depreciacion = {
  id?: number;
  id_activo: number;
  activo_nombre?: string;
  periodo: string;
  anio: number;
  mes: number;
  valor_libro_inicio: number;
  depreciacion_mensual: number;
  depreciacion_acumulada: number;
  valor_libro_final: number;
  estado: string;
};

const DepreciacionesManagement = () => {
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const calcularDepreciaciones = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await FetchData('/fin/depreciaciones/calcular', 'POST', {
        periodo,
        id_usuario: 1 // Obtener del contexto de autenticación
      });

      if (result.error || result.detail) {
        setMessage({
          type: 'error',
          text: result.message || result.detail || 'Error al calcular depreciaciones'
        });
      } else {
        setMessage({
          type: 'success',
          text: `${result.activos_procesados} depreciaciones calculadas para el periodo ${periodo}`
        });
        setRefreshKey((prev) => prev + 1); // Refrescar la tabla
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al calcular depreciaciones' });
    } finally {
      setLoading(false);
    }
  };

  const contabilizarDepreciacion = async (depreciacionId: number) => {
    try {
      const result = await FetchData(
        `/fin/depreciaciones/${depreciacionId}/contabilizar`,
        'POST',
        {}
      );

      if (result.error || result.detail) {
        alert(result.message || result.detail || 'Error al contabilizar');
      } else {
        alert(`Depreciación contabilizada exitosamente. Asiento: ${result.numero_asiento}`);
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      alert('Error al contabilizar depreciación');
    }
  };

  const columns: GridColDef[] = [
    { field: 'activo_nombre', headerName: 'Activo', flex: 2, minWidth: 200 },
    { field: 'periodo', headerName: 'Periodo', flex: 1, minWidth: 100 },
    {
      field: 'valor_libro_inicio',
      headerName: 'Valor Libro Inicial',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => `$${Number(params.value).toFixed(2)}`
    },
    {
      field: 'depreciacion_mensual',
      headerName: 'Depreciación Mensual',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => `$${Number(params.value).toFixed(2)}`
    },
    {
      field: 'depreciacion_acumulada',
      headerName: 'Depreciación Acumulada',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => `$${Number(params.value).toFixed(2)}`
    },
    {
      field: 'valor_libro_final',
      headerName: 'Valor Libro Final',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => `$${Number(params.value).toFixed(2)}`
    },
    { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 120 },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => {
        if (params.row.estado === 'CALCULADO') {
          return (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => contabilizarDepreciacion(params.row.id)}
            >
              Contabilizar
            </Button>
          );
        }
        return <span style={{ color: 'green' }}>✓ Contabilizado</span>;
      }
    }
  ];

  return (
    <Container>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Calcular Depreciaciones
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Periodo"
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={calcularDepreciaciones}
              disabled={loading}
            >
              {loading ? 'Calculando...' : 'Calcular Depreciaciones'}
            </Button>
          </Box>
          {message && (
            <Alert severity={message.type} sx={{ mt: 2 }}>
              {message.text}
            </Alert>
          )}
        </CardContent>
      </Card>

      <CrudDataGrid<Depreciacion>
        key={refreshKey}
        title="Depreciaciones"
        endpoint="/fin/depreciaciones"
        mode="read"
        columns={columns}
        defaultFormValues={{
          id_activo: 0,
          periodo: '',
          anio: 0,
          mes: 0,
          valor_libro_inicio: 0,
          depreciacion_mensual: 0,
          depreciacion_acumulada: 0,
          valor_libro_final: 0,
          estado: ''
        }}
        renderForm={() => <div>No editable</div>}
      />
    </Container>
  );
};

export default DepreciacionesManagement;
