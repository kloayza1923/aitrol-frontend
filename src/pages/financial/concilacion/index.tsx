import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Container,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Modal,
  Input
} from '@mui/material';
import {
  CompareArrows as CompareArrowsIcon,
  Check as CheckIcon,
  CloudUpload as CloudUploadIcon,
  AutoFixHigh as AutoFixHighIcon,
  Add as AddIcon
} from '@mui/icons-material';

// Importamos tus utilidades personalizadas
import { useFetchData } from '@/utils/useFetchData';
import { FetchData } from '@/utils/FetchData'; // Asumiendo que exportas la instancia o clase estática
import { toast } from 'sonner'; // O tu sistema de notificaciones preferido

// Tipos basados en tu backend
interface BancoMovimiento {
  id: number;
  fecha: string;
  descripcion: string;
  monto: number;
  referencia: string;
}

interface AsientoDetalle {
  id: number;
  // Ajusta estos campos según tu respuesta real del backend (ContDiario + ContDiarioDetalle)
  diario: { fecha: string; numero_asiento: string };
  descripcion: string;
  debe: number;
  haber: number;
}

interface Sugerencia {
  banco: BancoMovimiento;
  sistema: AsientoDetalle[];
}

const BankReconciliationPage = () => {
  // 1. Usamos tu hook personalizado para traer datos
  const {
    data: sugerencias,
    loading,
    refetch
  } = useFetchData<Sugerencia[]>('/conciliacion/sugerencias');
  console.log('Sugerencias de conciliación:', sugerencias);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);

  // 2. Acción para conciliar usando tu clase FetchData
  const handleConciliate = async (bancoId: number, detalleId: number) => {
    try {
      setProcessingId(bancoId);

      // Llamada POST usando tu utilidad
      await FetchData.post('/conciliacion/conciliar', {
        banco_movimiento_id: bancoId,
        cont_diario_detalle_id: detalleId // Apunta al detalle, no a la cabecera
      });

      toast.success('Conciliación realizada con éxito');

      // Recargar la lista
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Error al conciliar');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpload = () => {
    setModalOpen(true);
  };

  if (loading && !sugerencias) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Cabecera */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Conciliación Bancaria
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Empareja los movimientos bancarios con tus registros contables
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={handleUpload}>
            Subir Extracto
          </Button>
          <Button variant="contained" color="primary" startIcon={<AutoFixHighIcon />}>
            Auto-Conciliar
          </Button>
        </Stack>
      </Box>

      {/* Lista de Sugerencias */}
      <Stack spacing={3}>
        {sugerencias?.map((item, index) => (
          <Card key={index} elevation={3} sx={{ borderLeft: 6, borderColor: 'primary.main' }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Grid container>
                {/* Lado Izquierdo: BANCO */}
                <Grid
                  item
                  xs={12}
                  md={5}
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    borderRight: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="overline" color="text.secondary" fontWeight="bold">
                    Extracto Bancario
                  </Typography>
                  <Box mt={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                      <Typography variant="body2" fontWeight="medium">
                        {item.banco.fecha}
                      </Typography>
                      <Typography
                        variant="h6"
                        fontFamily="monospace"
                        color={item.banco.monto > 0 ? 'success.main' : 'error.main'}
                      >
                        ${Number(item.banco.monto).toFixed(2)}
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight="bold" mt={0.5}>
                      {item.banco.descripcion}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ref: {item.banco.referencia}
                    </Typography>
                  </Box>
                </Grid>

                {/* Centro: ICONO */}
                <Grid
                  item
                  xs={12}
                  md={1}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ bgcolor: 'action.hover' }}
                >
                  <CompareArrowsIcon color="action" />
                </Grid>

                {/* Lado Derecho: SISTEMA (ERP) */}
                <Grid item xs={12} md={6} sx={{ p: 2 }}>
                  <Typography variant="overline" color="text.secondary" fontWeight="bold">
                    Libros (ERP) - Sugerencias
                  </Typography>

                  <Stack spacing={1} mt={1}>
                    {item.sistema.length > 0 ? (
                      item.sistema.map((asiento) => (
                        <Box
                          key={asiento.id}
                          sx={{
                            p: 1.5,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                          }}
                        >
                          <Box>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {asiento.diario?.fecha
                                ? new Date(asiento.diario.fecha).toLocaleDateString()
                                : 'S/F'}{' '}
                              • Asiento #{asiento.diario?.numero_asiento}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {asiento.descripcion || 'Sin descripción'}
                            </Typography>
                          </Box>

                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            disabled={processingId === item.banco.id}
                            onClick={() => handleConciliate(item.banco.id, asiento.id)}
                            startIcon={<CheckIcon />}
                            sx={{ minWidth: 100 }}
                          >
                            Conciliar
                          </Button>
                        </Box>
                      ))
                    ) : (
                      <Box
                        sx={{
                          border: '1px dashed',
                          borderColor: 'text.disabled',
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          No se encontraron coincidencias exactas.
                        </Typography>
                        <Button variant="outlined" size="small" startIcon={<AddIcon />}>
                          Crear Asiento Manual
                        </Button>
                      </Box>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        {!loading && sugerencias?.length === 0 && (
          <Box textAlign="center" py={10}>
            <CheckIcon sx={{ fontSize: 60, color: 'success.light', mb: 2 }} />
            <Typography variant="h5" color="text.secondary">
              ¡Todo está conciliado!
            </Typography>
            <Typography variant="body1" color="text.disabled">
              No hay movimientos pendientes en el extracto bancario.
            </Typography>
          </Box>
        )}
      </Stack>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute' as 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4
          }}
        >
          <Typography variant="h6" component="h2">
            Subir Extracto Bancario
          </Typography>
          <Input
            type="file"
            fullWidth
            sx={{ mt: 2 }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              console.log(e.target.files);
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files[0]);
              }
            }}
          />
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                // Lógica para subir el archivo
                setModalOpen(false);
              }}
            >
              Subir
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
};

export default BankReconciliationPage;
