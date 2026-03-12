import { useState, useEffect } from 'react';
import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import { MenuItem, TextField } from '@mui/material';
import { useNotification } from '@/hooks';

type ProductoItem = {
  producto_id: number | null;
  precio_unitario: string;
  cantidad: string;
  series: string[];
  descuento: string;
  iva: string;
  almacen_id?: number;
  percha_id?: any;
  perchas?: any[];
};

const CrearMovimiento = () => {
  const notification = useNotification();
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
  const [productos, setProductos] = useState<ProductoItem[]>([
    {
      producto_id: null,
      precio_unitario: '',
      cantidad: '1',
      series: [generate_random_string(8)],
      descuento: '0',
      iva: '0',
      almacen_id: undefined,
      percha_id: undefined
    }
  ]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<any[]>([]);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setProveedores(await FetchData('/inv/proveedores'));
      setClientes(await FetchData('/inv/clientes'));
      setProductosDisponibles(await FetchData('/inv/productos'));
      setAlmacenes(await FetchData('/inv/almacenes'));
    }
    load();
  }, []);

  const getPerchas = async (almacenId: number, index: number) => {
    if (!almacenId) return;
    const data = await FetchData(`/inv/perchas`, 'GET', { almacen_id: almacenId });
    const newProds = [...productos];
    newProds[index].perchas = data;
    newProds[index].percha_id = undefined;
    setProductos(newProds);
  };

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
        iva: '0',
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
    setProductos(newProds);
  };

  const handleEliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tipo) {
      notification.error('Seleccione un tipo de movimiento');
      return;
    }

    if (
      productos.some((p) => !p.producto_id || !p.precio_unitario || !p.cantidad) ||
      productos.length === 0
    ) {
      notification.error('Complete todos los campos de los productos');
      return;
    }

    const detalles = productos.map((p) => ({
      producto_id: p.producto_id,
      precio_unitario: parseFloat(p.precio_unitario),
      cantidad: parseFloat(p.cantidad),
      series: p.series,
      almacen_id: p.almacen_id,
      percha_id: p.percha_id
    }));

    const body = {
      tipo,
      proveedor_id: proveedorId,
      cliente_id: null,
      observaciones,
      estado: 'pendiente',
      detalles
    };

    setLoading(true);
    try {
      const res = await FetchData('/inv/movimientos', 'POST', body);

      if (res.message) {
        notification.success('Movimiento creado exitosamente', res.message);
        setTipo('');
        setProveedorId(null);
        setObservaciones('');
        setFecha('');
        setProductos([
          {
            producto_id: null,
            precio_unitario: '',
            cantidad: '1',
            series: [generate_random_string(8)],
            descuento: '0',
            iva: '0',
            almacen_id: undefined,
            percha_id: undefined
          }
        ]);
      } else {
        notification.error('Error al registrar movimiento');
      }
    } catch (error) {
      notification.error('Error al registrar movimiento');
    }
    setLoading(false);
  };

  return (
    <Container>
      <h2 className="text-3xl font-bold mb-6">Crear Movimiento</h2>
      <form onSubmit={handleSubmit} className="p-6 rounded shadow-lg">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block font-semibold mb-1">Tipo de Movimiento</label>
            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              <option value="">-- Seleccione --</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Proveedor</label>
            <select
              className="input"
              value={proveedorId ?? ''}
              onChange={(e) => setProveedorId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">-- Seleccione proveedor --</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razon_social}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Cliente</label>
            <select
              className="input"
              value={clienteId ?? ''}
              onChange={(e) => setClienteId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">-- Seleccione cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Fecha</label>
            <input
              type="date"
              className="input"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-1">Observaciones</label>
          <textarea
            className="input"
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <div className="col-span-3 text-right mb-4">
          <button type="button" className="btn btn-primary" onClick={handleAgregarProducto}>
            Agregar Producto
          </button>
        </div>

        {/* Tabla Productos */}
        <table className="w-full mb-6 table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Producto</th>
              <th className="border border-gray-300 p-2 text-left">Almacén</th>
              <th className="border border-gray-300 p-2 text-left">Percha</th>
              <th className="border border-gray-300 p-2 text-right">Cantidad</th>
              <th className="border border-gray-300 p-2 text-right">Precio Unitario</th>
              <th className="border border-gray-300 p-2 text-left">Series</th>
              <th className="border border-gray-300 p-2 text-right">Descuento</th>
              <th className="border border-gray-300 p-2 text-right">IVA</th>
              <th className="border border-gray-300 p-2">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr key={i} className="even:bg-gray-50">
                <td className="border border-gray-300 p-2">
                  <TextField
                    select
                    fullWidth
                    value={p.producto_id ?? ''}
                    onChange={(e) =>
                      handleProductoChange(
                        i,
                        'producto_id',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
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
                </td>
                <td className="border border-gray-300 p-2">
                  <TextField
                    select
                    fullWidth
                    disabled={!p.producto_id}
                    value={p.almacen_id ?? ''}
                    onChange={(e) => {
                      const almacenId = e.target.value ? parseInt(e.target.value) : null;
                      handleProductoChange(i, 'almacen_id', almacenId);
                      if (almacenId) getPerchas(almacenId, i);
                    }}
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
                </td>
                <td className="border border-gray-300 p-2">
                  <TextField
                    select
                    fullWidth
                    value={p.percha_id ?? ''}
                    onChange={(e) =>
                      handleProductoChange(
                        i,
                        'percha_id',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    disabled={!p.almacen_id}
                  >
                    <MenuItem value="" disabled>
                      -- Seleccione --
                    </MenuItem>
                    {(p.perchas ?? []).map((per) => (
                      <MenuItem key={per.id} value={per.id}>
                        {per.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  <input
                    type="number"
                    min="1"
                    className="w-20 text-right"
                    value={p.cantidad}
                    onChange={(e) => handleProductoChange(i, 'cantidad', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-28 text-right"
                    value={p.precio_unitario}
                    onChange={(e) => handleProductoChange(i, 'precio_unitario', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2">{p.series.join(', ')}</td>
                <td className="border border-gray-300 p-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-28 text-right"
                    value={p.descuento}
                    onChange={(e) => handleProductoChange(i, 'descuento', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-28 text-right"
                    value={p.iva}
                    onChange={(e) => handleProductoChange(i, 'iva', e.target.value)}
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {productos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarProducto(i)}
                      className="text-red-600 font-semibold hover:underline"
                      title="Eliminar producto"
                    >
                      ✖
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="text-right mb-6 text-xl font-semibold">
          Subtotal: <span className="text-green-600">${subtotal.toFixed(2)}</span>
          <br />
          Descuento:{' '}
          <span className="text-red-600">
            -${productos.reduce((acc, p) => acc + (parseFloat(p.descuento) || 0), 0).toFixed(2)}
          </span>
          <br />
          IVA:{' '}
          <span className="text-green-600">
            ${productos.reduce((acc, p) => acc + (parseFloat(p.iva) || 0), 0).toFixed(2)}
          </span>
          <br />
          Total: <span className="text-green-600">${total.toFixed(2)}</span>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? 'Guardando...' : 'Guardar Movimiento'}
          </button>
        </div>
      </form>
    </Container>
  );
};

export default CrearMovimiento;
