import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { toast } from 'sonner';
import { FetchData } from '@/utils/FetchData';
import { useAuthContext } from '@/auth';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import PercentIcon from '@mui/icons-material/Percent';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ListaPrecio {
  id: number;
  nombre: string;
  descripcion: string;
  descuento_global: number;
  estado: boolean;
  total_productos: number;
}

interface DetallePrecio {
  id: number;
  producto_id: number;
  producto_nombre: string;
  producto_codigo: string;
  precio_base: number;
  precio_especial: number | null;
  descuento: number | null;
  precio_final: number;
}

interface Producto {
  id: number;
  nombre: string;
  codigo_barra: string;
  precio_venta: number;
}

const ListaModal = ({
  lista,
  onClose,
  onSaved
}: {
  lista: Partial<ListaPrecio> | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    nombre: lista?.nombre || '',
    descripcion: lista?.descripcion || '',
    descuento_global: lista?.descuento_global ?? 0
  });
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuthContext();
  const sucursal = (currentUser as any)?.id_sucursal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setLoading(true);
    try {
      if (lista?.id) {
        await FetchData(`/inv/listas-precio/${lista.id}`, 'PUT', {
          ...form,
          descuento_global: Number(form.descuento_global)
        });
        toast.success('Lista actualizada');
      } else {
        await FetchData('/inv/listas-precio', 'POST', {
          ...form,
          descuento_global: Number(form.descuento_global),
          id_sucursal: sucursal
        });
        toast.success('Lista creada');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle className="flex items-center justify-between">
          <span>{lista?.id ? 'Editar Lista de Precio' : 'Nueva Lista de Precio'}</span>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box className="space-y-4 pt-2">
            <TextField
              label="Nombre"
              placeholder="Ej: Mayorista, VIP, Distribuidor"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              fullWidth
              required
              size="small"
            />
            <TextField
              label="Descripción"
              placeholder="Descripción opcional"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
            <TextField
              label="Descuento global"
              type="number"
              placeholder="0"
              value={form.descuento_global}
              onChange={(e) => setForm({ ...form, descuento_global: Number(e.target.value) })}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 100, step: 0.01 }
                }
              }}
              helperText="Se aplica a productos que no tengan precio especial individual"
            />
          </Box>
        </DialogContent>
        <DialogActions className="px-6 py-3">
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : lista?.id ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const ProductosModal = ({ lista, onClose }: { lista: ListaPrecio; onClose: () => void }) => {
  const [detalles, setDetalles] = useState<DetallePrecio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Producto | null>(null);
  const [precioForm, setPrecioForm] = useState({ precio_especial: '', descuento: '' });
  const { currentUser } = useAuthContext();
  const sucursal = (currentUser as any)?.id_sucursal;

  const loadDetalles = useCallback(async () => {
    setLoadingDetails(true);
    try {
      const data = await FetchData(`/inv/listas-precio/${lista.id}`, 'GET', {});
      setDetalles(data.detalles || []);
    } catch {
      toast.error('Error al cargar productos de la lista');
    } finally {
      setLoadingDetails(false);
    }
  }, [lista.id]);

  const loadProductos = useCallback(async () => {
    try {
      const data = await FetchData('/inv/productos', 'GET', { id_sucursal: sucursal });
      setProductos(data || []);
    } catch {
      toast.error('Error al cargar productos');
    }
  }, [sucursal]);

  useEffect(() => {
    loadDetalles();
    loadProductos();
  }, [loadDetalles, loadProductos]);

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_barra?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAgregar = (prod: Producto) => {
    setSelected(prod);
    setPrecioForm({ precio_especial: '', descuento: '' });
  };

  const handleGuardarPrecio = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await FetchData(`/inv/listas-precio/${lista.id}/productos`, 'POST', {
        producto_id: selected.id,
        precio_especial: precioForm.precio_especial ? Number(precioForm.precio_especial) : null,
        descuento: precioForm.descuento ? Number(precioForm.descuento) : 0
      });
      toast.success('Producto agregado a la lista');
      setSelected(null);
      await loadDetalles();
    } catch (err: any) {
      toast.error(err?.message || 'Error al agregar producto');
    } finally {
      setSaving(false);
    }
  };

  const handleQuitar = async (productoId: number) => {
    try {
      await FetchData(`/inv/listas-precio/${lista.id}/productos/${productoId}`, 'DELETE', {});
      toast.success('Producto quitado de la lista');
      await loadDetalles();
    } catch {
      toast.error('Error al quitar producto');
    }
  };

  const idsEnLista = new Set(detalles.map((d) => d.producto_id));

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className="flex items-center justify-between border-b">
        <Box>
          <Typography variant="h6">{lista.nombre}</Typography>
          <Typography variant="caption" color="text.secondary">
            Descuento global: {lista.descuento_global}% · {detalles.length} productos con precio
            especial
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className="p-0">
        <Box className="flex h-[60vh]">
          {/* Panel izquierdo: catálogo de productos */}
          <Box className="w-1/2 border-r flex flex-col p-4">
            <Typography variant="overline" color="text.secondary" className="mb-2">
              Agregar producto
            </Typography>
            <TextField
              size="small"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              className="mb-3"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }
              }}
            />
            <Box className="overflow-y-auto flex-1 space-y-1">
              {productosFiltrados.slice(0, 50).map((prod) => (
                <Box
                  key={prod.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    idsEnLista.has(prod.id) ? 'opacity-50' : ''
                  }`}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {prod.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {prod.codigo_barra} · ${prod.precio_venta?.toFixed(2)}
                    </Typography>
                  </Box>
                  {idsEnLista.has(prod.id) ? (
                    <Chip
                      label="En lista"
                      size="small"
                      color="success"
                      icon={<CheckCircleIcon />}
                    />
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAgregar(prod)}
                    >
                      Agregar
                    </Button>
                  )}
                </Box>
              ))}
            </Box>

            {selected && (
              <Box className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Typography variant="body2" fontWeight={600} color="primary" className="mb-2">
                  {selected.nombre} — base: ${selected.precio_venta?.toFixed(2)}
                </Typography>
                <Grid container spacing={2} className="mb-2">
                  <Grid item xs={6}>
                    <TextField
                      label="Precio especial"
                      type="number"
                      size="small"
                      fullWidth
                      placeholder="Dejar vacío para usar %"
                      value={precioForm.precio_especial}
                      onChange={(e) =>
                        setPrecioForm({ ...precioForm, precio_especial: e.target.value })
                      }
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          inputProps: { min: 0, step: 0.01 }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="O descuento"
                      type="number"
                      size="small"
                      fullWidth
                      placeholder="0"
                      value={precioForm.descuento}
                      onChange={(e) => setPrecioForm({ ...precioForm, descuento: e.target.value })}
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          inputProps: { min: 0, max: 100, step: 0.01 }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
                <Box className="flex gap-2">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleGuardarPrecio}
                    disabled={saving}
                    fullWidth
                  >
                    {saving ? <CircularProgress size={18} /> : 'Confirmar'}
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => setSelected(null)}>
                    Cancelar
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {/* Panel derecho: productos en la lista */}
          <Box className="w-1/2 flex flex-col p-4">
            <Typography variant="overline" color="text.secondary" className="mb-2">
              Productos con precio especial ({detalles.length})
            </Typography>
            {loadingDetails ? (
              <Box className="flex items-center justify-center flex-1">
                <CircularProgress />
              </Box>
            ) : detalles.length === 0 ? (
              <Box className="flex flex-col items-center justify-center flex-1 text-gray-400">
                <LocalOfferIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body2">Sin productos con precio especial</Typography>
                <Typography variant="caption" className="mt-1">
                  Se aplicará el {lista.descuento_global}% de descuento global a todos
                </Typography>
              </Box>
            ) : (
              <Box className="overflow-y-auto flex-1 space-y-1">
                {detalles.map((d) => (
                  <Box
                    key={d.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {d.producto_nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Base: ${d.precio_base?.toFixed(2)} →{' '}
                        <Typography
                          component="span"
                          variant="caption"
                          color="success.main"
                          fontWeight={600}
                        >
                          ${d.precio_final?.toFixed(2)}
                        </Typography>
                        {d.descuento ? ` (${d.descuento}% dto)` : ''}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleQuitar(d.producto_id)}
                      title="Quitar de la lista"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const PriceListsManagement = () => {
  const [listas, setListas] = useState<ListaPrecio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLista, setModalLista] = useState<Partial<ListaPrecio> | null | false>(false);
  const [modalProductos, setModalProductos] = useState<ListaPrecio | null>(null);
  const { currentUser } = useAuthContext();
  const sucursal = (currentUser as any)?.id_sucursal;

  const loadListas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await FetchData('inv/listas-precio', 'GET', { id_sucursal: sucursal });
      setListas(data || []);
    } catch {
      toast.error('Error al cargar listas de precio');
    } finally {
      setLoading(false);
    }
  }, [sucursal]);

  useEffect(() => {
    loadListas();
  }, [loadListas]);

  const handleEliminar = async (lista: ListaPrecio) => {
    if (!confirm(`¿Eliminar la lista "${lista.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await FetchData(`/inv/listas-precio/${lista.id}`, 'DELETE', {});
      toast.success('Lista eliminada');
      await loadListas();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar');
    }
  };

  return (
    <Fragment>
      <Container>
        <Card>
          <Box className="flex items-center justify-between px-5 py-4 border-b">
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Listas de Precio
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Asigna precios o descuentos especiales por tipo de cliente
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setModalLista({})}
            >
              Nueva Lista
            </Button>
          </Box>

          <CardContent>
            {loading ? (
              <Box className="flex items-center justify-center py-16">
                <CircularProgress />
              </Box>
            ) : listas.length === 0 ? (
              <Box className="flex flex-col items-center justify-center py-16 text-gray-400">
                <LocalOfferIcon sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="body1" fontWeight={500}>
                  No hay listas de precio
                </Typography>
                <Typography variant="body2" className="mt-1">
                  Crea tu primera lista para aplicar descuentos a clientes específicos
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  className="mt-4"
                  onClick={() => setModalLista({})}
                >
                  Crear primera lista
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {listas.map((lista) => (
                  <Grid item xs={12} sm={6} lg={4} key={lista.id}>
                    <Card variant="outlined" className="hover:shadow-md transition-shadow h-full">
                      <CardContent>
                        <Box className="flex items-start justify-between mb-2">
                          <Box className="flex-1">
                            <Typography variant="subtitle1" fontWeight={600}>
                              {lista.nombre}
                            </Typography>
                            {lista.descripcion && (
                              <Typography variant="caption" color="text.secondary">
                                {lista.descripcion}
                              </Typography>
                            )}
                          </Box>
                          <Chip
                            label={lista.estado ? 'Activa' : 'Inactiva'}
                            size="small"
                            color={lista.estado ? 'success' : 'error'}
                          />
                        </Box>

                        <Box className="flex items-center gap-4 mt-3">
                          <Box className="flex items-center gap-1">
                            <PercentIcon fontSize="small" color="primary" />
                            <Typography variant="caption" color="text.secondary">
                              {lista.descuento_global}% desc. global
                            </Typography>
                          </Box>
                          <Box className="flex items-center gap-1">
                            <InventoryIcon fontSize="small" color="info" />
                            <Typography variant="caption" color="text.secondary">
                              {lista.total_productos} prod. especiales
                            </Typography>
                          </Box>
                        </Box>

                        <Divider className="my-3" />

                        <Box className="flex gap-2">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<SettingsIcon />}
                            onClick={() => setModalProductos(lista)}
                            fullWidth
                          >
                            Productos
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => setModalLista(lista)}
                            title="Editar"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleEliminar(lista)}
                            title="Eliminar"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Container>

      {modalLista !== false && (
        <ListaModal
          lista={modalLista || null}
          onClose={() => setModalLista(false)}
          onSaved={loadListas}
        />
      )}

      {modalProductos && (
        <ProductosModal lista={modalProductos} onClose={() => setModalProductos(null)} />
      )}
    </Fragment>
  );
};

export default PriceListsManagement;
