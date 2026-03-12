import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import {
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  Card,
  CardContent,
  Typography,
  Chip
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useState } from 'react';
import { FetchData } from '@/utils/FetchData';

type CierrePeriodo = {
  id?: number;
  periodo: string;
  anio: number;
  mes: number;
  tipo_cierre: string;
  fecha_cierre: string;
  fecha_proceso: string;
  total_ingresos: number;
  total_egresos: number;
  utilidad_perdida: number;
  estado: string;
};

const CierresManagement = () => {
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const procesarCierre = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await FetchData('/fin/cierres-periodo/procesar', 'POST', {
        periodo,
        tipo_cierre: 'MENSUAL',
        generar_asiento: true,
        id_usuario: 1 // Obtener del contexto de autenticación
      });

      if (result.error || result.detail) {
        setMessage({
          type: 'error',
          text: result.message || result.detail || 'Error al procesar cierre'
        });
      } else {
        setMessage({
          type: 'success',
          text: `Cierre procesado exitosamente. Utilidad/Pérdida: $${Number(result.utilidad_perdida).toFixed(2)}`
        });
        setRefreshKey((prev) => prev + 1); // Refrescar la tabla
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al procesar cierre' });
    } finally {
      setLoading(false);
    }
  };

  const reabrirCierre = async (cierreId: number) => {
    const motivo = prompt('Ingrese el motivo de reapertura:');
    if (!motivo) return;

    try {
      const result = await FetchData(`/fin/cierres-periodo/${cierreId}/reabrir`, 'POST', {
        motivo,
        eliminar_asientos: true
      });

      if (result.error || result.detail) {
        alert(result.message || result.detail || 'Error al reabrir');
      } else {
        alert('Periodo reabierto exitosamente');
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      alert('Error al reabrir periodo');
    }
  };

  const columns: GridColDef[] = [
    { field: 'periodo', headerName: 'Periodo', flex: 1, minWidth: 100 },
    { field: 'tipo_cierre', headerName: 'Tipo', flex: 1, minWidth: 100 },
    {
      field: 'fecha_proceso',
      headerName: 'Fecha Proceso',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => new Date(params.value).toLocaleString()
    },
    {
      field: 'total_ingresos',
      headerName: 'Total Ingresos',
      flex: 1.5,
      minWidth: 140,
      renderCell: (params) => (
        <span style={{ color: 'green' }}>
          ${Number(params.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      field: 'total_egresos',
      headerName: 'Total Egresos',
      flex: 1.5,
      minWidth: 140,
      renderCell: (params) => (
        <span style={{ color: 'red' }}>
          ${Number(params.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      field: 'utilidad_perdida',
      headerName: 'Utilidad/Pérdida',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => {
        const valor = Number(params.value);
        const color = valor >= 0 ? 'green' : 'red';
        return (
          <span style={{ color, fontWeight: 'bold' }}>
            ${valor.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => {
        const colors: Record<string, 'success' | 'warning'> = {
          CERRADO: 'success',
          REABIERTO: 'warning'
        };
        return <Chip label={params.value} color={colors[params.value] || 'success'} size="small" />;
      }
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 1.2,
      minWidth: 130,
      renderCell: (params) => {
        if (params.row.estado === 'CERRADO') {
          return (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => reabrirCierre(params.row.id)}
            >
              Reabrir
            </Button>
          );
        }
        return <span style={{ color: 'orange' }}>✓ Reabierto</span>;
      }
    }
  ];

  return (
    <Container>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Procesar Cierre de Periodo
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
            <Button variant="contained" color="primary" onClick={procesarCierre} disabled={loading}>
              {loading ? 'Procesando...' : 'Procesar Cierre'}
            </Button>
          </Box>
          {message && (
            <Alert severity={message.type} sx={{ mt: 2 }}>
              {message.text}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            El cierre calculará automáticamente los totales de ingresos y egresos del periodo,
            determinará la utilidad o pérdida y generará los asientos contables correspondientes.
          </Typography>
        </CardContent>
      </Card>

      <CrudDataGrid<CierrePeriodo>
        key={refreshKey}
        title="Cierres de Periodo"
        endpoint="/fin/cierres-periodo"
        mode="read"
        columns={columns}
        defaultFormValues={{
          periodo: '',
          anio: 0,
          mes: 0,
          tipo_cierre: '',
          fecha_cierre: '',
          fecha_proceso: '',
          total_ingresos: 0,
          total_egresos: 0,
          utilidad_perdida: 0,
          estado: ''
        }}
        renderForm={() => <div>No editable</div>}
      />
    </Container>
  );
};

export default CierresManagement;
