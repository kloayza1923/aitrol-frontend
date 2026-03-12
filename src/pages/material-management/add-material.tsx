import { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { PageNavbar } from '@/pages/account';
import { useLayout } from '@/providers';
import { useNavigate } from 'react-router-dom';
import { FetchData } from '@/utils/FetchData';
import { useNotification } from '@/hooks';

const AddMaterial = () => {
  const { currentLayout } = useLayout();
  const notification = useNotification();
  const location = useNavigate();
  const [avatar, setAvatar] = useState<any>([]);

  const validate_fields = (data: any) => {
    if (!data.nombre) {
      notification.error('Por favor, llene todos los campos');
      return false;
    }
    return true;
  };

  const create_user = async (e: event) => {
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

    const fetchdata = await FetchData('materiales', 'POST', data);
    if (fetchdata.detail) {
      notification.error(fetchdata.detail);
    } else if (fetchdata.mensaje) {
      notification.success(fetchdata.mensaje);
      location('/materiales-management');
    }
    return;
  };

  return (
    <Fragment>
      <Container>
        <div className="card min-w-full">
          <div className="card-header">
            <h3 className="card-title">Agregar Material</h3>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary flex justify-center grow"
                onClick={() => location('/materiales-management')}
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

export { AddMaterial };
