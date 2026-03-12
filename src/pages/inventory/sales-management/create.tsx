import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FetchData } from '@/utils/FetchData';
import { AuthContext } from '@/auth/providers/JWTProvider';
import { FieldArray, Form, Formik } from 'formik';
import * as Yup from 'yup';

// ─── Tipos ───────────────────────────────────────────────────────────────────

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
  id: number;
  producto_id: number;
  producto_nombre: string;
  precio_base: number;       // Precio original del catálogo (referencia)
  precio_unitario: number;   // Precio usado (puede ser precio_especial de lista)
  cantidad: number;
  series: string[];
  descuento_pct: number;     // % de descuento (0–100)
  descuento: number;         // Calculado: precio_unitario * cantidad * descuento_pct / 100
  iva_pct: number;           // % de IVA (0, 5, 8, 12, 15)
  iva: number;               // Calculado: (subtotal_linea - descuento) * iva_pct / 100
  almacen_id?: number;
  percha_id?: number;
  lista_precio_aplicada?: boolean; // Indicador visual de descuento de lista
}

interface ListaPrecioData {
  id: number;
  nombre: string;
  descripcion: string;
  descuento_global: number;
  detalles: {
    producto_id: number;
    precio_especial: number | null;
    descuento: number | null;
    precio_base: number;
    precio_final: number;
  }[];
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const IVA_RATES = [
  { value: 0,  label: '0% (Exento)' },
  { value: 5,  label: '5%'          },
  { value: 8,  label: '8%'          },
  { value: 12, label: '12%'         },
  { value: 15, label: '15%'         }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const currency = (n: number) => `$${(n || 0).toFixed(2)}`;

/** Recalcula descuento e iva en $ a partir de los porcentajes */
const recalcProducto = (p: ProductoItem): ProductoItem => {
  const subtotalLinea = (p.precio_unitario || 0) * (p.cantidad || 0);
  const descuento     = parseFloat((subtotalLinea * (p.descuento_pct || 0) / 100).toFixed(4));
  const baseIva       = subtotalLinea - descuento;
  const iva           = parseFloat((baseIva * (p.iva_pct || 0) / 100).toFixed(4));
  return { ...p, descuento, iva };
};

/** Aplica la lista de precio de un cliente a un ProductoItem */
const applyListaPrice = (p: ProductoItem, lista: ListaPrecioData): ProductoItem => {
  const detalle = lista.detalles.find((d) => d.producto_id === p.producto_id);

  let precio_unitario   = p.precio_base;
  let descuento_pct     = 0;
  let lista_precio_aplicada = false;

  if (detalle) {
    if (detalle.precio_especial !== null) {
      // Precio fijo especial: lo usamos directamente, sin % de descuento adicional
      precio_unitario       = detalle.precio_especial;
      descuento_pct         = 0;
      lista_precio_aplicada = true;
    } else if (detalle.descuento && detalle.descuento > 0) {
      descuento_pct         = detalle.descuento;
      lista_precio_aplicada = true;
    }
  } else if (lista.descuento_global > 0) {
    // Descuento global de la lista
    descuento_pct         = lista.descuento_global;
    lista_precio_aplicada = true;
  }

  return recalcProducto({ ...p, precio_unitario, descuento_pct, lista_precio_aplicada });
};

// ─── Componente principal ────────────────────────────────────────────────────

const VentaFacturaPOS = () => {
  const [clientes,              setClientes]              = useState<any[]>([{ id: 0, nombre: 'Cliente Anónimo' }]);
  const [productosDisponibles,  setProductosDisponibles]  = useState<Producto[]>([]);
  const [barcodeInput,          setBarcodeInput]          = useState('');
  const [loading,               setLoading]               = useState(false);
  const [page,                  setPage]                  = useState(1);
  const [totalPages,            setTotalPages]            = useState(1);
  const [cajaUser,              setCajaUser]              = useState<any>(null);
  const [clienteListaPrecio,    setClienteListaPrecio]    = useState<ListaPrecioData | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const navigate   = useNavigate();
  const auth       = useContext(AuthContext);
  const currentUser = (auth as any)?.currentUser;

  // ── Valores iniciales Formik ──────────────────────────────────────────────
  const initialValues = {
    fpagoId:            '',
    valorPagado:        0,
    fechaPago:          new Date().toISOString().split('T')[0],
    observacionesPago:  '',
    estadoPago:         'pendiente',
    plazoPago:          0,
    clienteId:          null as number | null,
    numeroFactura:      `POS-${Date.now()}`,
    fecha:              new Date().toISOString().split('T')[0],
    cajaId:             null as number | null,
    productos:          [] as ProductoItem[]
  };

  // ── Validaciones Yup ──────────────────────────────────────────────────────
  const validationSchema = Yup.object({
    fpagoId: Yup.string().required('Seleccione la forma de pago'),

    valorPagado: Yup.number()
      .min(0, 'Debe ser ≥ 0')
      .required('Requerido'),

    fechaPago: Yup.string().when('fpagoId', (fpagoId, schema) =>
      fpagoId && (fpagoId as any)[0] && ['5', '8'].includes((fpagoId as any)[0])
        ? schema.required('Fecha de pago requerida para este método')
        : schema
    ),

    plazoPago: Yup.number().when('fpagoId', (fpagoId, schema) =>
      fpagoId && (fpagoId as any)[0] === '8'
        ? schema
            .integer('Debe ser un número entero de días')
            .min(1, 'Mínimo 1 día de plazo')
            .required('Requerido para crédito a plazo')
        : schema
    ),

    observacionesPago: Yup.string().max(500, 'Máximo 500 caracteres').nullable(),

    estadoPago: Yup.string()
      .oneOf(['pendiente', 'pagado', 'parcial', 'anulado'], 'Estado inválido')
      .required('Requerido'),

    clienteId: Yup.number()
      .typeError('Seleccione un cliente')
      .required('Seleccione un cliente')
      .nullable(),

    numeroFactura: Yup.string()
      .required('Número de factura requerido')
      .max(50, 'Máximo 50 caracteres'),

    fecha: Yup.string().required('Fecha requerida'),

    cajaId: Yup.number()
      .typeError('Seleccione una caja')
      .required('Seleccione una caja'),

    productos: Yup.array()
      .of(
        Yup.object({
          id:              Yup.number().required(),
          producto_id:     Yup.number().required(),
          producto_nombre: Yup.string().required(),

          precio_unitario: Yup.number()
            .moreThan(0, 'El precio debe ser mayor a 0')
            .required('Requerido'),

          cantidad: Yup.number()
            .integer('Debe ser entero')
            .min(1, 'Mínimo 1')
            .required('Requerido'),

          descuento_pct: Yup.number()
            .min(0,   'No puede ser negativo')
            .max(100, 'No puede superar 100%')
            .required()
            .default(0),

          iva_pct: Yup.number()
            .oneOf([0, 5, 8, 12, 15], 'Tasa de IVA inválida')
            .required()
            .default(0),

          series: Yup.array()
            .of(Yup.string())
            .min(1, 'Debe tener al menos una serie asignada')
        })
      )
      .min(1, 'Agregue al menos un producto')
  });

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const getCajaUser = async () => {
    if (!currentUser) return null;
    const data = await FetchData('/caja/caja-usuario/' + currentUser?.id);
    setCajaUser(data);
    return data;
  };

  const fetchProductos = async () => {
    try {
      const res = await FetchData('/inv/producto_sinasignar/obtener_serie', 'GET', {
        page,
        limit: 10,
        search: barcodeInput
      });
      setProductosDisponibles(res.results);
      setTotalPages(Math.ceil(res.total / 10));
    } catch (err) {
      toast.error('Error cargando productos');
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const clientesData = await FetchData('/inv/clientes');
        setClientes([{ id: 0, nombre: 'Cliente Anónimo' }, ...clientesData]);
        await fetchProductos();
        await getCajaUser();
      } catch {
        toast.error('Error al cargar datos iniciales');
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, barcodeInput]);

  // ── Lista de precio: cargar al cambiar cliente ────────────────────────────
  const handleClienteChange = async (
    clienteId:    number | null,
    productos:    ProductoItem[],
    setFieldValue: (field: string, value: any) => void
  ) => {
    setFieldValue('clienteId', clienteId);

    if (!clienteId || clienteId === 0) {
      setClienteListaPrecio(null);
      // Resetear descuentos de lista en productos existentes
      if (productos.length > 0) {
        const resetted = productos.map((p) =>
          recalcProducto({ ...p, precio_unitario: p.precio_base, descuento_pct: 0, lista_precio_aplicada: false })
        );
        setFieldValue('productos', resetted);
      }
      return;
    }

    try {
      const clienteData = await FetchData(`/inv/clientes/${clienteId}`);
      if (clienteData?.lista_precio_id) {
        const listaData: ListaPrecioData = await FetchData(
          `/inv/listas-precio/${clienteData.lista_precio_id}`
        );
        setClienteListaPrecio(listaData);

        // Re-aplicar precios a productos existentes
        if (productos.length > 0) {
          const updatedProductos = productos.map((p) => applyListaPrice(p, listaData));
          const aplicados = updatedProductos.filter((p) => p.lista_precio_aplicada).length;
          setFieldValue('productos', updatedProductos);
          if (aplicados > 0) {
            toast.info(`Lista "${listaData.nombre}" aplicada a ${aplicados} producto(s)`);
          }
        } else {
          toast.info(`Lista de precio "${listaData.nombre}" cargada`);
        }
      } else {
        setClienteListaPrecio(null);
      }
    } catch {
      // silencioso, la venta puede continuar sin lista
    }
  };

  // ── SectionCard helper ────────────────────────────────────────────────────
  const SectionCard: React.FC<{ title: string; subheader?: string; children: React.ReactNode }> = ({
    title, subheader, children
  }) => (
    <Card sx={{ mb: 2 }}>
      <CardHeader title={title} subheader={subheader} titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }} />
      <Divider />
      <CardContent>{children}</CardContent>
    </Card>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values, { resetForm }) => {
          if (values.productos.length === 0) {
            toast.error('Agregue al menos un producto');
            return;
          }

          const detalles = values.productos.map((p) => ({
            producto_id:     p.producto_id,
            precio_unitario: p.precio_unitario,
            cantidad:        p.cantidad,
            descuento:       p.descuento,
            iva:             p.iva,
            series:          p.series,
            almacen_id:      p.almacen_id,
            percha_id:       p.percha_id
          }));

          const subtotal       = values.productos.reduce((a, p) => a + p.precio_unitario * p.cantidad, 0);
          const totalDescuento = values.productos.reduce((a, p) => a + p.descuento, 0);
          const totalIva       = values.productos.reduce((a, p) => a + p.iva, 0);
          const total          = subtotal - totalDescuento + totalIva;

          setLoading(true);
          try {
            const res = await FetchData('/inv/ventas', 'POST', {
              cliente_id:     values.clienteId || 0,
              numero_factura: values.numeroFactura,
              fecha:          values.fecha,
              fpago_id:       values.fpagoId,
              valor_pagado:   values.valorPagado || total,
              fecha_pago:     ['5', '8'].includes(values.fpagoId) ? values.fechaPago : values.fecha,
              plazo_pago:     values.fpagoId === '8' ? values.plazoPago : 0,
              observaciones:  values.observacionesPago,
              estado_pago:    values.estadoPago,
              id_caja:        values.cajaId,
              detalles
            });
            if (res.message) {
              toast.success(res.message);
              resetForm({ values: { ...initialValues, numeroFactura: `POS-${Date.now()}` } });
              setBarcodeInput('');
              setClienteListaPrecio(null);
              navigate('/inventory/sale-management');
            } else {
              toast.error('Error al crear la venta');
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al crear la venta');
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ values, errors, touched, handleChange, setFieldValue }) => {
          // ── Totales ────────────────────────────────────────────────────────
          const subtotal       = values.productos.reduce((a, p) => a + (p.precio_unitario || 0) * (p.cantidad || 0), 0);
          const totalDescuento = values.productos.reduce((a, p) => a + (p.descuento || 0), 0);
          const baseIva        = subtotal - totalDescuento;
          const totalIva       = values.productos.reduce((a, p) => a + (p.iva || 0), 0);
          const total          = baseIva + totalIva;
          const cambio         = (values.valorPagado || 0) - total;
          const pagoCubre      = values.valorPagado >= total;

          // ── Agrega producto al carrito con precio de lista aplicado ────────
          const handleAddManualProduct = (prod: Producto) => {
            const existing = values.productos.find((p) => p.id === prod.id);
            if (existing) {
              toast.warning('Este artículo (serie) ya está en el carrito');
              return;
            }

            let newItem: ProductoItem = {
              id:                   prod.id,
              producto_id:          prod.producto_id,
              producto_nombre:      prod.nombre,
              precio_base:          Number(prod.precio_venta) || 0,
              precio_unitario:      Number(prod.precio_venta) || 0,
              almacen_id:           prod.almacen_id,
              percha_id:            prod.percha_id,
              cantidad:             1,
              series:               [prod.numero_serie],
              descuento_pct:        0,
              descuento:            0,
              iva_pct:              0,
              iva:                  0,
              lista_precio_aplicada: false
            };

            // Aplicar lista de precio si el cliente tiene una
            if (clienteListaPrecio) {
              newItem = applyListaPrice(newItem, clienteListaPrecio);
            }

            setFieldValue('productos', [...values.productos, newItem]);
          };

          // ── Helper para actualizar un campo de producto y recalcular ───────
          const updateProductoField = (i: number, field: string, value: number) => {
            const updated  = { ...values.productos[i], [field]: value };
            const recalced = recalcProducto(updated);
            setFieldValue(`productos.${i}`, recalced);
          };

          return (
            <Form>
              <Grid container spacing={2}>

                {/* ══════════════════════ COLUMNA IZQUIERDA ══════════════════════ */}
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" gutterBottom fontWeight={700}>
                    Punto de Venta
                  </Typography>

                  {/* ── Cliente y Factura ──────────────────────────────────────── */}
                  <SectionCard title="Cliente y Factura">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>

                        {/* Selector de cliente */}
                        <FormControl fullWidth error={Boolean(touched.clienteId && errors.clienteId)}>
                          <InputLabel>Cliente *</InputLabel>
                          <Select
                            label="Cliente *"
                            value={values.clienteId ?? ''}
                            onChange={(e) => {
                              const v = e.target.value as unknown as number | '';
                              handleClienteChange(
                                v === '' ? null : Number(v),
                                values.productos,
                                setFieldValue
                              );
                            }}
                          >
                            {clientes.map((c) => (
                              <MenuItem key={c.id} value={c.id}>
                                {c.nombre}
                                {c.lista_precio_nombre && (
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    · {c.lista_precio_nombre}
                                  </Typography>
                                )}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>
                            {touched.clienteId && (errors.clienteId as string)}
                          </FormHelperText>
                        </FormControl>

                        {/* Badge de lista de precio activa */}
                        {clienteListaPrecio && (
                          <Box mt={1} display="flex" alignItems="center" gap={1}>
                            <LocalOfferIcon fontSize="small" color="success" />
                            <Chip
                              label={`Lista: ${clienteListaPrecio.nombre}${clienteListaPrecio.descuento_global > 0 ? ` · ${clienteListaPrecio.descuento_global}% desc. global` : ''}`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </Box>
                        )}

                        <TextField
                          sx={{ mt: 2 }}
                          label="Número de Factura *"
                          name="numeroFactura"
                          value={values.numeroFactura}
                          onChange={handleChange}
                          error={Boolean(touched.numeroFactura && errors.numeroFactura)}
                          helperText={touched.numeroFactura && (errors.numeroFactura as string)}
                          fullWidth
                        />
                        <TextField
                          sx={{ mt: 2 }}
                          type="date"
                          label="Fecha *"
                          name="fecha"
                          InputLabelProps={{ shrink: true }}
                          value={values.fecha}
                          onChange={handleChange}
                          error={Boolean(touched.fecha && errors.fecha)}
                          helperText={touched.fecha && (errors.fecha as string)}
                          fullWidth
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        {/* Forma de pago */}
                        <FormControl fullWidth error={Boolean(touched.fpagoId && errors.fpagoId)}>
                          <InputLabel>Forma de Pago *</InputLabel>
                          <Select
                            label="Forma de Pago *"
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
                            {touched.fpagoId && (errors.fpagoId as string)}
                          </FormHelperText>
                        </FormControl>

                        <TextField
                          sx={{ mt: 2 }}
                          label="Valor Pagado *"
                          type="number"
                          name="valorPagado"
                          value={values.valorPagado}
                          onChange={(e) => setFieldValue('valorPagado', Number(e.target.value))}
                          error={Boolean(touched.valorPagado && errors.valorPagado)}
                          helperText={touched.valorPagado && (errors.valorPagado as string)}
                          fullWidth
                          slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                        />

                        {/* Campos condicionales por forma de pago */}
                        {['5', '8'].includes(values.fpagoId) && (
                          <TextField
                            sx={{ mt: 2 }}
                            label="Fecha de Pago *"
                            type="date"
                            name="fechaPago"
                            InputLabelProps={{ shrink: true }}
                            value={values.fechaPago}
                            onChange={handleChange}
                            error={Boolean(touched.fechaPago && errors.fechaPago)}
                            helperText={touched.fechaPago && (errors.fechaPago as string)}
                            fullWidth
                          />
                        )}
                        {values.fpagoId === '8' && (
                          <TextField
                            sx={{ mt: 2 }}
                            label="Plazo de Pago (días) *"
                            type="number"
                            name="plazoPago"
                            value={values.plazoPago}
                            onChange={(e) => setFieldValue('plazoPago', Number(e.target.value))}
                            error={Boolean(touched.plazoPago && errors.plazoPago)}
                            helperText={touched.plazoPago && (errors.plazoPago as string)}
                            fullWidth
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
                          error={Boolean(touched.observacionesPago && errors.observacionesPago)}
                          helperText={touched.observacionesPago && (errors.observacionesPago as string)}
                        />

                        <FormControl fullWidth sx={{ mt: 2 }} error={Boolean(touched.estadoPago && errors.estadoPago)}>
                          <InputLabel>Estado de Pago *</InputLabel>
                          <Select
                            label="Estado de Pago *"
                            name="estadoPago"
                            value={values.estadoPago}
                            onChange={handleChange}
                          >
                            <MenuItem value="pendiente">Pendiente</MenuItem>
                            <MenuItem value="pagado">Pagado</MenuItem>
                            <MenuItem value="parcial">Parcial</MenuItem>
                            <MenuItem value="anulado">Anulado</MenuItem>
                          </Select>
                          <FormHelperText>
                            {touched.estadoPago && (errors.estadoPago as string)}
                          </FormHelperText>
                        </FormControl>

                        <FormControl fullWidth sx={{ mt: 2 }} error={Boolean(touched.cajaId && errors.cajaId)}>
                          <InputLabel>Caja *</InputLabel>
                          <Select
                            label="Caja *"
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
                            {touched.cajaId && (errors.cajaId as string)}
                          </FormHelperText>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </SectionCard>

                  {/* ── Tabla de productos ─────────────────────────────────────── */}
                  <SectionCard
                    title="Detalle de productos"
                    subheader={
                      clienteListaPrecio
                        ? `Precios con lista "${clienteListaPrecio.nombre}" aplicada`
                        : undefined
                    }
                  >
                    <FieldArray name="productos">
                      {({ remove }) => (
                        <Box sx={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f5f5f5' }}>
                                <th style={{ padding: '8px 10px', textAlign: 'left',   border: '1px solid #e0e0e0', minWidth: 160 }}>Producto</th>
                                <th style={{ padding: '8px 6px',  textAlign: 'center', border: '1px solid #e0e0e0', width: 50   }}>Cant</th>
                                <th style={{ padding: '8px 6px',  textAlign: 'right',  border: '1px solid #e0e0e0', width: 110  }}>P. Unitario</th>
                                <th style={{ padding: '8px 6px',  textAlign: 'right',  border: '1px solid #e0e0e0', width: 110  }}>Desc %</th>
                                <th style={{ padding: '8px 6px',  textAlign: 'right',  border: '1px solid #e0e0e0', width: 110  }}>IVA %</th>
                                <th style={{ padding: '8px 6px',  textAlign: 'right',  border: '1px solid #e0e0e0', width: 100  }}>Total línea</th>
                                <th style={{ padding: '8px 4px',  textAlign: 'center', border: '1px solid #e0e0e0', width: 44   }}>–</th>
                              </tr>
                            </thead>
                            <tbody>
                              {values.productos.length === 0 && (
                                <tr>
                                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#9e9e9e', border: '1px solid #e0e0e0' }}>
                                    Agrega productos desde el catálogo →
                                  </td>
                                </tr>
                              )}
                              {values.productos.map((p, i) => {
                                const subtotalLinea = (p.precio_unitario || 0) * (p.cantidad || 0);
                                const totalLinea    = subtotalLinea - (p.descuento || 0) + (p.iva || 0);
                                const tieneError    = (errors.productos as any)?.[i];

                                return (
                                  <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>

                                    {/* Nombre + indicadores */}
                                    <td style={{ border: '1px solid #e0e0e0', padding: '6px 10px' }}>
                                      <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                                        <Typography variant="body2" fontWeight={500}>{p.producto_nombre}</Typography>
                                        {p.lista_precio_aplicada && (
                                          <Tooltip title={`Precio de lista "${clienteListaPrecio?.nombre}"`}>
                                            <LocalOfferIcon sx={{ fontSize: 14, color: 'success.main', cursor: 'help' }} />
                                          </Tooltip>
                                        )}
                                        {p.precio_unitario !== p.precio_base && (
                                          <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                            {currency(p.precio_base)}
                                          </Typography>
                                        )}
                                      </Box>
                                      {/* Serie */}
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Serie: {p.series.join(', ')}
                                      </Typography>
                                      {/* Error de series */}
                                      {(touched.productos as any)?.[i]?.series && tieneError?.series && (
                                        <Typography variant="caption" color="error">
                                          {tieneError.series}
                                        </Typography>
                                      )}
                                    </td>

                                    {/* Cantidad (solo display, determinada por series) */}
                                    <td style={{ border: '1px solid #e0e0e0', padding: '6px', textAlign: 'center' }}>
                                      <Typography variant="body2">{p.cantidad}</Typography>
                                    </td>

                                    {/* Precio unitario */}
                                    <td style={{ border: '1px solid #e0e0e0', padding: '6px' }}>
                                      <TextField
                                        type="number"
                                        value={p.precio_unitario}
                                        onChange={(e) => updateProductoField(i, 'precio_unitario', Number(e.target.value))}
                                        error={Boolean((touched.productos as any)?.[i]?.precio_unitario && tieneError?.precio_unitario)}
                                        helperText={(touched.productos as any)?.[i]?.precio_unitario && tieneError?.precio_unitario}
                                        size="small"
                                        sx={{ width: 95 }}
                                        slotProps={{ input: { inputProps: { min: 0, step: 0.01 }, startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                                      />
                                    </td>

                                    {/* Descuento % */}
                                    <td style={{ border: '1px solid #e0e0e0', padding: '6px' }}>
                                      <TextField
                                        type="number"
                                        value={p.descuento_pct}
                                        onChange={(e) => updateProductoField(i, 'descuento_pct', Number(e.target.value))}
                                        error={Boolean((touched.productos as any)?.[i]?.descuento_pct && tieneError?.descuento_pct)}
                                        helperText={(touched.productos as any)?.[i]?.descuento_pct && tieneError?.descuento_pct}
                                        size="small"
                                        sx={{ width: 95 }}
                                        slotProps={{ input: { inputProps: { min: 0, max: 100, step: 0.01 }, endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                                      />
                                      {p.descuento > 0 && (
                                        <Typography variant="caption" color="error.main" display="block" textAlign="right">
                                          -{currency(p.descuento)}
                                        </Typography>
                                      )}
                                    </td>

                                    {/* IVA % */}
                                    <td style={{ border: '1px solid #e0e0e0', padding: '6px' }}>
                                      <Select
                                        value={p.iva_pct}
                                        onChange={(e) => updateProductoField(i, 'iva_pct', Number(e.target.value))}
                                        size="small"
                                        sx={{ width: 95, fontSize: '0.8rem' }}
                                        error={Boolean((touched.produtos as any)?.[i]?.iva_pct && tieneError?.iva_pct)}
                                      >
                                        {IVA_RATES.map((r) => (
                                          <MenuItem key={r.value} value={r.value} sx={{ fontSize: '0.8rem' }}>
                                            {r.label}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                      {p.iva > 0 && (
                                        <Typography variant="caption" color="info.main" display="block" textAlign="right">
                                          +{currency(p.iva)}
                                        </Typography>
                                      )}
                                    </td>

                                    {/* Total línea */}
                                    <td style={{ border: '1px solid #e0e0e0', padding: '6px', textAlign: 'right' }}>
                                      <Typography variant="body2" fontWeight={600} color="success.dark">
                                        {currency(totalLinea)}
                                      </Typography>
                                    </td>

                                    {/* Eliminar */}
                                    <td style={{ border: '1px solid #e0e0e0', padding: '4px', textAlign: 'center' }}>
                                      <IconButton color="error" size="small" onClick={() => remove(i)}>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {typeof errors.productos === 'string' && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                              {errors.productos}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </FieldArray>
                  </SectionCard>

                  {/* ── Totales y cierre ──────────────────────────────────────── */}
                  <Card sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={7}>
                        {/* Desglose */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 16px' }}>
                          <Typography variant="body2" color="text.secondary">Subtotal bruto</Typography>
                          <Typography variant="body2" textAlign="right">{currency(subtotal)}</Typography>

                          <Typography variant="body2" color="error.main">
                            Descuento total
                            {subtotal > 0 && totalDescuento > 0 && (
                              <Typography component="span" variant="caption" color="error.light" sx={{ ml: 0.5 }}>
                                ({((totalDescuento / subtotal) * 100).toFixed(1)}%)
                              </Typography>
                            )}
                          </Typography>
                          <Typography variant="body2" color="error.main" textAlign="right">
                            -{currency(totalDescuento)}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">Base gravable</Typography>
                          <Typography variant="body2" textAlign="right">{currency(baseIva)}</Typography>

                          <Typography variant="body2" color="info.main">
                            IVA total
                            {baseIva > 0 && totalIva > 0 && (
                              <Typography component="span" variant="caption" color="info.light" sx={{ ml: 0.5 }}>
                                ({((totalIva / baseIva) * 100).toFixed(1)}%)
                              </Typography>
                            )}
                          </Typography>
                          <Typography variant="body2" color="info.main" textAlign="right">
                            +{currency(totalIva)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />

                        {/* Cambio / vuelto */}
                        {values.valorPagado > 0 && (
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 16px' }}>
                            <Typography variant="body2" color="text.secondary">Valor pagado</Typography>
                            <Typography variant="body2" textAlign="right">{currency(values.valorPagado)}</Typography>

                            <Typography
                              variant="body2"
                              color={pagoCubre ? 'success.main' : 'warning.main'}
                              fontWeight={600}
                            >
                              {pagoCubre ? 'Cambio / vuelto' : '⚠ Saldo pendiente'}
                            </Typography>
                            <Typography
                              variant="body2"
                              textAlign="right"
                              color={pagoCubre ? 'success.main' : 'warning.main'}
                              fontWeight={600}
                            >
                              {pagoCubre ? currency(cambio) : currency(Math.abs(cambio))}
                            </Typography>
                          </Box>
                        )}

                        {/* Advertencia si valor pagado no cubre */}
                        {!pagoCubre && values.valorPagado > 0 && values.estadoPago === 'pagado' && (
                          <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                            <WarningAmberIcon fontSize="small" color="warning" />
                            <Typography variant="caption" color="warning.main">
                              El valor pagado no cubre el total. Cambia el estado a "Parcial".
                            </Typography>
                          </Box>
                        )}
                      </Grid>

                      <Grid item xs={12} sm={5} display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center">
                        <Typography variant="h4" fontWeight={700} color="success.dark">
                          {currency(total)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total a cobrar ({values.productos.length} artículo{values.productos.length !== 1 ? 's' : ''})
                        </Typography>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={loading}
                          sx={{ mt: 2, minWidth: 180 }}
                        >
                          {loading ? 'Procesando...' : '✓ Finalizar Venta'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* ══════════════════════ COLUMNA DERECHA — CATÁLOGO ═══════════ */}
                <Grid item xs={12} md={4}>
                  <SectionCard title="Catálogo de productos">
                    <TextField
                      placeholder="Buscar por nombre o código de barras..."
                      inputRef={barcodeRef}
                      autoFocus
                      value={barcodeInput}
                      onChange={(e) => { setBarcodeInput(e.target.value); setPage(1); }}
                      fullWidth
                      size="small"
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">🔍</InputAdornment> } }}
                    />
                  </SectionCard>

                  <Grid container spacing={1}>
                    {productosDisponibles?.map((prod) => {
                      // Precio efectivo con lista de precio (preview)
                      let precioPreview = prod.precio_venta;
                      let descPct       = 0;
                      if (clienteListaPrecio) {
                        const det = clienteListaPrecio.detalles.find((d) => d.producto_id === prod.producto_id);
                        if (det) {
                          precioPreview = det.precio_final;
                          descPct       = det.precio_base > 0
                            ? parseFloat(((1 - det.precio_final / det.precio_base) * 100).toFixed(1))
                            : 0;
                        } else if (clienteListaPrecio.descuento_global > 0) {
                          descPct       = clienteListaPrecio.descuento_global;
                          precioPreview = prod.precio_venta * (1 - descPct / 100);
                        }
                      }
                      const yaEnCarrito = Boolean(values.productos.find((p) => p.id === prod.id));

                      return (
                        <Grid item xs={12} sm={6} key={prod.id}>
                          <Card
                            variant="outlined"
                            sx={{
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              opacity: yaEnCarrito ? 0.5 : 1,
                              transition: 'box-shadow 0.2s',
                              '&:hover': { boxShadow: yaEnCarrito ? 0 : 3 }
                            }}
                          >
                            <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                              <Typography variant="caption" noWrap fontWeight={600} display="block">
                                {prod.nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                Serie: {prod.numero_serie}
                              </Typography>

                              {/* Precio con descuento de lista */}
                              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                <Typography variant="body2" fontWeight={700} color="success.dark">
                                  {currency(precioPreview)}
                                </Typography>
                                {descPct > 0 && (
                                  <>
                                    <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                      {currency(prod.precio_venta)}
                                    </Typography>
                                    <Chip label={`-${descPct}%`} size="small" color="success" sx={{ height: 16, fontSize: '0.65rem' }} />
                                  </>
                                )}
                              </Box>

                              <Box mt={0.5}>
                                <img
                                  src={`${import.meta.env.VITE_APP_API_URL}/storage/${prod.foto_principal || 'placeholder.png'}`}
                                  alt={prod.nombre}
                                  style={{ width: '100%', height: '70px', objectFit: 'contain' }}
                                />
                              </Box>
                            </CardContent>
                            <Box px={1.5} pb={1.5}>
                              <Button
                                fullWidth
                                variant={yaEnCarrito ? 'outlined' : 'contained'}
                                size="small"
                                disabled={yaEnCarrito}
                                onClick={() => handleAddManualProduct(prod)}
                              >
                                {yaEnCarrito ? 'Ya agregado' : '+ Agregar'}
                              </Button>
                            </Box>
                          </Card>
                        </Grid>
                      );
                    })}

                    {productosDisponibles?.length === 0 && (
                      <Grid item xs={12}>
                        <Card>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" textAlign="center">
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
                      size="small"
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

export default VentaFacturaPOS;
