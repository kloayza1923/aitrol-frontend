import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Pagination,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FetchData } from '@/utils/FetchData';
import { AuthContext } from '@/auth/providers/JWTProvider';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';

interface Producto {
  id: number;
  nombre: string;
  precio_venta: number;
  numero_serie: string;
  foto_principal?: string;
  producto_id: number;
  almacen_id?: number;
  percha_id?: number;
}

interface ProductoItem {
  producto_id: number;
  producto_nombre: string;
  precio_unitario: number;
  cantidad: number;
  series: string[];
  descuento: number;
  iva: number;
  almacen_id?: number;
  percha_id?: number;
  id: number;
}

const QuoteCreate = () => {
  // Estados auxiliares
  const [clientes, setClientes] = useState<any[]>([{ id: 0, nombre: 'Cliente Anónimo' }]);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const currentUser = (auth as any)?.currentUser;
  const [cajaUser, setCajaUser] = useState<any>(null);

  // Formik initial values
  const initialValues = {
    fpagoId: '',
    valorPagado: 0,
    fechaPago: new Date().toISOString().split('T')[0],
    observacionesPago: '',
    estadoPago: 'pendiente',
    plazoPago: 0,
    clienteId: null as number | null,
    numero_cotizacion: `COT-${Date.now()}`,
    fecha: new Date().toISOString().split('T')[0],
    cajaId: null as number | null,
    productos: [] as ProductoItem[]
  };

  const validationSchema = Yup.object({
    clienteId: Yup.number().required('Seleccione un cliente').nullable(),
    numero_cotizacion: Yup.string().required('Requerido'),
    fecha: Yup.string().required('Requerido'),
    productos: Yup.array()
      .of(
        Yup.object({
          id: Yup.number().required(),
          producto_id: Yup.number().required(),
          producto_nombre: Yup.string().required(),
          precio_unitario: Yup.number().moreThan(0, 'Debe ser > 0').required('Requerido'),
          cantidad: Yup.number().integer().min(1).required('Requerido'),
          descuento: Yup.number().min(0, 'No puede ser negativo').default(0),
          iva: Yup.number().min(0, 'No puede ser negativo').default(0),
          series: Yup.array().of(Yup.string()).min(1, 'Sin series asignadas')
        })
      )
      .min(1, 'Debe agregar al menos un producto')
  });
  // Cargar clientes y productos
  const getCajaUser = async () => {
    if (!currentUser) return null;
    const data = await FetchData('/caja/caja-usuario/' + currentUser?.id);
    console.log('Caja user data:', data);
    setCajaUser(data);
    return data;
  };
  useEffect(() => {
    async function load() {
      try {
        const clientesData = await FetchData('/inv/clientes');
        setClientes([{ id: 0, nombre: 'Cliente Anónimo' }, ...clientesData]);
        await fetchProductos(); // carga inicial
        await getCajaUser();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar clientes o productos');
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, barcodeInput]);

  // Obtener productos con búsqueda y paginación
  const fetchProductos = async () => {
    try {
      const res = await FetchData(`/inv/producto_sinasignar/obtener_serie`, 'GET', {
        page,
        limit: 10,
        search: barcodeInput
      });
      setProductosDisponibles(res.results);
      setTotalPages(Math.ceil(res.total / 10));
    } catch (err) {
      console.error(err);
      toast.error('Error cargando productos');
    }
  };

  // Agregar producto manual (clic en card)
  // Helpers de UI
  const SectionCard: React.FC<{ title: string; subheader?: string; children: React.ReactNode }> = ({
    title,
    subheader,
    children
  }) => (
    <Card sx={{ mb: 2 }}>
      <CardHeader title={title} subheader={subheader} />
      <Divider />
      <CardContent>{children}</CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values, { resetForm }) => {
          if (!values.numero_cotizacion || values.productos.length === 0) {
            toast.error('Complete la cotización');
            return;
          }

          const detalles = values.productos.map((p) => ({
            producto_id: p.producto_id,
            precio_unitario: p.precio_unitario,
            cantidad: p.cantidad,
            descuento: p.descuento,
            iva: p.iva,
            series: p.series,
            almacen_id: p.almacen_id,
            percha_id: p.percha_id
          }));

          // Calculamos total como fallback si valorPagado es 0
          const subtotal = values.productos.reduce(
            (acc, p) => acc + (p.precio_unitario || 0) * (p.cantidad || 0),
            0
          );
          const totalDescuento = values.productos.reduce((acc, p) => acc + (p.descuento || 0), 0);
          const totalIva = values.productos.reduce((acc, p) => acc + (p.iva || 0), 0);
          const total = subtotal - totalDescuento + totalIva;

          setLoading(true);
          try {
            const res = await FetchData('/inv/cotizaciones', 'POST', {
              cliente_id: values.clienteId || 0,
              numero_cotizacion: values.numero_cotizacion,
              fecha: values.fecha,
              detalles
            });
            if (res.message) {
              toast.success(res.message);
              resetForm({ values: { ...initialValues, numero_cotizacion: `COT-${Date.now()}` } });
              setBarcodeInput('');
              navigate('/inventory/quote-management');
            } else {
              toast.error('Error al crear cotización');
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al crear cotización');
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ values, errors, touched, handleChange, setFieldValue }) => {
          const subtotal = values.productos.reduce(
            (acc, p) => acc + (p.precio_unitario || 0) * (p.cantidad || 0),
            0
          );
          const totalDescuento = values.productos.reduce((acc, p) => acc + (p.descuento || 0), 0);
          const totalIva = values.productos.reduce((acc, p) => acc + (p.iva || 0), 0);
          const total = subtotal - totalDescuento + totalIva;

          const handleAddManualProduct = (prod: Producto) => {
            const existing = values.productos.find((p) => p.id === prod.id);
            if (existing) {
              toast.warning('Producto ya agregado');
              return;
            }
            const newItem: ProductoItem = {
              id: prod.id,
              producto_id: prod.producto_id,
              producto_nombre: prod.nombre,
              precio_unitario: Number(prod.precio_venta) || 0,
              almacen_id: prod.almacen_id,
              percha_id: prod.percha_id,
              cantidad: 1,
              series: [prod.numero_serie],
              descuento: 0,
              iva: 0
            };
            setFieldValue('productos', [...values.productos, newItem]);
          };

          const currency = (n: number) => `$${(n || 0).toFixed(2)}`;

          return (
            <Form>
              <Grid container spacing={2}>
                {/* Columna izquierda - Factura */}
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" gutterBottom>
                    Punto de Venta
                  </Typography>

                  <SectionCard title="Cliente y Factura">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={12}>
                        <FormControl
                          fullWidth
                          error={Boolean(touched.clienteId && (errors as any).clienteId)}
                        >
                          <InputLabel>Cliente</InputLabel>
                          <Select
                            label="Cliente"
                            value={values.clienteId ?? ''}
                            onChange={(e) => {
                              const v = e.target.value as unknown as number | '';
                              setFieldValue('clienteId', v === '' ? null : Number(v));
                            }}
                          >
                            {clientes.map((c) => (
                              <MenuItem key={c.id} value={c.id}>
                                {c.nombre}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>
                            {(touched as any).clienteId && (errors as any).clienteId}
                          </FormHelperText>
                        </FormControl>
                        <TextField
                          sx={{ mt: 2 }}
                          label="Número de Cotización"
                          name="numero_cotizacion"
                          value={values.numero_cotizacion}
                          onChange={handleChange}
                          error={Boolean(touched.numero_cotizacion && errors.numero_cotizacion)}
                          helperText={
                            touched.numero_cotizacion && (errors.numero_cotizacion as any)
                          }
                          fullWidth
                          required
                        />
                        <TextField
                          sx={{ mt: 2 }}
                          type="date"
                          label="Fecha"
                          name="fecha"
                          InputLabelProps={{ shrink: true }}
                          value={values.fecha}
                          onChange={handleChange}
                          error={Boolean(touched.fecha && errors.fecha)}
                          helperText={touched.fecha && (errors.fecha as any)}
                          fullWidth
                          required
                        />
                      </Grid>
                      {/*     <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={Boolean(touched.fpagoId && errors.fpagoId)}>
                          <InputLabel>Forma de Pago</InputLabel>
                          <Select
                            label="Forma de Pago"
                            name="fpagoId"
                            value={values.fpagoId}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Seleccione...</MenuItem>
                            <MenuItem value="1">Efectivo</MenuItem>
                            <MenuItem value="2">Transferencia</MenuItem>
                            <MenuItem value="3">Tarjeta de crédito</MenuItem>
                            <MenuItem value="4">Tarjeta de débito</MenuItem>
                            <MenuItem value="5">Cheque</MenuItem>
                            <MenuItem value="6">Depósito bancario</MenuItem>
                            <MenuItem value="7">Pago móvil</MenuItem>
                            <MenuItem value="8">Crédito a plazo</MenuItem>
                          </Select>
                          <FormHelperText>
                            {touched.fpagoId && (errors.fpagoId as any)}
                          </FormHelperText>
                        </FormControl>
                        <TextField
                          sx={{ mt: 2 }}
                          label="Valor Pagado"
                          type="number"
                          name="valorPagado"
                          value={values.valorPagado}
                          onChange={(e) => setFieldValue('valorPagado', Number(e.target.value))}
                          error={Boolean(touched.valorPagado && errors.valorPagado)}
                          helperText={touched.valorPagado && (errors.valorPagado as any)}
                          fullWidth
                          required
                        />
                        {(values.fpagoId === '8' || values.fpagoId === '5') && (
                          <TextField
                            sx={{ mt: 2 }}
                            label="Fecha de Pago"
                            type="date"
                            name="fechaPago"
                            InputLabelProps={{ shrink: true }}
                            value={values.fechaPago}
                            onChange={handleChange}
                            error={Boolean(touched.fechaPago && errors.fechaPago)}
                            helperText={touched.fechaPago && (errors.fechaPago as any)}
                            fullWidth
                            required
                          />
                        )}
                        {values.fpagoId === '8' && (
                          <TextField
                            sx={{ mt: 2 }}
                            label="Plazo de Pago (días)"
                            type="number"
                            name="plazoPago"
                            value={values.plazoPago}
                            onChange={(e) => setFieldValue('plazoPago', Number(e.target.value))}
                            error={Boolean(touched.plazoPago && errors.plazoPago)}
                            helperText={touched.plazoPago && (errors.plazoPago as any)}
                            fullWidth
                            required
                          />
                        )}
                        <TextField
                          sx={{ mt: 2 }}
                          label="Observaciones"
                          name="observacionesPago"
                          value={values.observacionesPago}
                          onChange={handleChange}
                          multiline
                          rows={2}
                          fullWidth
                          helperText={
                            touched.observacionesPago && (errors.observacionesPago as any)
                          }
                        />
                        <FormControl
                          fullWidth
                          sx={{ mt: 2 }}
                          error={Boolean(touched.estadoPago && errors.estadoPago)}
                        >
                          <InputLabel>Estado de Pago</InputLabel>
                          <Select
                            label="Estado de Pago"
                            name="estadoPago"
                            value={values.estadoPago}
                            onChange={handleChange}
                            required
                          >
                            <MenuItem value="pendiente">Pendiente</MenuItem>
                            <MenuItem value="pagado">Pagado</MenuItem>
                            <MenuItem value="parcial">Parcial</MenuItem>
                            <MenuItem value="anulado">Anulado</MenuItem>
                          </Select>
                          <FormHelperText>
                            {touched.estadoPago && (errors.estadoPago as any)}
                          </FormHelperText>
                        </FormControl>
                        <FormControl
                          fullWidth
                          sx={{ mt: 2 }}
                          error={Boolean(touched.cajaId && errors.cajaId)}
                        >
                          <InputLabel>Caja</InputLabel>
                          <Select
                            label="Caja"
                            value={values.cajaId ?? ''}
                            onChange={(e) => {
                              const v = e.target.value as unknown as number | '';
                              setFieldValue('cajaId', v === '' ? null : Number(v));
                            }}
                            
                          >
                            <MenuItem value="">Seleccione...</MenuItem>
                            {cajaUser?.map((caja: { caja_id: number; nombre_caja: string }) => (
                              <MenuItem key={caja.caja_id} value={caja.caja_id}>
                                {caja.nombre_caja}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>
                            {touched.cajaId && (errors.cajaId as any)}
                          </FormHelperText>
                        </FormControl>
                      </Grid> */}
                    </Grid>
                  </SectionCard>

                  <SectionCard title="Detalle de productos">
                    <FieldArray name="productos">
                      {({ remove }) => (
                        <Box>
                          <table className="w-full table-auto border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Producto</th>
                                <th className="border p-2 text-right">Cant</th>
                                <th className="border p-2 text-right">Precio</th>
                                <th className="border p-2 text-right">Desc</th>
                                <th className="border p-2 text-right">IVA</th>
                                <th className="border p-2 text-center">-</th>
                              </tr>
                            </thead>
                            <tbody>
                              {values.productos.map((p, i) => (
                                <tr key={i}>
                                  <td className="border p-2">
                                    <Typography variant="body2">{p.producto_nombre}</Typography>
                                    {(touched.productos as any)?.[i]?.series &&
                                      (errors.productos as any)?.[i]?.series && (
                                        <Typography variant="caption" color="error">
                                          Debe asignar series
                                        </Typography>
                                      )}
                                  </td>
                                  <td className="border p-2 text-right" style={{ width: 80 }}>
                                    {p.cantidad}
                                  </td>
                                  <td className="border p-2 text-right">
                                    <TextField
                                      type="number"
                                      value={p.precio_unitario}
                                      onChange={(e) =>
                                        setFieldValue(
                                          `productos.${i}.precio_unitario`,
                                          Number(e.target.value)
                                        )
                                      }
                                      error={Boolean(
                                        (touched.productos as any)?.[i]?.precio_unitario &&
                                          (errors.productos as any)?.[i]?.precio_unitario
                                      )}
                                      helperText={
                                        (touched.productos as any)?.[i]?.precio_unitario &&
                                        (errors.productos as any)?.[i]?.precio_unitario
                                      }
                                      sx={{ width: 100 }}
                                      size="small"
                                    />
                                  </td>
                                  <td className="border p-2 text-right">
                                    <TextField
                                      type="number"
                                      value={p.descuento}
                                      onChange={(e) =>
                                        setFieldValue(
                                          `productos.${i}.descuento`,
                                          Number(e.target.value)
                                        )
                                      }
                                      error={Boolean(
                                        (touched.productos as any)?.[i]?.descuento &&
                                          (errors.productos as any)?.[i]?.descuento
                                      )}
                                      helperText={
                                        (touched.productos as any)?.[i]?.descuento &&
                                        (errors.productos as any)?.[i]?.descuento
                                      }
                                      sx={{ width: 100 }}
                                      size="small"
                                    />
                                  </td>
                                  <td className="border p-2 text-right">
                                    <TextField
                                      type="number"
                                      value={p.iva}
                                      onChange={(e) =>
                                        setFieldValue(`productos.${i}.iva`, Number(e.target.value))
                                      }
                                      error={Boolean(
                                        (touched.productos as any)?.[i]?.iva &&
                                          (errors.productos as any)?.[i]?.iva
                                      )}
                                      helperText={
                                        (touched.productos as any)?.[i]?.iva &&
                                        (errors.productos as any)?.[i]?.iva
                                      }
                                      sx={{ width: 100 }}
                                      size="small"
                                    />
                                  </td>
                                  <td className="border p-2 text-center">
                                    <IconButton color="error" onClick={() => remove(i)}>
                                      <DeleteIcon />
                                    </IconButton>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {typeof errors.productos === 'string' && (
                            <Typography variant="caption" color="error">
                              {errors.productos}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </FieldArray>
                  </SectionCard>

                  <Card sx={{ p: 2 }}>
                    <Grid container>
                      <Grid item xs={12} sm={6}>
                        <Typography>Subtotal: {currency(subtotal)}</Typography>
                        <Typography>Descuento: -{currency(totalDescuento)}</Typography>
                        <Typography>IVA: {currency(totalIva)}</Typography>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        display="flex"
                        justifyContent="flex-end"
                        alignItems="center"
                      >
                        <Typography variant="h6">Total: {currency(total)}</Typography>
                      </Grid>
                    </Grid>
                    <Box display="flex" justifyContent="flex-end" mt={2}>
                      <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Procesando...' : 'Finalizar Venta'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>

                {/* Columna derecha - Catálogo */}
                <Grid item xs={12} md={4}>
                  <SectionCard title="Buscar productos">
                    <TextField
                      placeholder="Escanear código de barras o buscar..."
                      inputRef={barcodeRef}
                      autoFocus
                      value={barcodeInput}
                      onChange={(e) => {
                        setBarcodeInput(e.target.value);
                        setPage(1); // reset paginación al buscar
                      }}
                      fullWidth
                    />
                  </SectionCard>

                  <Grid container spacing={2}>
                    {productosDisponibles?.map((prod) => (
                      <Grid item xs={12} sm={6} key={prod.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" noWrap>
                              {prod.nombre}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {currency(prod.precio_venta)}
                            </Typography>
                            <Typography variant="caption" noWrap>
                              Serie: {prod.numero_serie}
                            </Typography>
                            <Box mt={1}>
                              <img
                                src={`${import.meta.env.VITE_APP_API_URL + '/storage/' + (prod.foto_principal || 'placeholder.png')}`}
                                alt={prod.nombre}
                                style={{ width: '100%', height: '100px', objectFit: 'contain' }}
                              />
                            </Box>
                          </CardContent>
                          <Box px={2} pb={2}>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() => handleAddManualProduct(prod)}
                            >
                              Agregar
                            </Button>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                    {productosDisponibles?.length === 0 && (
                      <Grid item xs={12}>
                        <Card>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              No se encontraron productos.
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                  <Box mt={2} display="flex" justifyContent="center">
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Form>
          );
        }}
      </Formik>
    </Container>
  );
};

export default QuoteCreate;
