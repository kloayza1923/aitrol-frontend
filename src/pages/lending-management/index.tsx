import { useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { FetchData } from '@/utils/FetchData';
import { toast } from 'sonner';
import { DataGrid } from '@mui/x-data-grid';
import { GridColDef } from '@mui/x-data-grid';
import { ConfirmDialog } from '@/components/data-grid/ConfirmDialog';
import { Container } from '@/components';

type Prestamo = {
  id: number;
  empleado_id: number;
  monto: number;
  fecha_prestamo: string;
  cuotas: number;
  saldo_pendiente: number;
  estado: string;
  empleado_nombre: string;
};

type Cuota = {
  id: number;
  numero_cuota: number;
  fecha_vencimiento: string;
  valor_cuota: number;
  estado: string;
};

const styleModal = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '600px',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
  borderRadius: 2
};

const PrestamosManager = () => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [nuevoPrestamo, setNuevoPrestamo] = useState({
    empleado_id: '',
    monto: '',
    fecha_prestamo: '',
    cuotas: ''
  });
  const [creating, setCreating] = useState(false);

  const fetchEmpleados = async () => {
    try {
      const data = await FetchData('/rrhh/empleados');
      setEmpleados(data || []);
    } catch {
      toast.error('Error cargando empleados');
    }
  };

  const fetchPrestamos = async () => {
    setLoading(true);
    try {
      const data = await FetchData('/rrhh/prestamos');
      setPrestamos(data || []);
    } catch {
      toast.error('Error cargando préstamos');
    }
    setLoading(false);
  };

  const fetchCuotas = async (prestamoId: number) => {
    try {
      const data = await FetchData(`/rrhh/prestamos/${prestamoId}/cuotas`);
      setCuotas(data || []);
    } catch {
      toast.error('Error cargando cuotas');
    }
  };

  useEffect(() => {
    fetchPrestamos();
    fetchEmpleados();
  }, []);

  useEffect(() => {
    if (selectedPrestamo) {
      const empleadoObj = empleados.find((e) => e.id === selectedPrestamo.empleado_id) || null;
      console.log('Empleado seleccionado:', empleadoObj, selectedPrestamo, empleados);
      setForm({
        ...selectedPrestamo,
        empleadoObj
      });
      fetchCuotas(selectedPrestamo.id);
    } else {
      setForm({});
      setCuotas([]);
    }
  }, [selectedPrestamo, empleados]);

  const handleChangeForm = (e: any) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!form.id) return toast.error('Seleccione un préstamo');
    try {
      const res = await FetchData(`/rrhh/prestamos/${form.id}`, 'PUT', {
        ...form,
        empleado_id: form.empleado_id
      });
      if (res.mensaje) {
        toast.success('Préstamo actualizado correctamente');
        fetchPrestamos();
        setModalEditOpen(false);
        setSelectedPrestamo(null);
      } else {
        toast.error('Error actualizando préstamo');
      }
    } catch {
      toast.error('Error de red');
    }
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    if (!form.id) return toast.error('Seleccione un préstamo');
    if (form.estado === 'Aprobado') {
      return toast.error('No se puede eliminar un préstamo aprobado');
    }

    try {
      const res = await FetchData(`/rrhh/prestamos/${form.id}`, 'DELETE');
      if (res.mensaje) {
        toast.success('Préstamo eliminado correctamente');
        setSelectedPrestamo(null);
        fetchPrestamos();
        setModalEditOpen(false);
      } else {
        toast.error('Error eliminando préstamo');
      }
    } catch {
      toast.error('Error de red');
    }
  };

  const handleNuevoPrestamoChange = (e: any) => {
    const { name, value } = e.target;
    setNuevoPrestamo({ ...nuevoPrestamo, [name]: value });
  };

  const handleCrearNuevoPrestamo = async () => {
    const { empleado_id, monto, fecha_prestamo, cuotas } = nuevoPrestamo;
    if (!empleado_id || !monto || !fecha_prestamo || !cuotas) {
      return toast.error('Complete todos los campos');
    }
    setCreating(true);
    try {
      const res = await FetchData('/rrhh/prestamos', 'POST', {
        empleado_id,
        monto: parseFloat(monto),
        fecha_prestamo,
        cuotas: parseInt(cuotas, 10)
      });
      if (res.mensaje) {
        toast.success('Préstamo creado correctamente');
        setNuevoPrestamo({ empleado_id: '', monto: '', fecha_prestamo: '', cuotas: '' });
        fetchPrestamos();
        setModalCreateOpen(false);
      } else {
        toast.error('Error creando préstamo');
      }
    } catch {
      toast.error('Error de red');
    }
    setCreating(false);
  };
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0.3 },
    { field: 'empleado_nombre', headerName: 'Empleado', flex: 1 },
    {
      field: 'monto',
      headerName: 'Monto',
      flex: 0.6,
      valueFormatter: (params) => `$${Number(params.value || 0).toFixed(2)}`
    },
    { field: 'fecha_prestamo', headerName: 'Fecha', flex: 0.7 },
    { field: 'cuotas', headerName: 'Cuotas', flex: 0.5 },
    {
      field: 'saldo_pendiente',
      headerName: 'Saldo',
      flex: 0.6,
      valueFormatter: (params) => `$${Number(params.value || 0).toFixed(2)}`
    },
    { field: 'estado', headerName: 'Estado', flex: 0.7 }
  ];

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Gestión de Préstamos
      </Typography>

      <Button
        variant="contained"
        color="success"
        onClick={() => setModalCreateOpen(true)}
        sx={{ mb: 3 }}
      >
        Crear Nuevo Préstamo
      </Button>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={100}>
          <CircularProgress />
        </Box>
      ) : (
        <div style={{ height: 500, width: '100%' }}>
          <DataGrid
            columns={columns}
            rows={prestamos}
            loading={loading}
            getRowId={(row) => row.id}
            pageSizeOptions={[5, 10, 20]}
            initialState={{
              pagination: { paginationModel: { pageSize: 5, page: 0 } }
            }}
            onRowClick={(params) => {
              console.log(params.row);
              setSelectedPrestamo(params.row);
              setModalEditOpen(true);
            }}
          />
        </div>
      )}

      {/* Modal Editar */}
      <Modal open={modalEditOpen} onClose={() => setModalEditOpen(false)}>
        <Box sx={styleModal}>
          <Typography variant="h6" mb={2}>
            Editar Préstamo ID: {form?.id}
          </Typography>

          <Autocomplete
            options={empleados}
            value={form.empleadoObj || null}
            getOptionLabel={(option) => option.nombres || ''}
            onChange={(event, newValue) => {
              setForm((prev: any) => ({
                ...prev,
                empleadoObj: newValue,
                empleado_id: newValue?.id || ''
              }));
            }}
            renderInput={(params) => <TextField {...params} label="Empleado" />}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Monto"
            name="monto"
            type="number"
            value={form.monto ?? ''}
            onChange={handleChangeForm}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Fecha Préstamo"
            name="fecha_prestamo"
            type="date"
            value={form.fecha_prestamo ?? ''}
            onChange={handleChangeForm}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Cuotas"
            name="cuotas"
            type="number"
            value={form.cuotas ?? ''}
            onChange={handleChangeForm}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Saldo Pendiente"
            name="saldo_pendiente"
            type="number"
            value={form.saldo_pendiente ?? ''}
            onChange={handleChangeForm}
            fullWidth
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              name="estado"
              value={form.estado ?? ''}
              inputProps={{ shrink: false }}
              onChange={handleChangeForm}
            >
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Aprobado">Aprobado</MenuItem>
              <MenuItem value="Cancelado">Cancelado</MenuItem>
            </Select>
          </FormControl>

          <Box display="flex" gap={2} mb={2}>
            <Button variant="contained" onClick={handleUpdate} color="primary">
              Guardar
            </Button>
            <Button variant="contained" onClick={() => setConfirmDeleteOpen(true)} color="error">
              Eliminar
            </Button>
            <Button variant="outlined" onClick={() => setModalEditOpen(false)}>
              Cancelar
            </Button>
          </Box>

          <Typography variant="h6" mt={4} mb={1}>
            Cuotas
          </Typography>
          {cuotas.length === 0 ? (
            <Typography>No hay cuotas</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cuotas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.numero_cuota}</TableCell>
                    <TableCell>{c.fecha_vencimiento}</TableCell>
                    <TableCell>${c.valor_cuota.toFixed(2)}</TableCell>
                    <TableCell>{c.estado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Modal>

      {/* Modal Crear */}
      <Modal open={modalCreateOpen} onClose={() => setModalCreateOpen(false)}>
        <Box sx={styleModal}>
          <Typography variant="h6" mb={2}>
            Crear Nuevo Préstamo
          </Typography>
          <Autocomplete
            options={empleados}
            getOptionLabel={(option) => option.nombres || ''}
            onChange={(event, newValue) => {
              setNuevoPrestamo((prev) => ({ ...prev, empleado_id: newValue?.id || '' }));
            }}
            renderInput={(params) => <TextField {...params} label="Empleado" />}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Monto"
            name="monto"
            type="number"
            value={nuevoPrestamo.monto}
            onChange={handleNuevoPrestamoChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Fecha Préstamo"
            name="fecha_prestamo"
            type="date"
            value={nuevoPrestamo.fecha_prestamo}
            onChange={handleNuevoPrestamoChange}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Cuotas"
            name="cuotas"
            type="number"
            value={nuevoPrestamo.cuotas}
            onChange={handleNuevoPrestamoChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleCrearNuevoPrestamo}
            disabled={creating}
          >
            {creating ? 'Creando...' : 'Crear'}
          </Button>
        </Box>
      </Modal>
      <ConfirmDialog
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Préstamo"
        message="¿Estás seguro de que deseas eliminar este préstamo?"
      />
    </Container>
  );
};

export default PrestamosManager;
