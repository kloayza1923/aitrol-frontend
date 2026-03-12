import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import { Button } from '@mui/material';

const CompraShow = () => {
  const { id } = useParams<{ id: string }>();
  const [compra, setCompra] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useNavigate();

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const data = await FetchData(`/inv/compras/${id}`);
      setCompra(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading)
    return (
      <Container>
        <p>Cargando datos...</p>
      </Container>
    );
  if (!compra)
    return (
      <Container>
        <p>No se encontró la compra.</p>
      </Container>
    );

  const { proveedor_id, numero_factura, fecha, observaciones } = compra;
  const { detalles } = compra;

  return (
    <Container>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-3xl font-bold mb-6">Detalle de Compra #{id}</h2>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            location(`/inventory/purchase-management`);
          }}
        >
          Regresar
        </Button>
      </div>

      <div className="mb-6">
        <p>
          <strong>Proveedor ID:</strong> {proveedor_id}
        </p>
        <p>
          <strong>Número Factura:</strong> {numero_factura}
        </p>
        <p>
          <strong>Fecha:</strong> {fecha}
        </p>
        <p>
          <strong>Observaciones:</strong> {observaciones || '-'}
        </p>
      </div>

      <table className="w-full mb-6 table-auto border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">Producto ID</th>
            <th className="border border-gray-300 p-2 text-right">Producto</th>
            <th className="border border-gray-300 p-2 text-right">Cantidad</th>
            <th className="border border-gray-300 p-2 text-right">Precio Unitario</th>
            <th className="border border-gray-300 p-2 text-right">Descuento</th>
            <th className="border border-gray-300 p-2 text-right">IVA</th>
          </tr>
        </thead>
        <tbody>
          {detalles.map((d: any, i: number) => (
            <tr key={i} className="even:bg-gray-50">
              <td className="border border-gray-300 p-2">{d.producto_id}</td>
              <td className="border border-gray-300 p-2">{d.nombre}</td>
              <td className="border border-gray-300 p-2 text-right">{d.cantidad}</td>
              <td className="border border-gray-300 p-2 text-right">
                ${d.precio_unitario.toFixed(2)}
              </td>
              <td className="border border-gray-300 p-2 text-right">
                ${d.descuento?.toFixed(2) ?? '0.00'}
              </td>
              <td className="border border-gray-300 p-2 text-right">
                ${d.iva?.toFixed(2) ?? '0.00'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
};

export default CompraShow;
