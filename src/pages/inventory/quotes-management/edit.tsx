import { useState, useEffect, useContext, useCallback } from 'react';
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
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toAbsoluteUrl } from '@/utils/Assets';
import { AuthContext } from '@/auth/providers/JWTProvider';
const QuoteEdit = () => {
  const { id } = useParams<{ id: string }>();
  const [venta, setVenta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTransform, setLoadingTransform] = useState(false);
  const [respuesta, setRespuesta] = useState<string>('');
  const auth = useContext(AuthContext);
  const currentUser = auth?.currentUser;
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await FetchData(`/inv/cotizaciones/${id}`);
      setVenta(data);
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);
  const handleApprove = async () => {
    if (!id) return;
    setLoadingTransform(true);
    setRespuesta('');
    try {
      await FetchData(`/inv/cotizaciones/${id}`, 'PUT', {
        usuario_id: Number(currentUser?.id),
        estado: 'APR'
      });
      setRespuesta('La cotización ha sido aprobada exitosamente.');
      // Refrescar los datos de la cotización
      const updatedData = await FetchData(`/inv/cotizaciones/${id}`);
      setVenta(updatedData);
      load();
    } catch (error) {
      console.error('Error approving quote:', error);
      setRespuesta('Error al aprobar la cotización.');
    } finally {
      setLoadingTransform(false);
    }
  };
  const transformtoInvoice = async () => {
    if (!id) return;
    setLoadingTransform(true);
    setRespuesta('');
    try {
      await FetchData(`inv/cotizaciones/${id}/convertir`, 'POST', {
        usuario_id: Number(currentUser?.id)
      });
      setRespuesta('La cotización se ha transformado en factura exitosamente.');
      load();
    } catch (error) {
      console.error('Error transforming quote to invoice:', error);
      setRespuesta('Error al transformar la cotización en factura.');
    } finally {
      setLoadingTransform(false);
    }
  };
  useEffect(() => {
    load();
  }, [load]);

  // Export quote to PDF (professional layout)
  const exportQuotePdf = () => {
    if (!venta) return;
    const { cotizacion: v, detalles } = venta;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const logoUrl = toAbsoluteUrl('/media/app/logo.png');
    const img = new Image();
    img.src = logoUrl;
    const headY = 40;

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
      try {
        doc.addImage(img, 'PNG', 40, headY - 10, 80, 40);
      } catch {
        // ignore
      }
      doc.setFontSize(14);
      doc.text('Horizon ERP', 140, headY);
      doc.setFontSize(10);
      doc.text(`Cotización: ${v.id}`, 420, headY);
      doc.text(`Fecha: ${v.fecha || '-'}`, 420, headY + 14);

      if (v.observaciones) {
        doc.setFontSize(9);
        doc.text(`Observaciones: ${v.observaciones}`, 40, headY + 60);
      }

      autoTable(doc as any, {
        startY: headY + 80,
        head: [header],
        body,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { left: 40, right: 40 },
        didDrawPage: (data: any) => {
          const pageCount = doc.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : (pageSize as any).getHeight();
          const pageNumber = (doc as any).getCurrentPageInfo
            ? (doc as any).getCurrentPageInfo().pageNumber
            : pageCount;
          doc.setFontSize(9);
          doc.text(
            `Página ${pageNumber} / ${pageCount}`,
            data.settings.margin.left,
            pageHeight - 30
          );
        }
      });

      const finalY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 20
        : headY + 80 + body.length * 20 + 20;
      doc.setFontSize(11);
      doc.text(`Total: $${(v.total ?? 0).toFixed(2)}`, 360, finalY + 10);
      doc.save(`cotizacion_${v.id}.pdf`);
    };

    img.onerror = () => {
      autoTable(doc as any, {
        startY: headY + 40,
        head: [header],
        body,
        styles: { fontSize: 9 }
      });
      const finalY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 20
        : headY + 40 + body.length * 20 + 20;
      doc.setFontSize(11);
      doc.text(`Total: $${(v.total ?? 0).toFixed(2)}`, 360, finalY + 10);
      doc.save(`cotizacion_${v.id}.pdf`);
    };
  };

  if (loading)
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" mt={10}>
          <CircularProgress />
        </Box>
      </Container>
    );

  if (!venta || !venta.cotizacion)
    return (
      <Container>
        <p>No se encontró la cotización.</p>
      </Container>
    );

  const { cotizacion: v, detalles } = venta;
  const totalCalculado = detalles.reduce(
    (sum: number, d: any) =>
      sum + d.cantidad * d.precio_unitario - (d.descuento || 0) + (d.iva || 0),
    0
  );
  //console.log('v', v);

  return (
    <Container>
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Detalle de Cotización #{v.id}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/inventory/quote-management`)}
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
              <strong>Número Factura:</strong> {v.numero_factura}
            </Typography>
            <Typography>
              <strong>Fecha:</strong> {v.fecha}
            </Typography>
            <Typography>
              <strong>Estado:</strong> {v.estado}
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
          <Typography variant="h6">Total: ${totalCalculado.toFixed(2)}</Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 2, mt: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={transformtoInvoice}
                disabled={
                  loadingTransform ||
                  v.estado === 'ACT' ||
                  v.estado === 'CONVERTIDA' ||
                  v.estado === 'CONV'
                }
              >
                {loadingTransform ? 'Transformando...' : 'Transformar a Factura'}
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" color="primary" onClick={() => exportQuotePdf()}>
                Exportar a PDF
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleApprove}
                disabled={
                  loadingTransform ||
                  v.estado === 'APR' ||
                  v.estado === 'CONVERTIDA' ||
                  v.estado === 'CONV'
                }
              >
                {loadingTransform ? 'Aprobando...' : 'Aprobar Cotización'}
              </Button>
            </Grid>
            <Grid item>{loadingTransform && <CircularProgress size={24} />}</Grid>
          </Grid>
          {respuesta && (
            <Box mt={2}>
              <Alert severity={respuesta.includes('Error') ? 'error' : 'success'}>
                {respuesta}
              </Alert>
            </Box>
          )}
        </Paper>
      </Paper>
    </Container>
  );
};

export default QuoteEdit;
