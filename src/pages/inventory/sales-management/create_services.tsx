import { useState, useEffect } from 'react';
import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import { toast } from 'sonner';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Autocomplete
} from '@mui/material';
import { DeleteIcon } from 'lucide-react';
import { useNavigate } from 'react-router';

type ProductoItem = {
  producto_id: number | null;
  producto_nombre: string;
  precio_unitario: string;
  cantidad: string;
  descuento: string;
  iva: string;
};

type Servicio = {
  id: number;
  nombre: string;
  precio_unitario: number;
};

const VentaServicios = () => {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [numeroFactura, setNumeroFactura] = useState(`POS-${Date.now()}`);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [clientes, setClientes] = useState<any[]>([{ id: 0, nombre: 'Cliente Anónimo' }]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState<Servicio[]>([]);
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const clientesData = await FetchData('/inv/clientes');
        setClientes([{ id: 0, nombre: 'Cliente Anónimo' }, ...clientesData]);

        // Solo cargar servicios (puedes filtrar en el backend por categoría "servicio")
        const serviciosData = await FetchData('/inv/productos', 'GET', {
          control_stock: 0 // Suponiendo que la categoría de servicios es 2
        });
        const formatedServicios = serviciosData.map((servicio: Servicio) => ({
          id: servicio.id,
          nombre: servicio.nombre,
          precio_unitario: servicio.precio_compra
        }));
        setServiciosDisponibles(formatedServicios);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar clientes o servicios');
      }
    }
    load();
  }, []);

  const handleAgregarProducto = () => {
    if (!selectedServicio) {
      toast.error('Seleccione un servicio antes de agregar');
      return;
    }
    setProductos([
      ...productos,
      {
        producto_id: selectedServicio.id,
        producto_nombre: selectedServicio.nombre,
        precio_unitario: selectedServicio.precio_unitario.toString(),
        cantidad: '1',
        descuento: '0',
        iva: '0'
      }
    ]);
    setSelectedServicio(null);
  };

  const handleProductoChange = (index: number, field: keyof ProductoItem, value: any) => {
    const newProds = [...productos];
    newProds[index][field] = value;
    setProductos(newProds);
  };

  const handleEliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const subtotal = productos.reduce(
    (acc, p) => acc + (parseFloat(p.precio_unitario) || 0) * (parseFloat(p.cantidad) || 0),
    0
  );
  const totalDescuento = productos.reduce((acc, p) => acc + (parseFloat(p.descuento) || 0), 0);
  const totalIva = productos.reduce((acc, p) => acc + (parseFloat(p.iva) || 0), 0);
  const total = subtotal - totalDescuento + totalIva;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productos.length === 0) {
      toast.error('Agregue al menos un servicio');
      return;
    }

    const detalles = productos.map((p) => ({
      producto_id: p.producto_id,
      precio_unitario: parseFloat(p.precio_unitario),
      cantidad: parseFloat(p.cantidad),
      descuento: parseFloat(p.descuento),
      iva: parseFloat(p.iva)
    }));

    try {
      const res = await FetchData('/inv/ventas-sin-stock', 'POST', {
        cliente_id: clienteId || 0,
        numero_factura: numeroFactura,
        fecha,
        observaciones: '',
        detalles
      });
      if (res.message) {
        toast.success(res.message);
        setClienteId(null);
        setNumeroFactura(`POS-${Date.now()}`);
        setFecha(new Date().toISOString().split('T')[0]);
        setProductos([]);
        navigate('/inventory/sale-management');
      } else {
        toast.error('Error al crear venta');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear venta');
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Punto de Venta - Servicios
      </Typography>
      <form onSubmit={handleSubmit} className="p-6 rounded shadow-lg">
        {/* Cliente y Factura */}
        <Box mb={4} display="flex" gap={2}>
          <FormControl sx={{ width: 200 }}>
            <InputLabel>Cliente</InputLabel>
            <Select
              value={clienteId ?? ''}
              onChange={(e) => setClienteId(e.target.value ? parseInt(e.target.value) : null)}
            >
              {clientes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Número de Factura"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
            required
            sx={{ width: 200 }}
          />
          <TextField
            type="date"
            label="Fecha"
            InputLabelProps={{ shrink: true }}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            sx={{ width: 200 }}
          />
        </Box>

        {/* Selección de Servicio */}
        <Box mb={4} display="flex" gap={2} alignItems="center">
          <Autocomplete
            options={serviciosDisponibles}
            getOptionLabel={(option: Servicio) => option.nombre}
            value={selectedServicio}
            onChange={(_, value) => setSelectedServicio(value)}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Seleccionar Servicio" />}
          />
          <Button variant="contained" color="secondary" onClick={handleAgregarProducto}>
            Agregar Servicio
          </Button>
        </Box>

        {/* Tabla de Servicios */}
        <Box mb={4}>
          <table className="w-full table-auto border-collapse border border-gray-300 mt-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Servicio</th>
                <th className="border border-gray-300 p-2">Cantidad</th>
                <th className="border border-gray-300 p-2">Precio Unitario</th>
                <th className="border border-gray-300 p-2">Descuento</th>
                <th className="border border-gray-300 p-2">IVA</th>
                <th className="border border-gray-300 p-2">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 p-2">{p.producto_nombre}</td>
                  <td className="border border-gray-300 p-2">
                    <TextField
                      type="number"
                      value={p.cantidad}
                      onChange={(e) => handleProductoChange(i, 'cantidad', e.target.value)}
                      inputProps={{ min: '1', step: '1' }}
                      required
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <TextField
                      type="number"
                      value={p.precio_unitario}
                      onChange={(e) => handleProductoChange(i, 'precio_unitario', e.target.value)}
                      inputProps={{ min: '0', step: '0.01' }}
                      required
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <TextField
                      type="number"
                      value={p.descuento}
                      onChange={(e) => handleProductoChange(i, 'descuento', e.target.value)}
                      inputProps={{ min: '0', step: '0.01' }}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <TextField
                      type="number"
                      value={p.iva}
                      onChange={(e) => handleProductoChange(i, 'iva', e.target.value)}
                      inputProps={{ min: '0', step: '0.01' }}
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <IconButton onClick={() => handleEliminarProducto(i)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>

        {/* Totales */}
        <Box mb={4}>
          <Typography>Subtotal: ${subtotal.toFixed(2)}</Typography>
          <Typography>Descuento: -${totalDescuento.toFixed(2)}</Typography>
          <Typography>IVA: ${totalIva.toFixed(2)}</Typography>
          <Typography>Total: ${total.toFixed(2)}</Typography>
        </Box>

        <Box display="flex" justifyContent="flex-end">
          <Button type="submit" variant="contained" color="primary">
            Finalizar Venta
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default VentaServicios;
