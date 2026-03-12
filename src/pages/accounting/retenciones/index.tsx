import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Chip,
  Stack,
  Toolbar,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import {
  useGetComprasListQuery,
  useGetRetencionesListQuery,
  useCreateRetencionMutation,
  useProcessRetencionMutation
} from '@/store/api/retencionesApi';
import { useUpdateEntityMutation, useGetEntityListQuery } from '@/store/api/crudSlice';

// --- TIPOS ---
type EstadoRetencion = 'Autorizado' | 'Pendiente' | 'Anulado';
type TipoMovimiento = 'Compra' | 'Venta';

interface Retencion {
  id: number;
  fecha: string;
  comprobante: string;
  contribuyente: string;
  tipo: TipoMovimiento;
  baseImponible: number;
  porcentaje: number;
  valorRetenido: number;
  estado: EstadoRetencion;
}

// --- DATOS MOCK ---
const INITIAL_DATA: Retencion[] = [];

// --- COMPONENTE MODAL (DIALOG) ---
interface RetencionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: Retencion) => void;
  editingItem: Retencion | null;
  compras?: any[];
  ventas?: any[];
}

const RetencionModal = ({
  open,
  onClose,
  onSubmit,
  editingItem,
  compras = [],
  ventas = []
}: RetencionModalProps) => {
  const initialFormState: Retencion = {
    id: 0,
    fecha: new Date().toISOString().split('T')[0],
    comprobante: '',
    contribuyente: '',
    tipo: 'Compra',
    baseImponible: 0,
    porcentaje: 1.75,
    valorRetenido: 0,
    estado: 'Pendiente'
  };

  const [formData, setFormData] = useState<Retencion>(initialFormState);
  const [relatedId, setRelatedId] = useState<number | ''>('');
  const [relatedType, setRelatedType] = useState<TipoMovimiento>('Compra');

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setFormData(editingItem);
      } else {
        setFormData({ ...initialFormState, id: new Date().getTime() });
      }
    }
  }, [open, editingItem]);

  useEffect(() => {
    // when editingItem has tipo, set relatedType
    if (editingItem && editingItem.tipo) setRelatedType(editingItem.tipo);
  }, [editingItem]);

  // Cálculo automático
  useEffect(() => {
    const val = (Number(formData.baseImponible) * Number(formData.porcentaje)) / 100;
    setFormData((prev) => ({ ...prev, valorRetenido: parseFloat(val.toFixed(2)) }));
  }, [formData.baseImponible, formData.porcentaje]);

  const handleChange = (field: keyof Retencion, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        {editingItem ? 'Editar Retención' : 'Nueva Retención'}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          {/* Fila 1 */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha de Emisión"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.fecha}
              onChange={(e) => handleChange('fecha', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Tipo de Documento Relacionado"
              fullWidth
              value={relatedType}
              onChange={(e) => {
                const t = e.target.value as TipoMovimiento;
                setRelatedType(t);
                handleChange('tipo', t);
                // reset related selection
                setRelatedId('');
              }}
            >
              <MenuItem value="Compra">Compra</MenuItem>
              <MenuItem value="Venta">Venta</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Tipo de Movimiento"
              fullWidth
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
            >
              <MenuItem value="Compra">Compra (Emitida)</MenuItem>
              <MenuItem value="Venta">Venta (Recibida)</MenuItem>
            </TextField>
          </Grid>

          {/* Fila 2 */}
          <Grid item xs={12}>
            <TextField
              label="Contribuyente / Razón Social"
              placeholder="Ej: Juan Perez"
              fullWidth
              value={formData.contribuyente}
              onChange={(e) => handleChange('contribuyente', e.target.value)}
            />
          </Grid>

          {/* Fila 3 */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="No. Comprobante"
              placeholder="001-001-000000001"
              fullWidth
              value={formData.comprobante}
              onChange={(e) => handleChange('comprobante', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            {/* Select compra/venta relacionada */}
            <TextField
              select
              label={relatedType === 'Compra' ? 'Factura Compra' : 'Factura Venta'}
              fullWidth
              value={relatedId}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                setRelatedId(val as any);
                const lista = relatedType === 'Compra' ? compras || [] : ventas || [];
                const sel = lista.find((x: any) => Number(x.id) === Number(val));
                if (sel) {
                  const numero = sel.numero || sel.numero_factura || sel.numero_serie || '';
                  const contrib =
                    sel.proveedor_nombre ||
                    (sel.proveedor && sel.proveedor.nombre) ||
                    sel.cliente_nombre ||
                    (sel.cliente && sel.cliente.nombre) ||
                    '';
                  const base = Number(sel.subtotal || sel.total || sel.base_imponible || 0);
                  setFormData((prev) => ({
                    ...prev,
                    comprobante: numero,
                    contribuyente: contrib,
                    baseImponible: base
                  }));
                }
              }}
            >
              <MenuItem value="">-- Ninguno --</MenuItem>
              {(relatedType === 'Compra' ? compras || [] : ventas || []).map((c: any) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.numero || c.numero_factura || `#${c.id}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Estado"
              fullWidth
              value={formData.estado}
              onChange={(e) => handleChange('estado', e.target.value)}
            >
              <MenuItem value="Pendiente">Pendiente</MenuItem>
              <MenuItem value="Autorizado">Autorizado</MenuItem>
              <MenuItem value="Anulado">Anulado</MenuItem>
            </TextField>
          </Grid>

          {/* Sección de Valores con fondo ligero para destacar */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                Detalle de Valores
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Base Imponible"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    value={formData.baseImponible}
                    onChange={(e) => handleChange('baseImponible', parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    label="Porcentaje %"
                    fullWidth
                    value={formData.porcentaje}
                    onChange={(e) => handleChange('porcentaje', parseFloat(e.target.value))}
                  >
                    <MenuItem value={1}>1% (Bienes)</MenuItem>
                    <MenuItem value={1.75}>1.75% (Servicios)</MenuItem>
                    <MenuItem value={2.75}>2.75% (Facturas)</MenuItem>
                    <MenuItem value={8}>8% (Honorarios)</MenuItem>
                    <MenuItem value={10}>10% (Profesionales)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Valor Retenido"
                    fullWidth
                    value={formData.valorRetenido}
                    InputProps={{
                      readOnly: true,
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      sx: { fontWeight: 'bold', bgcolor: '#e8f5e9' } // Verde claro
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={() => onSubmit(formData)}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- PÁGINA PRINCIPAL ---
const RetencionesPage = () => {
  const [data, setData] = useState<Retencion[]>(INITIAL_DATA);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Retencion | null>(null);
  const session = JSON.parse(localStorage.getItem('auth') || '{}');

  // RTK Query hooks
  const {
    data: retResp,
    isLoading: loadingRet,
    refetch
  } = useGetRetencionesListQuery({ page: page + 1, limit: rowsPerPage });
  const { data: comprasResp } = useGetComprasListQuery({ page: 1, limit: 50 });
  const { data: ventasResp } = useGetEntityListQuery({
    endpoint: '/inv/ventas',
    params: { page: 1, limit: 50 }
  });
  const [createRetencion] = useCreateRetencionMutation();
  const [processRet] = useProcessRetencionMutation();
  const [updateEntity] = useUpdateEntityMutation();

  // Map backend data shape to UI model
  useEffect(() => {
    const items = (retResp && (retResp.data || retResp)) || [];
    const mapped: Retencion[] = items.map((r: any) => ({
      id: r.id,
      fecha: r.fecha ? String(r.fecha).split('T')[0] : r.fecha || '',
      comprobante: r.comprobante || '',
      contribuyente: r.contribuyente || r.proveedor_nombre || '',
      tipo: 'Compra',
      baseImponible: Number(r.base_imponible || r.baseImponible || 0),
      porcentaje: Number(r.porcentaje || 0),
      valorRetenido: Number(r.valor_retenido || r.valorRetenido || 0),
      estado: (function (s: any) {
        if (!s) return 'Pendiente';
        const up = String(s).toUpperCase();
        if (up === 'CONTABILIZADO') return 'Autorizado';
        if (up === 'ANULADO') return 'Anulado';
        if (up === 'PENDIENTE') return 'Pendiente';
        return String(s);
      })(r.estado)
    }));
    setData(mapped);
  }, [retResp]);

  // Filtrado
  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.contribuyente.toLowerCase().includes(search.toLowerCase()) ||
        item.comprobante.includes(search)
    );
  }, [data, search]);

  // Paginación
  const visibleRows = useMemo(
    () => filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredData, page, rowsPerPage]
  );

  const handleOpenModal = (item?: Retencion) => {
    setEditingItem(item || null);
    setModalOpen(true);
  };

  const handleSave = (item: Retencion) => {
    const payload: any = {
      fecha: item.fecha,
      comprobante: item.comprobante,
      contribuyente: item.contribuyente,
      base_imponible: item.baseImponible,
      porcentaje: item.porcentaje,
      valor_retenido: item.valorRetenido,
      estado: item.estado,
      id_sucursal: Number(localStorage.getItem('sucursal') || 0),
      id_usuario: session.id
    };

    if (editingItem) {
      // update via generic CRUD
      updateEntity({ endpoint: '/fin/retenciones', id: item.id, data: payload });
    } else {
      createRetencion({ data: payload });
    }
    setModalOpen(false);
    // refetch list
    setTimeout(() => refetch && refetch(), 300);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Anular esta retención?')) {
      updateEntity({ endpoint: '/fin/retenciones', id, data: { estado: 'ANULADO' } });
      setTimeout(() => refetch && refetch(), 300);
    }
  };

  const handleProcess = async (id: number) => {
    if (!confirm('¿Contabilizar esta retención?')) return;
    try {
      await processRet({ id, data: { auto: true, id_usuario: session.id } }).unwrap();
      alert('Retención contabilizada');
      refetch && refetch();
    } catch (err: any) {
      alert(err?.data?.detail || err?.message || 'Error al contabilizar');
    }
  };

  const getStatusChipColor = (estado: EstadoRetencion) => {
    switch (estado) {
      case 'Autorizado':
        return 'success';
      case 'Pendiente':
        return 'warning';
      case 'Anulado':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Cabecera */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Gestión de Retenciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra tus comprobantes de retención
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nueva Retención
        </Button>
      </Paper>

      {/* Barra de Herramientas y Tabla */}
      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          {/* Toolbar de búsqueda */}
          <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, borderBottom: '1px solid #eee' }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Buscar por cliente o comprobante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{ width: { xs: '100%', sm: 300 } }}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Filtrar lista">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>

          {/* Tabla */}
          <TableContainer>
            <Table sx={{ minWidth: 750 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>
                    <strong>Fecha</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Comprobante</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Contribuyente</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Tipo</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Base Imp.</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>%</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Valor Ret.</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Estado</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Acciones</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.length > 0 ? (
                  visibleRows.map((row) => (
                    <TableRow hover key={row.id}>
                      <TableCell>{row.fecha}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{row.comprobante}</TableCell>
                      <TableCell>{row.contribuyente}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.tipo}
                          size="small"
                          color={row.tipo === 'Venta' ? 'info' : 'secondary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">${row.baseImponible.toFixed(2)}</TableCell>
                      <TableCell align="right">{row.porcentaje}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ${row.valorRetenido.toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.estado}
                          color={getStatusChipColor(row.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenModal(row)}
                              disabled={row.estado === 'Anulado'}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Contabilizar">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleProcess(row.id)}
                              disabled={row.estado === 'Anulado' || row.estado === 'Autorizado'}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Anular">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(row.id)}
                              disabled={row.estado === 'Anulado'}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No se encontraron registros
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Modal Renderizado */}
      <RetencionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        editingItem={editingItem}
        compras={(comprasResp && (comprasResp.data || comprasResp)) || []}
        ventas={(ventasResp && (ventasResp.data || ventasResp)) || []}
      />
    </Container>
  );
};

export default RetencionesPage;
