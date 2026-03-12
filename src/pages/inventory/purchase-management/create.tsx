import { useState, useEffect, useContext } from 'react';
import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import { toast } from 'sonner';
import {
  MenuItem,
  TextField,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  IconButton,
  Divider,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  ShoppingCart,
  CalendarToday,
  Receipt,
  LocalShipping
} from '@mui/icons-material';
import { AuthContext } from '@/auth/providers/JWTProvider';

type ProductoItem = {
  producto_id: number | null;
  precio_unitario: string;
  cantidad: string;
  series: string[]; // ahora es un array de series
  descuento: string;
  iva: string;
  almacen_id?: number;
  percha_id?: number | null;
  perchas?: any[];
};

const CompraFactura = () => {
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
  const { currentUser } = useContext(AuthContext);
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [fecha, setFecha] = useState('');
  const [cajaUser, setCajaUser] = useState<any>(null);
  const [cajaId, setCajaId] = useState<number | null>(null);
  const [fpagoId, setFpagoId] = useState<number | null>(null);
  const [plazoPago, setPlazoPago] = useState<string>('');
  const [fechaPago, setFechaPago] = useState('');
  const [productos, setProductos] = useState<ProductoItem[]>([
    {
      producto_id: null,
      precio_unitario: '',
      cantidad: '1',
      series: [generate_random_string(8)],
      descuento: '0',
      iva: '0',
      almacen_id: undefined,
      percha_id: null
    }
  ]);

  const [proveedores, setProveedores] = useState<any[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  //const [perchas, setPerchas] = useState<any[]>([]);
  const getAlmacenes = async () => {
    const data = await FetchData('/inv/almacenes');
    setAlmacenes(data);
  };
  const getPerchas = async (almacenId: number, index: number) => {
    if (!almacenId) return;
    const data = await FetchData(`/inv/perchas`, 'GET', { almacen_id: almacenId });
    const newProds = [...productos];
    newProds[index].perchas = data;
    newProds[index].percha_id = undefined; // resetear selección
    setProductos(newProds);
  };
  const getCajaUser = async () => {
    if (!currentUser) return null;
    const data = await FetchData('/caja/caja-usuario/' + currentUser?.id);
    setCajaUser(data);
    return data;
  };
  useEffect(() => {
    async function load() {
      setProveedores(await FetchData('/inv/proveedores'));
      setProductosDisponibles(await FetchData('/inv/productos'));
      getAlmacenes();
      getCajaUser();
    }
    load();
  }, []);

  // Calcula subtotal y total
  const subtotal = productos.reduce((acc, p) => {
    const cantidad = parseFloat(p.cantidad) || 0;
    const precio = parseFloat(p.precio_unitario) || 0;
    return acc + cantidad * precio;
  }, 0);

  const total = productos.reduce((acc, p) => {
    const cantidad = parseFloat(p.cantidad) || 0;
    const precio = parseFloat(p.precio_unitario) || 0;
    const descuento = parseFloat(p.descuento) || 0;
    const iva = parseFloat(p.iva) || 0;
    return acc + cantidad * precio - descuento + iva;
  }, 0);

  const handleAgregarProducto = () => {
    setProductos([
      ...productos,
      {
        producto_id: null,
        precio_unitario: '',
        cantidad: '1',
        series: [generate_random_string(8)],
        descuento: '0',
        iva: '0'
      }
    ]);
  };

  const handleProductoChange = (index: number, field: keyof ProductoItem, value: any) => {
    const newProds = [...productos];
    if (field === 'cantidad') {
      const cantidad = parseInt(value) || 1;
      // Generar series según cantidad automáticamente
      newProds[index].series = Array.from({ length: cantidad }, () => generate_random_string(8));
      newProds[index][field] = value as never;
    } else {
      newProds[index][field] = value as never;
    }
    setProductos(newProds);
  };

  const handleEliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorId) {
      toast.error('Seleccione un proveedor');
      return;
    }
    if (!numeroFactura) {
      toast.error('Ingrese un número de factura');
      return;
    }
    if (
      productos.some((p) => !p.producto_id || !p.precio_unitario || !p.cantidad) ||
      productos.length === 0
    ) {
      toast.error('Complete todos los campos de los productos');
      return;
    }

    const detalles = productos.map((p) => ({
      producto_id: p.producto_id,
      precio_unitario: parseFloat(p.precio_unitario),
      cantidad: parseFloat(p.cantidad),
      series: p.series, // enviamos el array completo
      descuento: parseFloat(p.descuento),
      iva: parseFloat(p.iva),
      almacen_id: p.almacen_id,
      percha_id: p.percha_id
    }));

    setLoading(true);
    try {
      const res = await FetchData('/inv/compras', 'POST', {
        proveedor_id: proveedorId,
        numero_factura: numeroFactura,
        fecha,
        descuento: productos.reduce((acc, p) => acc + (parseFloat(p.descuento) || 0), 0),
        observaciones,
        fpago_id: fpagoId,
        plazo_pago: plazoPago,
        fecha_pago: fechaPago,
        total,
        subtotal,
        id_caja: cajaId,
        detalles
      });
      if (res.message) {
        toast.success(res.message);
        setProveedorId(null);
        setObservaciones('');
        setNumeroFactura('');
        setFecha('');
        setProductos([
          {
            producto_id: null,
            precio_unitario: '',
            cantidad: '1',
            series: [generate_random_string(8)],
            descuento: '0',
            iva: '0'
          }
        ]);
      } else {
        toast.error('Error al crear compra');
      }
    } catch {
      toast.error('Error al crear compra');
    }
    setLoading(false);
  };

  return (
    <Container>
      <Box className="mb-6">
        <Box className="flex items-center gap-3 mb-2">
          <ShoppingCart className="text-primary" sx={{ fontSize: 40 }} />
          <Typography variant="h4" fontWeight={700}>
            Factura de Compra
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Registra una nueva compra de productos con su respectiva factura
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        {/* Card de Información General */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <Box className="flex items-center gap-2 mb-4">
              <Receipt className="text-primary" />
              <Typography variant="h6" fontWeight={600}>
                Información General
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Proveedor"
                  value={proveedorId ?? ''}
                  onChange={(e) => setProveedorId(e.target.value ? parseInt(e.target.value) : null)}
                  required
                  variant="outlined"
                >
                  <MenuItem value="">-- Seleccione proveedor --</MenuItem>
                  {proveedores.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.razon_social}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Número de Factura"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Receipt className="mr-2 text-gray-400" fontSize="small" />
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <CalendarToday className="mr-2 text-gray-400" fontSize="small" />
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Caja"
                  value={cajaId ?? ''}
                  onChange={(e) => {
                    console.log('Caja seleccionada:', e.target.value);
                    setCajaId(e.target.value ? parseInt(e.target.value) : null);
                  }}
                  required
                  variant="outlined"
                >
                  <MenuItem value="">-- Seleccione caja --</MenuItem>
                  {cajaUser?.map((c: any) => (
                    <MenuItem key={c.id} value={c.caja_id}>
                      {c.nombre_caja}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Forma de Pago"
                  value={fpagoId ?? ''}
                  onChange={(e) => setFpagoId(e.target.value ? parseInt(e.target.value) : null)}
                  required
                  variant="outlined"
                >
                  <MenuItem value="">-- Seleccione forma de pago --</MenuItem>
                  <MenuItem value={1}>Contado</MenuItem>
                  <MenuItem value={2}>Crédito</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Plazo de Pago"
                  value={plazoPago}
                  onChange={(e) => setPlazoPago(e.target.value)}
                  placeholder="Ej: 30 días"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Pago"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  variant="outlined"
                  placeholder="Notas adicionales sobre la compra..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Card de Productos */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <Box className="flex items-center justify-between mb-4">
              <Box className="flex items-center gap-2">
                <LocalShipping className="text-primary" />
                <Typography variant="h6" fontWeight={600}>
                  Detalle de Productos
                </Typography>
                <Chip label={`${productos.length} items`} size="small" color="primary" />
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAgregarProducto}
                size="small"
              >
                Agregar Producto
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-semibold">Producto</TableCell>
                    <TableCell className="font-semibold">Almacén</TableCell>
                    <TableCell className="font-semibold">Percha</TableCell>
                    <TableCell className="font-semibold text-right">Cantidad</TableCell>
                    <TableCell className="font-semibold text-right">Precio Unit.</TableCell>
                    <TableCell className="font-semibold">Series</TableCell>
                    <TableCell className="font-semibold text-right">Descuento</TableCell>
                    <TableCell className="font-semibold text-right">IVA</TableCell>
                    <TableCell className="font-semibold text-center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productos.map((p, i) => (
                    <TableRow key={i} className="hover:bg-gray-50">
                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          sx={{
                            minWidth: 100
                          }}
                          value={p.producto_id ?? ''}
                          onChange={(e) => {
                            handleProductoChange(
                              i,
                              'producto_id',
                              e.target.value ? parseInt(e.target.value) : null
                            );
                          }}
                          required
                        >
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

                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          sx={{ minWidth: 100 }}
                          disabled={!p.producto_id}
                          value={p.almacen_id ?? ''}
                          onChange={(e) => {
                            const almacenId = e.target.value ? parseInt(e.target.value) : null;
                            handleProductoChange(i, 'almacen_id', almacenId);
                            if (almacenId) getPerchas(almacenId, i);
                          }}
                          required
                        >
                          <MenuItem value="" disabled>
                            -- Seleccione --
                          </MenuItem>
                          {almacenes.map((alm) => (
                            <MenuItem key={alm.id} value={alm.id}>
                              {alm.nombre}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>

                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          sx={{ minWidth: 100 }}
                          value={p.percha_id ?? ''}
                          onChange={(e) =>
                            handleProductoChange(
                              i,
                              'percha_id',
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          disabled={!p.almacen_id}
                          required
                        >
                          <MenuItem value="" disabled>
                            -- Seleccione --
                          </MenuItem>
                          {(p.perchas ?? []).map((per: any) => (
                            <MenuItem key={per.id} value={per.id}>
                              {per.nombre}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>

                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 1, step: 1 }}
                          value={p.cantidad}
                          onChange={(e) => handleProductoChange(i, 'cantidad', e.target.value)}
                          required
                          sx={{ width: 80 }}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={p.precio_unitario}
                          onChange={(e) =>
                            handleProductoChange(i, 'precio_unitario', e.target.value)
                          }
                          required
                          sx={{ width: 100 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" className="text-gray-600">
                          {p.series.join(', ')}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={p.descuento}
                          onChange={(e) => handleProductoChange(i, 'descuento', e.target.value)}
                          required
                          sx={{ width: 100 }}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={p.iva}
                          onChange={(e) => handleProductoChange(i, 'iva', e.target.value)}
                          required
                          sx={{ width: 100 }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        {productos.length > 1 && (
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleEliminarProducto(i)}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Card de Totales */}
        <Card className="mb-6 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <Typography variant="h6" fontWeight={600} className="mb-4">
              Resumen de Compra
            </Typography>
            <Divider className="mb-4" />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper className="p-4 bg-white shadow-sm">
                  <Typography variant="body2" color="text.secondary" className="mb-1">
                    Subtotal
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    ${subtotal.toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper className="p-4 bg-white shadow-sm">
                  <Typography variant="body2" color="text.secondary" className="mb-1">
                    Descuento
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="error">
                    -$
                    {productos
                      .reduce((acc, p) => acc + (parseFloat(p.descuento) || 0), 0)
                      .toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper className="p-4 bg-white shadow-sm">
                  <Typography variant="body2" color="text.secondary" className="mb-1">
                    IVA
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    ${productos.reduce((acc, p) => acc + (parseFloat(p.iva) || 0), 0).toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper className="p-4 bg-gradient-to-r from-green-500 to-green-600 shadow-md">
                  <Typography variant="body2" className="mb-1 text-dark-100 dark:text-gray-300">
                    Total
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    className="dark:text-white text-dark-100"
                  >
                    ${total.toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" size="large" disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={loading ? null : <Save />}
            disabled={loading}
            className="px-8"
          >
            {loading ? 'Guardando...' : 'Guardar Compra'}
          </Button>
        </Stack>
      </form>
    </Container>
  );
};

export default CompraFactura;
