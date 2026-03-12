import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import {
  Alert,
  Button,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  Fade,
  Box,
  TextField,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toAbsoluteUrl } from '@/utils/Assets';

const VentaShow = () => {
  const { id } = useParams<{ id: string }>();
  const [venta, setVenta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSRI, setLoadingSRI] = useState(false);
  const [respuesta, setRespuesta] = useState<string>('');
  const [numero_factura, setNumeroFactura] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isTemporal, setIsTemporal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await FetchData(`/inv/ventas/${id}`);
        setVenta(data);
        setIsTemporal(data.venta.numero_factura === 'TEMP');
        setNumeroFactura(data.venta.numero_factura);
        setObservaciones(data.venta.observaciones || '');
      } catch (error) {
        console.error('Error fetching sale:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const actualizarVenta = async (values: any) => {
    const confirm = window.confirm('¿Estás seguro de actualizar la venta con los nuevos datos?');
    if (!id || !venta || !confirm) return;
    try {
      setLoading(true);
      const payload = {
        numero_factura: values.numero_factura || venta.venta.numero_factura,
        observaciones: values.observaciones || venta.venta.observaciones
      };
      await FetchData(`/inv/ventas/${id}`, 'PUT', payload);
      setRespuesta('La venta ha sido actualizada exitosamente.');
      setIsTemporal(payload.numero_factura === 'TEMP');
      const data = await FetchData(`/inv/ventas/${id}`);
      setVenta(data);
    } catch (error: any) {
      console.error('Error updating sale:', error);
      setRespuesta(error?.detail?.message || 'Error al actualizar la venta.');
    } finally {
      setLoading(false);
    }
  };

  const exportToPdf = () => {
    if (!venta) return;
    const { venta: v, detalles } = venta;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // Load logo (use toAbsoluteUrl for consistent path like DataGridComponente)
    const logoUrl = toAbsoluteUrl('/media/app/logo.png');
    const img = new Image();
    img.src = logoUrl;

    const headY = 40;

    // prepare table header/body so both onload and onerror can access
    const header = ['Producto ID', 'Nombre', 'Serie', 'Cantidad', 'Precio', 'Descuento', 'IVA'];
    const body = detalles.map((d: any) => [
      d.producto_id ?? '',
      d.nombre ?? '',
      d.serie ?? '-',
      d.cantidad ?? 0,
      (d.precio_unitario ?? 0).toFixed(2),
      (d.descuento ?? 0).toFixed(2),
      (d.iva ?? 0).toFixed(2)
    ]);

    img.onload = () => {
      // Draw logo
      try {
        doc.addImage(img, 'PNG', 40, headY - 10, 80, 40);
      } catch {
        // ignore if addImage fails
      }

      // Company info header
      doc.setFontSize(14);
      doc.text('Horizon ERP', 140, headY);
      doc.setFontSize(10);
      doc.text('Dirección de la empresa', 140, headY + 16);
      doc.text('Tel: +00 000 000 | email@empresa.com', 140, headY + 32);

      // Invoice header right
      doc.setFontSize(11);
      doc.text(`Factura: ${v.numero_factura || '-'}`, 420, headY);
      doc.text(`ID: ${v.id}`, 420, headY + 14);
      doc.text(`Fecha: ${v.fecha || '-'}`, 420, headY + 28);

      if (v.observaciones) {
        doc.setFontSize(9);
        doc.text(`Observaciones: ${v.observaciones}`, 40, headY + 60);
      }

      // Tabla con jspdf-autotable
      const header = ['Producto ID', 'Nombre', 'Serie', 'Cantidad', 'Precio', 'Descuento', 'IVA'];

      const body = detalles.map((d: any) => [
        d.producto_id ?? '',
        d.nombre ?? '',
        d.serie ?? '-',
        d.cantidad ?? 0,
        (d.precio_unitario ?? 0).toFixed(2),
        (d.descuento ?? 0).toFixed(2),
        (d.iva ?? 0).toFixed(2)
      ]);

      autoTable(doc as any, {
        startY: headY + 80,
        head: [header],
        body,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 40, right: 40 },
        didDrawPage: (data: any) => {
          // Footer with page number
          const pageCount = doc.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : (pageSize as any).getHeight();
          doc.setFontSize(9);
          const pageNumber = (doc as any).getCurrentPageInfo
            ? (doc as any).getCurrentPageInfo().pageNumber
            : pageCount;
          doc.text(
            `Página ${pageNumber} / ${pageCount}`,
            data.settings.margin.left,
            pageHeight - 30
          );
        }
      });

      // Totales al final
      const finalY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 20
        : headY + 80 + body.length * 20 + 20;
      doc.setFontSize(11);
      doc.text(`Subtotal: $${(v.subtotal ?? 0).toFixed(2)}`, 360, finalY);
      doc.text(`IVA: $${(v.iva ?? 0).toFixed(2)}`, 360, finalY + 14);
      doc.setFontSize(12);
      try {
        doc.setFont('helvetica', 'bold');
      } catch {
        // ignore if font variant not available
      }
      doc.text(`Total: $${(v.total ?? 0).toFixed(2)}`, 360, finalY + 32);

      doc.save(`factura_${v.id}.pdf`);
    };

    img.onerror = () => {
      // fallback: draw without logo if loading fails
      autoTable(doc as any, {
        startY: headY + 40,
        head: [header],
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
      const finalY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 20
        : headY + 40 + body.length * 20 + 20;
      doc.setFontSize(11);
      doc.text(`Total: $${(v.total ?? 0).toFixed(2)}`, 360, finalY + 10);
      doc.save(`factura_${v.id}.pdf`);
    };
  };

  const sendSRI = async () => {
    if (!id) return;
    const confirm = window.confirm('¿Estás seguro de enviar esta venta al SRI?');
    if (!confirm) return;
    try {
      setLoadingSRI(true);
      const response = await FetchData(`inv/ventas_sri/enviar/${id}`, 'GET');
      setRespuesta(response || 'Enviado al SRI');
      setTimeout(() => setRespuesta(''), 10000);
      const data = await FetchData(`/inv/ventas/${id}`);
      setVenta(data);
    } catch (error) {
      console.error('Error sending sale to SRI:', error);
      alert('Error al enviar la venta al SRI.');
    } finally {
      setLoadingSRI(false);
    }
  };

  const consultarEstadoSRI = async () => {
    if (!id) return;
    try {
      setLoadingSRI(true);
      const response = await FetchData(`inv/ventas_sri/estado/${id}`, 'GET');
      setRespuesta(`Estado SRI: ${response.estado}`);
      setTimeout(() => setRespuesta(''), 10000);
      const data = await FetchData(`/inv/ventas/${id}`);
      setVenta(data);
    } catch (error) {
      console.error('Error al consultar estado SRI:', error);
      alert('Error al consultar estado SRI.');
    } finally {
      setLoadingSRI(false);
    }
  };

  if (loading)
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" mt={10}>
          <CircularProgress />
        </Box>
      </Container>
    );

  if (!venta || !venta.venta)
    return (
      <Container>
        <p>No se encontró la venta.</p>
      </Container>
    );

  const { venta: v, detalles } = venta;
  const totalCalculado = detalles.reduce(
    (sum: number, d: any) =>
      sum + d.cantidad * d.precio_unitario - (d.descuento || 0) + (d.iva || 0),
    0
  );

  return (
    <Container>
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Detalle de Venta #{v.id}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/inventory/sale-management`)}
        >
          Regresar
        </Button>
      </Grid>

      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Cliente:</strong> {v.nombre || '-'} (ID: {v.cliente_id})
            </Typography>
            <Typography>
              {!isTemporal && (
                <div>
                  <strong>Número Factura:</strong> {v.numero_factura}{' '}
                </div>
              )}
            </Typography>
            {isTemporal && (
              <Formik
                initialValues={{
                  numero_factura: numero_factura || '',
                  observaciones: observaciones || ''
                }}
                validationSchema={Yup.object({
                  numero_factura: Yup.string()
                    .required('El número de factura es obligatorio')
                    .notOneOf(['TEMP'], 'El número de factura no puede ser TEMP'),
                  observaciones: Yup.string().max(500, 'Máximo 500 caracteres')
                })}
                onSubmit={(values) => actualizarVenta(values)}
              >
                {({ values, errors, touched, handleChange, handleSubmit }) => (
                  <Form onSubmit={handleSubmit}>
                    <Field
                      as={TextField}
                      label="Número factura"
                      name="numero_factura"
                      onChange={(e: any) => {
                        handleChange(e);
                        setNumeroFactura(e.target.value);
                      }}
                      value={values.numero_factura}
                      fullWidth
                      margin="normal"
                      error={!!(errors.numero_factura && touched.numero_factura)}
                      helperText={touched.numero_factura && errors.numero_factura}
                    />
                    <Field
                      as={TextField}
                      label="Observaciones"
                      name="observaciones"
                      onChange={(e: any) => {
                        handleChange(e);
                        setObservaciones(e.target.value);
                      }}
                      value={values.observaciones}
                      fullWidth
                      margin="normal"
                      multiline
                      minRows={2}
                      error={!!(errors.observaciones && touched.observaciones)}
                      helperText={touched.observaciones && errors.observaciones}
                    />
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="secondary"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Actualizando...' : 'Actualizar Venta'}
                      </Button>
                    </Stack>
                  </Form>
                )}
              </Formik>
            )}
            <Typography>
              <strong>Fecha:</strong> {v.fecha}
            </Typography>
            <Typography>
              <strong>Estado:</strong> {v.estado}
            </Typography>
            <Typography>
              <strong>Estado SRI:</strong> {v.estado_sri}
            </Typography>
            <Typography>
              <strong>Observaciones:</strong> {v.observaciones || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Subtotal:</strong> ${v.subtotal?.toFixed(2)}
            </Typography>
            <Typography>
              <strong>IVA:</strong> ${v.iva?.toFixed(2)}
            </Typography>
            <Typography>
              <strong>Total:</strong> ${v.total?.toFixed(2)}
            </Typography>
            <Typography>
              <strong>Estado de Pago:</strong> {v.estado_pago}
            </Typography>
            <Typography>
              <strong>Fecha de Pago:</strong> {v.fecha_pago || '-'}
            </Typography>
            <Typography>
              <strong>Autorización SRI:</strong> {v.autorizacion_sri || '-'}
            </Typography>
            <Typography>
              <strong>XML Firmado:</strong> {v.xml_firmado}
            </Typography>
            <Typography>
              <strong>XML Autorizado:</strong> {v.xml_autorizado || '-'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Detalles de Productos
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Producto ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell align="right">Serie</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Precio Unitario</TableCell>
                <TableCell align="right">Descuento</TableCell>
                <TableCell align="right">IVA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detalles.map((d: any, i: number) => (
                <TableRow key={i} hover>
                  <TableCell>{d.producto_id}</TableCell>
                  <TableCell>{d.nombre}</TableCell>
                  <TableCell align="right">{d.serie || '-'}</TableCell>
                  <TableCell align="right">{d.cantidad}</TableCell>
                  <TableCell align="right">${(d.precio_unitario ?? 0).toFixed(2)}</TableCell>
                  <TableCell align="right">${(d.descuento ?? 0).toFixed(2)}</TableCell>
                  <TableCell align="right">${(d.iva ?? 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Typography variant="h6">Total Calculado: ${totalCalculado.toFixed(2)}</Typography>
        </Box>
      </Paper>

      <Grid container spacing={2} justifyContent="flex-end" alignItems="center">
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate(`/inventory/sale-management`)}
          >
            Regresar
          </Button>

          {v.xml_firmado && (
            <Button
              variant="outlined"
              color="success"
              href={import.meta.env.VITE_APP_API_URL + '/inv/ventas_sri/pdf/' + v.id}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver PDF SRI
            </Button>
          )}

          <Button variant="outlined" color="primary" onClick={exportToPdf}>
            Exportar a PDF
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={sendSRI}
            disabled={v.estado_sri === 'RECIBIDA' || v.estado_sri === 'NO AUTORIZADO'}
            startIcon={loadingSRI && <CircularProgress size={20} />}
          >
            {v.estado_sri === 'RECIBIDA' || v.estado_sri === 'NO AUTORIZADO'
              ? 'Enviado al SRI'
              : 'Enviar al SRI'}
          </Button>

          {(v.estado_sri === 'RECIBIDA' || v.estado_sri === 'NO AUTORIZADO') && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={consultarEstadoSRI}
              startIcon={loadingSRI && <CircularProgress size={20} />}
            >
              Actualizar Estado SRI
            </Button>
          )}
        </Stack>
      </Grid>

      <Fade in={!!respuesta}>
        <Box mt={4}>{respuesta && <Alert severity="info">{respuesta}</Alert>}</Box>
      </Fade>
    </Container>
  );
};

export default VentaShow;
