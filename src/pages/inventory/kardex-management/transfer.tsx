import { useState, useEffect } from 'react';
import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import { toast } from 'sonner';
import {
  MenuItem,
  TextField,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type ProductoItem = {
  producto_id: number | null;
  precio_unitario: string;
  cantidad: string;
  series: string[];
  almacen_id?: number;
  percha_id?: any;
  perchas?: any[];
  id?: number; // id del producto_sinasignar
};

const CrearTransferencia = () => {
  const generate_random_string = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const numbers = '0123456789';
    for (let i = 0; i < 2; i++) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return result.toUpperCase();
  };

  const [tipo, setTipo] = useState<string>(''); // entrada, salida o ajuste
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [fecha, setFecha] = useState('');
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<any[]>([]);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [almacenOrigen, setAlmacenOrigen] = useState<number | null>(null);
  const [almacenDestino, setAlmacenDestino] = useState<number | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function load() {
      setAlmacenes(await FetchData('/inv/almacenes'));
      await fetchProductos(almacenOrigen);
    }
    load();
  }, [page, barcodeInput]);

  const fetchProductos = async (almacenId: number | null) => {
    if (!almacenId) {
      setProductosDisponibles([]);
      return;
    }
    const res = await FetchData(`/inv/producto_sinasignar/obtener_serie`, 'GET', {
      page,
      limit: 10,
      search: barcodeInput,
      almacen_id: Number(almacenId)
    });
    setProductosDisponibles(res.results || []);
    setTotalPages(Math.ceil((res.total || 0) / 10));
  };

  const subtotal = productos.reduce((acc, p) => {
    const cantidad = parseFloat(p.cantidad) || 0;
    const precio = parseFloat(p.precio_unitario) || 0;
    return acc + cantidad * precio;
  }, 0);

  const handleAgregarProducto = () => {
    setProductos([
      ...productos,
      {
        producto_id: null,
        precio_unitario: '',
        cantidad: '1',
        series: [generate_random_string(8)],
        almacen_id: undefined,
        percha_id: undefined
      }
    ]);
  };

  const handleProductoChange = (index: number, field: keyof ProductoItem, value: any) => {
    const newProds = [...productos];
    if (field === 'cantidad') {
      const cantidad = parseInt(value) || 1;
      newProds[index].series = Array.from({ length: cantidad }, () => generate_random_string(8));
      newProds[index][field] = value;
    } else {
      newProds[index][field] = value;
    }
    console.log(newProds[index]);
    setProductos(newProds);
  };

  const handleEliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const handleAddProducto = (prod: any) => {
    if (productos.some((p) => p.id === prod.id)) {
      toast.warning('Producto ya agregado');
      return;
    }
    console.log(prod);
    setProductos([
      ...productos,
      {
        producto_id: prod.producto_id,
        id: prod.id,
        precio_unitario: prod.precio_venta?.toString() || '',
        cantidad: '1',
        series: [prod.numero_serie || generate_random_string(8)],
        almacen_id: prod.almacen_id || undefined,
        percha_id: prod.percha_id || undefined
      }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!almacenOrigen || !almacenDestino) {
      toast.error('Seleccione almacén origen y destino');
      return;
    }
    if (almacenOrigen === almacenDestino) {
      toast.error('El almacén origen y destino deben ser diferentes');
      return;
    }
    if (
      productos.some((p) => !p.producto_id || !p.precio_unitario || !p.cantidad) ||
      productos.length === 0
    ) {
      toast.error('Complete todos los campos de los productos');
      return;
    }

    const productosBody = productos.map((p) => ({
      producto_id: p.producto_id,
      precio_unitario: parseFloat(p.precio_unitario),
      cantidad: parseFloat(p.cantidad),
      series: p.series,
      almacen_id: almacenOrigen, // solo para referencia, el backend lo usa por request
      percha_id: p.percha_id
    }));

    const body = {
      almacen_origen_id: almacenOrigen,
      almacen_destino_id: almacenDestino,
      observaciones,
      productos: productosBody
    };
    console.log(body);

    setLoading(true);
    try {
      const res = await FetchData('/inv/transferencia', 'POST', body);
      if (res.message) {
        toast.success(res.message);
        setAlmacenOrigen(null);
        setAlmacenDestino(null);
        setObservaciones('');
        setProductos([
          {
            producto_id: null,
            precio_unitario: '',
            cantidad: '1',
            series: [generate_random_string(8)],
            almacen_id: undefined,
            percha_id: undefined
          }
        ]);
        setBarcodeInput('');
        setProductosDisponibles([]);
        setPage(1);
      } else {
        toast.error('Error al registrar transferencia');
      }
    } catch (error) {
      toast.error('Error al registrar transferencia');
    }
    setLoading(false);
  };

  return (
    <Container>
      <h2 className="text-3xl font-bold mb-6">Transferencia de Inventario</h2>
      <form onSubmit={handleSubmit}>
        <Card className="rounded shadow-lg">
          <CardContent>
            <Grid container spacing={2} className="mb-6">
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Almacén Origen"
                  value={almacenOrigen ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value as string) : null;
                    setAlmacenOrigen(val);
                    setProductosDisponibles([]);
                    setPage(1);
                    setProductos([]);
                    fetchProductos(val);
                  }}
                  fullWidth
                  required
                  size="small"
                >
                  <MenuItem value="">-- Seleccione almacén --</MenuItem>
                  {almacenes.map((alm) => (
                    <MenuItem key={alm.id} value={alm.id}>
                      {alm.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Almacén Destino"
                  value={almacenDestino ?? ''}
                  onChange={(e) =>
                    setAlmacenDestino(e.target.value ? parseInt(e.target.value as string) : null)
                  }
                  fullWidth
                  required
                  size="small"
                >
                  <MenuItem value="">-- Seleccione almacén --</MenuItem>
                  {almacenes.map((alm) => (
                    <MenuItem key={alm.id} value={alm.id}>
                      {alm.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                />
              </Grid>
            </Grid>

            {/*  <div className="col-span-3 text-right mb-4">
          <button type="button" className="btn btn-primary" onClick={handleAgregarProducto}>
            Agregar Producto
          </button>
        </div> */}

            <Box mb={4}>
              <TextField
                placeholder="Buscar producto por nombre o código..."
                value={barcodeInput}
                onChange={(e) => {
                  setBarcodeInput(e.target.value);
                  setPage(1);
                }}
                fullWidth
              />
              <Grid container spacing={2} mt={1}>
                {productosDisponibles.map((prod) => (
                  <Grid item xs={6} sm={4} md={3} key={prod.id}>
                    <Card
                      onClick={() => handleAddProducto(prod)}
                      sx={{ cursor: 'pointer', height: '100%' }}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" noWrap>
                          {prod.nombre}
                        </Typography>
                        <Typography variant="body2">${prod.precio_venta}</Typography>
                        <Typography variant="caption" noWrap>
                          Serie: {prod.numero_serie}
                        </Typography>
                        {prod.foto_principal && (
                          <img
                            src={`${import.meta.env.VITE_APP_API_URL + '/storage/' + prod.foto_principal}`}
                            alt={prod.nombre}
                            style={{ width: '100%', height: '80px', objectFit: 'contain' }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            </Box>

            {/* Tabla Productos (MUI) */}
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell>Series</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productos.map((p, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ minWidth: 240 }}>
                        <TextField select fullWidth value={p.id ?? ''} disabled size="small">
                          <MenuItem value="" disabled>
                            -- Seleccione --
                          </MenuItem>
                          {productosDisponibles.map((prod) => (
                            <MenuItem key={prod.id} value={prod.id}>
                              {prod.nombre}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell align="right" sx={{ width: 120 }}>
                        <TextField
                          type="number"
                          inputProps={{ min: 1 }}
                          disabled
                          value={p.cantidad}
                          onChange={(e) => handleProductoChange(i, 'cantidad', e.target.value)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{p.series.join(', ')}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleEliminarProducto(i)}
                          title="Eliminar producto"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Botón enviar (MUI) */}
            <Box className="flex justify-end">
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Movimiento'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>
    </Container>
  );
};

export default CrearTransferencia;
