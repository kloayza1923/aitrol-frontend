import { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { PageNavbar } from '@/pages/account';
import { useLayout } from '@/providers';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FetchData } from '@/utils/FetchData';
import { AuthContext } from '@/auth/providers/JWTProvider';

interface ListaPrecio {
  id: number;
  nombre: string;
  descuento_global: number;
}

const ClientEditLayout = () => {
  const { currentLayout } = useLayout();
  const location = useNavigate();
  const [client, setClient] = useState<any>({});
  const lc = useLocation();
  const id = lc.state?.client_id;
  const [avatar, setAvatar] = useState<any>([]);
  const [listas, setListas] = useState<ListaPrecio[]>([]);
  const [listaPrecioId, setListaPrecioId] = useState<number | null>(null);
  const { auth } = useAuthContext();
  const sucursal = (AuthContext?.user as any)?.id_sucursal;

  const validate_fields = (data: any) => {
    if (!data.nombre || !data.direccion || !data.telefono) {
      toast.error('Por favor, llene todos los campos obligatorios');
      return false;
    }
    return true;
  };

  const get_client = async () => {
    if (!id) {
      toast.error('Error al obtener el cliente');
      return;
    }
    const data = await FetchData('clientes/' + id, 'GET', null);
    if (data.detail) {
      toast.error(data.detail);
      return;
    }
    setClient(data);
    setListaPrecioId(data.lista_precio_id || null);

    const form = document.getElementById('add-user-form');
    if (!form) return;
    const inputs = form.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      try {
        input.value = data[input.name];
      } catch (e) {
        console.log(e);
      }
    }
  };

  const load_listas = async () => {
    try {
      const data = await FetchData('listas-precio', 'GET', { id_sucursal: sucursal });
      setListas(data || []);
    } catch {
      // silencioso si falla
    }
  };

  useEffect(() => {
    get_client();
    load_listas();
  }, []);

  const create_user = async (e: any) => {
    e.preventDefault();
    const form = document.getElementById('add-user-form');
    if (!form) return;
    const formData = new FormData(form as HTMLFormElement);
    const data = {} as any;
    formData.forEach((value, key) => {
      data[key] = value;
    });
    const avatar_input = document.getElementById('avatar_input');
    if (avatar_input) {
      data.foto = avatar_input.getAttribute('src');
    }
    // Añadir lista de precio desde estado React
    if (listaPrecioId) {
      data.lista_precio_id = listaPrecioId;
    }
    if (!validate_fields(data)) return;

    const fetchdata = await FetchData('clientes/' + id, 'PUT', data);
    if (fetchdata.detail) {
      toast.error(fetchdata.detail);
    } else if (fetchdata.mensaje) {
      toast.success(fetchdata.mensaje);
      location('/client-management');
    }
    return;
  };

  return (
    <Fragment>
      <Container>
        <div className="card min-w-full">
          <div className="card-header">
            <h3 className="card-title">Editar Cliente</h3>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary flex justify-center grow"
                onClick={() => location('/client-management')}
              >
                Regresar
              </button>
            </div>
          </div>
          <form id="add-user-form" className="card-body" onSubmit={(e) => create_user(e)}>
            <div className="card-table scrollable-x-auto pb-3">
              <table className="table align-middle text-sm text-gray-500">
                <tbody>
                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Nombre</td>
                    <td className="py-2 min-w-60">
                      <input
                        name="nombre"
                        type="text"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0 text-center"
                      />
                    </td>
                    <td className="py-2 max-w-16 text-end"></td>
                  </tr>

                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Apellido</td>
                    <td className="py-2 min-w-60">
                      <input
                        name="apellido"
                        type="text"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0 text-center"
                      />
                    </td>
                    <td className="py-2 max-w-16 text-end"></td>
                  </tr>

                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">RUC</td>
                    <td className="py-2 min-w-60">
                      <input
                        name="ruc"
                        type="text"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0 text-center"
                      />
                    </td>
                    <td className="py-2 max-w-16 text-end"></td>
                  </tr>

                  <tr>
                    <td className="py-2 text-gray-600 font-normal">Dirección</td>
                    <td className="py-2 text-gray-700 font-normal">
                      <input
                        name="direccion"
                        type="text"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0 text-center"
                      />
                    </td>
                    <td className="py-2 text-end"></td>
                  </tr>

                  <tr>
                    <td className="py-2 text-gray-600 font-normal">Valor TM</td>
                    <td className="py-2 text-gray-700 font-normal">
                      <input
                        name="valor_tm"
                        type="text"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0 text-center"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 text-gray-600 font-normal">Teléfono</td>
                    <td className="py-2 text-gray-700 font-normal">
                      <input
                        name="telefono"
                        type="text"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0 text-center"
                      />
                    </td>
                    <td className="py-2 text-end"></td>
                  </tr>

                  {/* ── Lista de precio ── */}
                  <tr>
                    <td className="py-2 text-gray-600 font-normal">
                      Lista de precio
                      <p className="text-xs text-gray-400 font-normal">
                        Descuentos especiales asignados
                      </p>
                    </td>
                    <td className="py-2 text-gray-700 font-normal" colSpan={2}>
                      <select
                        className="select w-full max-w-xs focus:border-primary-clarity focus:ring focus:ring-primary-clarity"
                        value={listaPrecioId ?? ''}
                        onChange={(e) =>
                          setListaPrecioId(e.target.value ? Number(e.target.value) : null)
                        }
                      >
                        <option value="">— Sin lista de precio —</option>
                        {listas.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.nombre}
                            {l.descuento_global > 0 ? ` (${l.descuento_global}% desc.)` : ''}
                          </option>
                        ))}
                      </select>
                      {listaPrecioId && listas.find((l) => l.id === listaPrecioId) && (
                        <p className="text-xs text-success mt-1">
                          ✓ Descuento global:{' '}
                          {listas.find((l) => l.id === listaPrecioId)?.descuento_global}%
                        </p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-center mt-5">
              <button className="btn btn-outline btn-primary mb-5" type="submit">
                Actualizar
              </button>
            </div>
          </form>
        </div>
      </Container>
    </Fragment>
  );
};

export { ClientEditLayout };
