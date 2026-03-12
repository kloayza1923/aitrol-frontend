import { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { PageNavbar } from '@/pages/account';
import { useLayout } from '@/providers';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FetchData } from '@/utils/FetchData';

const AddPoints = () => {
  const { currentLayout } = useLayout();
  const location = useNavigate();
  const [avatar, setAvatar] = useState<any>([]);
  const [users, setUsers] = useState<any>([]);
  const [points, setPoints] = useState<number>(0);

  const validate_fields = (data: any) => {
    if (!data.user_id || !data.points) {
      toast.error('Por favor, llene todos los campos');
      return false;
    }
    return true;
  };

  const create_points = async (e: event) => {
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
    console.log(data);
    if (!validate_fields(data)) return;

    const fetchdata = await FetchData('points', 'POST', data);
    if (fetchdata.detail) {
      toast.error(fetchdata.detail);
    } else if (fetchdata.mensaje) {
      toast.success(fetchdata.mensaje);
      location('/points-management');
    }
    return;
  };

  const get_users = async () => {
    const response = await FetchData('users', 'GET', {});
    if (response) {
      setUsers(response);
    } else {
      toast.error('Error al obtener los datos');
    }
  };
  useEffect(() => {
    get_users();
  }, []);

  return (
    <Fragment>
      <Container>
        <div className="card min-w-full">
          <div className="card-header">
            <h3 className="card-title">Agregar Puntos</h3>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary flex justify-center grow"
                onClick={() => location('/points-management')}
              >
                Regresar
              </button>
            </div>
          </div>
          <form id="add-user-form" className="card-body" onSubmit={(e) => create_points(e)}>
            <div className="card-table scrollable-x-auto pb-3">
              <table className="table align-middle text-sm text-gray-500">
                <tbody>
                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Usuario</td>
                    <td className="py-2 min-w-60">
                      <select
                        className="input input-sm w-full"
                        name="user_id"
                        id="user_id"
                        onChange={(e) => setPoints(parseInt(e.target.value))}
                      >
                        <option value="">Seleccione un usuario</option>
                        {users.map((user: any) => (
                          <option key={user.id} value={user.id}>
                            {user.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 max-w-16 text-end"></td>
                  </tr>
                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Puntos</td>
                    <td className="py-2 min-w-60">
                      <input
                        type="number"
                        name="points"
                        id="points"
                        className="input input-sm w-full"
                        placeholder="0"
                        onChange={(e) => setPoints(parseInt(e.target.value))}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-center mt-5">
              <button className="btn btn-outline btn-primary mb-5" type="submit">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </Container>
    </Fragment>
  );
};

export { AddPoints };
