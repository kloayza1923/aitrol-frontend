import { Container } from '@/components/container';
import { Fragment, useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import {
  Paper,
  Grid,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Collapse,
  IconButton,
  Box,
  Chip,
  TextField
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
const OrderAsigment = () => {
  const [loading, setLoading] = useState(true);
  const [dateInitial, setDateInitial] = useState(new Date());
  const [dateFinal, setDateFinal] = useState(new Date());
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [ordenes_clientes, setOrdenesClientes] = useState<any[]>([]);
  const [expandedCliente, setExpandedCliente] = useState<string | null>(null);
  const get_order_assigment = async () => {
    setLoading(true);
    let dateInitialFormatted = dateInitial.toISOString().split('T')[0];
    let dateFinalFormatted = dateFinal.toISOString().split('T')[0];
    const response = await FetchData(
      `ordenes_viajes_asignaciones/${dateInitialFormatted}/${dateFinalFormatted}`
    );
    setLoading(false);
    if (response.detail) {
      console.error(response.detail);
      setOrdenes([]);
      return;
    }
    setOrdenes(response || []);
    const groupedOrders = response.reduce((acc: any, orden: any) => {
      const clienteId = orden.cliente_id || 'Sin cliente';
      const ruta = `${orden.puerto_salida_nombre} - ${orden.puerto_destino_nombre}`;

      if (!acc[clienteId]) {
        acc[clienteId] = {
          cliente_nombre: orden.cliente_nombre || 'Sin cliente',
          rutas: {}
        };
      }

      if (!acc[clienteId].rutas[ruta]) {
        acc[clienteId].rutas[ruta] = 0;
      }

      acc[clienteId].rutas[ruta]++;
      return acc;
    }, {});
    const ordenesClientesTransformado = Object.values(groupedOrders).map((cliente: any) => ({
      cliente_nombre: cliente.cliente_nombre,
      rutas: Object.entries(cliente.rutas).map(([ruta, cantidad]) => ({
        ruta,
        cantidad
      }))
    }));
    setOrdenesClientes(ordenesClientesTransformado);

    //setOrdenesClientes(Object.values(groupedOrders));
    console.log(response);
  };

  useEffect(() => {
    get_order_assigment();
  }, [dateInitial, dateFinal]);
  return (
    <Fragment>
      <Container>
        <Paper className="p-6 mb-6">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" className="font-bold">
                Asignaciones de Órdenes de Viaje
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                Selecciona un rango de fechas para ver las asignaciones de órdenes de viaje.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} className="flex gap-2 justify-end">
              <TextField
                type="date"
                size="small"
                value={dateInitial.toISOString().split('T')[0]}
                onChange={(e) => setDateInitial(new Date(e.target.value))}
                className="bg-white rounded"
              />
              <TextField
                type="date"
                size="small"
                value={dateFinal.toISOString().split('T')[0]}
                onChange={(e) => setDateFinal(new Date(e.target.value))}
                className="bg-white rounded"
              />
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Typography>Cargando datos...</Typography>
        ) : ordenes.length === 0 ? (
          <Typography>
            No hay asignaciones encontradas en el rango de fechas seleccionado.
          </Typography>
        ) : (
          <Paper className="p-4 mb-6">
            <Typography variant="h6" className="mb-4">
              Órdenes de Viaje Asignadas
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Orden #</TableCell>
                    <TableCell>Placa</TableCell>
                    <TableCell>Conductor</TableCell>
                    <TableCell>Ruta</TableCell>
                    <TableCell>Cliente</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordenes.map((orden: any) => (
                    <TableRow key={orden.id} hover>
                      <TableCell>{orden.orden_id}</TableCell>
                      <TableCell>{orden.vehiculo_nombre || 'N/A'}</TableCell>
                      <TableCell>{orden.conductor_nombre || 'Sin conductor'}</TableCell>
                      <TableCell>
                        {orden.puerto_salida_nombre + ' - ' + orden.puerto_destino_nombre ||
                          'Sin ruta'}
                      </TableCell>
                      <TableCell>{orden.cliente_nombre || 'Sin cliente'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {ordenes_clientes.length > 0 && (
          <Paper className="p-4">
            <Typography variant="h6" className="mb-4">
              Órdenes por Cliente
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Unidades</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordenes_clientes.map((cliente: any) => {
                    const isExpanded = expandedCliente === cliente.cliente_nombre;
                    const totalUnidades = cliente.rutas.reduce(
                      (sum: number, r: any) => sum + r.cantidad,
                      0
                    );
                    return (
                      <Fragment key={cliente.cliente_nombre}>
                        <TableRow hover className="cursor-pointer">
                          <TableCell
                            onClick={() =>
                              setExpandedCliente(isExpanded ? null : cliente.cliente_nombre)
                            }
                          >
                            <div className="flex items-center gap-3">
                              <Typography className="font-semibold">
                                {cliente.cliente_nombre}
                              </Typography>
                              <Chip label={totalUnidades} size="small" color="primary" />
                            </div>
                          </TableCell>
                          <TableCell
                            onClick={() =>
                              setExpandedCliente(isExpanded ? null : cliente.cliente_nombre)
                            }
                          >
                            {totalUnidades}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              onClick={() =>
                                setExpandedCliente(isExpanded ? null : cliente.cliente_nombre)
                              }
                            >
                              <ExpandMoreIcon
                                className={`${isExpanded ? 'rotate-180' : ''} transition-transform`}
                              />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box margin={2}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Ruta</TableCell>
                                      <TableCell>Cantidad</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {cliente.rutas.map((rutaObj: any, i: number) => (
                                      <TableRow key={i}>
                                        <TableCell>{rutaObj.ruta}</TableCell>
                                        <TableCell>{rutaObj.cantidad}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>
    </Fragment>
  );
};
export default OrderAsigment;
