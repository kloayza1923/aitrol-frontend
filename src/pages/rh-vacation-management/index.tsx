import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize,
  Snackbar,
  Alert,
  FormHelperText
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { FetchData } from '@/utils/FetchData';
import { AuthContext } from '@/auth/providers/JWTProvider';
import { vacationSchema } from '@/validations/tthValidations';
import { useFormik } from 'formik';
import * as Yup from 'yup';
type VacationRequest = {
  id: number;
  empleado: string;
  empleado_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  motivo: string;
  estado: string;
  fecha_respuesta?: string;
  aprobado_por?: string;
};

type NewVacationRequest = Omit<
  VacationRequest,
  'id' | 'empleado' | 'fecha_respuesta' | 'aprobado_por' | 'estado'
> & {
  aprobado_por?: string | number;
};

export default function ReporteVacaciones() {
  const [solicitudes, setSolicitudes] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [tempFiltros, setTempFiltros] = useState<Record<string, any>>({});
  const [filtros, setFiltros] = useState<Record<string, any>>({});

  // Modal de rechazo
  const [openRechazo, setOpenRechazo] = useState(false);
  const [rechazoId, setRechazoId] = useState<number | null>(null);

  // Crear solicitud
  const [openCrear, setOpenCrear] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;

  // Validation schema para rechazo
  const rejectSchema = Yup.object().shape({
    motivo_rechazo: Yup.string()
      .required('Debe ingresar un motivo para el rechazo')
      .min(10, 'El motivo debe tener al menos 10 caracteres')
      .max(500, 'El motivo no puede exceder 500 caracteres')
  });

  // Formik para rechazo
  const rejectFormik = useFormik({
    initialValues: {
      motivo_rechazo: ''
    },
    validationSchema: rejectSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!rechazoId) return;

      try {
        await FetchData(`/vacaciones/${rechazoId}/rechazar`, 'PUT', {
          params: { aprobado_por: currentUser?.id, motivo_rechazo: values.motivo_rechazo }
        });
        setSnackbar({
          open: true,
          message: `Solicitud ${rechazoId} rechazada`,
          severity: 'success'
        });
        setOpenRechazo(false);
        rejectFormik.resetForm();
        setRechazoId(null);
        fetchSolicitudes();
      } catch (error) {
        console.error(error);
        setSnackbar({
          open: true,
          message: `Error al rechazar solicitud ${rechazoId}`,
          severity: 'error'
        });
      } finally {
        setSubmitting(false);
      }
    }
  });

  // Formik para validación con Yup
  const formik = useFormik({
    initialValues: {
      empleado_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      dias_solicitados: 0,
      motivo: '',
      aprobado_por: ''
    },
    validationSchema: vacationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setCreateLoading(true);
      try {
        const submitData = { ...values, aprobado_por: currentUser?.id };
        await FetchData('/vacaciones/solicitud/aprobada', 'POST', submitData);
        setSnackbar({ open: true, message: 'Solicitud creada', severity: 'success' });
        setOpenCrear(false);
        formik.resetForm();
        fetchSolicitudes();
      } catch (error) {
        console.error(error);
        setSnackbar({ open: true, message: 'Error al crear solicitud', severity: 'error' });
      } finally {
        setCreateLoading(false);
        setSubmitting(false);
      }
    }
  });

  const [empleados, setEmpleados] = useState<any[]>([]);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', flex: 0.5, minWidth: 60 },
      { field: 'empleado', headerName: 'Empleado', flex: 1.5, minWidth: 180 },
      { field: 'fecha_inicio', headerName: 'Fecha Inicio', flex: 1, minWidth: 120 },
      { field: 'fecha_fin', headerName: 'Fecha Fin', flex: 1, minWidth: 120 },
      { field: 'dias_solicitados', headerName: 'Días Solicitados', flex: 1, minWidth: 130 },
      { field: 'motivo', headerName: 'Motivo', flex: 2, minWidth: 200 },
      { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 120 },
      { field: 'fecha_respuesta', headerName: 'Fecha Respuesta', flex: 1, minWidth: 130 },
      { field: 'aprobado_por', headerName: 'Aprobado Por', flex: 1, minWidth: 120 },
      {
        field: 'acciones',
        headerName: 'Acciones',
        flex: 1.5,
        minWidth: 260,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams) => {
          const solicitud = params.row;
          const isPendiente = solicitud.estado === 'pendiente';
          return (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                disabled={!isPendiente}
                onClick={() => handleAprobar(solicitud.id)}
              >
                Aprobar
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={!isPendiente}
                onClick={() => {
                  setRechazoId(solicitud.id);
                  rejectFormik.resetForm();
                  setOpenRechazo(true);
                }}
              >
                Rechazar
              </Button>
              <Button variant="text" size="small" onClick={() => handleDescargarPDF(solicitud.id)}>
                PDF
              </Button>
            </Stack>
          );
        }
      }
    ],
    []
  );

  // Cargar solicitudes
  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v.toString());
      });
      const response = await FetchData('/vacaciones', 'GET', { params });
      // si tu FetchData devuelve { data: [...] } deja response.data; si devuelve directamente el array, usa response.
      setSolicitudes(response.data ?? response);
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error al cargar solicitudes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Cargar empleados
  const fetchEmpleados = async () => {
    try {
      const response = await FetchData('/rrhh/empleados', 'GET');
      setEmpleados(response.data ?? response);
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error al cargar empleados', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchSolicitudes();
    fetchEmpleados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  // Aprobar solicitud
  const handleAprobar = async (id: number) => {
    if (!window.confirm(`¿Confirmas aprobar la solicitud #${id}?`)) return;
    try {
      await FetchData(`/vacaciones/${id}/aprobar`, 'PUT', {
        params: { aprobado_por: currentUser?.id }
      });
      setSnackbar({ open: true, message: `Solicitud ${id} aprobada`, severity: 'success' });
      fetchSolicitudes();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: `Error al aprobar solicitud ${id}`, severity: 'error' });
    }
  };

  // Descargar PDF
  const handleDescargarPDF = async (id: number) => {
    try {
      /*  const blob = await FetchData(`/vacaciones/${id}/documento`, 'GET', { responseType: 'blob' });
       const file = blob.data ?? blob; // según FetchData
       const url = window.URL.createObjectURL(new Blob([file])); */
      const url = import.meta.env.VITE_APP_API_URL + `/vacaciones/${id}/documento`;
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error al descargar PDF', severity: 'error' });
    }
  };

  // ---------- CREAR ----------
  const calcDias = (inicio: string, fin: string) => {
    if (!inicio || !fin) return 0;
    const d1 = new Date(inicio);
    const d2 = new Date(fin);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : 0; // inclusive
  };

  // Actualizar días automáticamente cuando cambien las fechas
  useEffect(() => {
    if (formik.values.fecha_inicio && formik.values.fecha_fin) {
      const dias = calcDias(formik.values.fecha_inicio, formik.values.fecha_fin);
      formik.setFieldValue('dias_solicitados', dias);
    }
  }, [formik.values.fecha_inicio, formik.values.fecha_fin]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Solicitudes de Vacaciones
      </Typography>

      {/* Filtros + Crear */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Empleado</InputLabel>
          <Select
            value={tempFiltros.empleado_id || ''}
            onChange={(e) => setTempFiltros((p) => ({ ...p, empleado_id: e.target.value }))}
          >
            <MenuItem value="">Todos</MenuItem>
            {empleados.map((empleado) => (
              <MenuItem key={empleado.id} value={empleado.id}>
                {empleado.nombres} {empleado.apellidos}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={tempFiltros.estado || ''}
            onChange={(e) => setTempFiltros((p) => ({ ...p, estado: e.target.value }))}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="pendiente">Pendiente</MenuItem>
            <MenuItem value="aprobado">Aprobado</MenuItem>
            <MenuItem value="rechazado">Rechazado</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Fecha Inicio"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={tempFiltros.fecha_inicio || ''}
          onChange={(e) => setTempFiltros((p) => ({ ...p, fecha_inicio: e.target.value }))}
        />
        <TextField
          label="Fecha Fin"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={tempFiltros.fecha_fin || ''}
          onChange={(e) => setTempFiltros((p) => ({ ...p, fecha_fin: e.target.value }))}
        />

        <Box>
          <Button variant="contained" onClick={() => setFiltros(tempFiltros)}>
            Buscar
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setTempFiltros({});
              setFiltros({});
            }}
            sx={{ ml: 1 }}
          >
            Limpiar
          </Button>

          {/* Botón Crear */}
          <Button
            variant="contained"
            color="success"
            sx={{ ml: 2 }}
            onClick={() => setOpenCrear(true)}
          >
            Crear Solicitud
          </Button>
        </Box>
      </Box>

      {/* DataGrid */}
      <Box sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={solicitudes}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
        />
      </Box>

      {/* Modal Crear */}
      <Dialog open={openCrear} onClose={() => setOpenCrear(false)} fullWidth maxWidth="sm">
        <DialogTitle>Crear Solicitud de Vacaciones</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Al crear una solicitud, automáticamente se aprobará y no seguirá el flujo de aprobación.
          </Alert>
          <form onSubmit={formik.handleSubmit}>
            <Stack spacing={2}>
              <FormControl
                size="small"
                fullWidth
                error={formik.touched.empleado_id && Boolean(formik.errors.empleado_id)}
              >
                <InputLabel>Empleado</InputLabel>
                <Select
                  name="empleado_id"
                  value={formik.values.empleado_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {empleados.map((empleado) => (
                    <MenuItem key={empleado.id} value={empleado.id}>
                      {empleado.nombres} {empleado.apellidos}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.empleado_id && formik.errors.empleado_id && (
                  <FormHelperText>{formik.errors.empleado_id}</FormHelperText>
                )}
              </FormControl>

              <TextField
                name="fecha_inicio"
                label="Fecha Inicio"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={formik.values.fecha_inicio}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fecha_inicio && Boolean(formik.errors.fecha_inicio)}
                helperText={formik.touched.fecha_inicio && formik.errors.fecha_inicio}
                fullWidth
              />

              <TextField
                name="fecha_fin"
                label="Fecha Fin"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={formik.values.fecha_fin}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fecha_fin && Boolean(formik.errors.fecha_fin)}
                helperText={formik.touched.fecha_fin && formik.errors.fecha_fin}
                fullWidth
              />

              <TextField
                name="dias_solicitados"
                label="Días solicitados"
                type="number"
                size="small"
                value={formik.values.dias_solicitados}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.dias_solicitados && Boolean(formik.errors.dias_solicitados)}
                helperText={formik.touched.dias_solicitados && formik.errors.dias_solicitados}
                fullWidth
                InputProps={{ readOnly: true }}
              />

              <TextField
                name="motivo"
                label="Motivo"
                size="small"
                multiline
                rows={3}
                value={formik.values.motivo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.motivo && Boolean(formik.errors.motivo)}
                helperText={formik.touched.motivo && formik.errors.motivo}
                fullWidth
              />
            </Stack>
          </form>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenCrear(false);
              formik.resetForm();
            }}
            disabled={createLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => formik.handleSubmit()}
            disabled={createLoading || !formik.isValid}
          >
            {createLoading ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de rechazo */}
      <Dialog
        open={openRechazo}
        onClose={() => {
          setOpenRechazo(false);
          rejectFormik.resetForm();
          setRechazoId(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rechazar Solicitud</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Motivo de rechazo para la solicitud #{rechazoId}:</Typography>
          <form onSubmit={rejectFormik.handleSubmit}>
            <TextField
              name="motivo_rechazo"
              label="Motivo del rechazo"
              multiline
              rows={4}
              fullWidth
              value={rejectFormik.values.motivo_rechazo}
              onChange={rejectFormik.handleChange}
              onBlur={rejectFormik.handleBlur}
              error={
                rejectFormik.touched.motivo_rechazo && Boolean(rejectFormik.errors.motivo_rechazo)
              }
              helperText={rejectFormik.touched.motivo_rechazo && rejectFormik.errors.motivo_rechazo}
              placeholder="Ingrese el motivo del rechazo..."
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenRechazo(false);
              rejectFormik.resetForm();
              setRechazoId(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => rejectFormik.handleSubmit()}
            disabled={!rejectFormik.isValid || rejectFormik.isSubmitting}
          >
            {rejectFormik.isSubmitting ? 'Rechazando...' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
