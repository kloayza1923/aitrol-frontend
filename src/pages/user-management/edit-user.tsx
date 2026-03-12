import { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { PageNavbar } from '@/pages/account';

import { KeenIcon, useDataGrid } from '@/components';
import { ColumnDef, Column, RowSelectionState } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useLayout } from '@/providers';
import { CrudAvatarUpload } from '@/partials/crud';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FetchData } from '@/utils/FetchData';

const EditUserLayout = () => {
  const { currentLayout } = useLayout();
  const location = useNavigate();
  const lc = useLocation();
  const [user, setUser] = useState<any>(null);
  const id = lc.state?.user_id;

  const [avatar, setAvatar] = useState<any>([]);
  const [role, setRole] = useState<any>(null);
  const users = [
    {
      name: 'John Doe',
      role: 'Admin',
      email: '',
      status: 'Active'
    },
    {
      name: 'Jane Doe',
      role: 'User',
      email: '',
      status: 'Active'
    },
    {
      name: 'John Smith',
      role: 'User',
      email: '',
      status: 'Active'
    },
    {
      name: 'Jane Smith',
      role: 'User',
      email: '',
      status: 'Active'
    }
  ];
  const get_user = async () => {
    if (!id) {
      toast.error('Error al obtener el vehículo');
      return;
    }
    const data = await FetchData('users_edit/' + id, 'GET', null); // Obtener vehículo desde el backend
    if (data.detail) {
      toast.error(data.detail);
      return;
    }
    console.log(data);
    setUser(data);

    const form = document.getElementById('add-user-form');
    if (!form) return;
    const inputs = form.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];

      try {
        if (input.type === 'file') continue;
        if (input.name === 'password') continue;
        input.value = data[input.name];
      } catch (e) {
        console.log(e);
      }
    }
    const selects = form.getElementsByTagName('select');
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i];
      try {
        select.value = data[select.name];
      } catch (e) {
        console.log(e);
      }
    }
  };
  const validate_fields = (data: any) => {
    if (
      !data.nombre_usuario ||
      !data.nombre ||
      !data.apellido ||
      !data.fecha_nacimiento ||
      !data.direccion ||
      !data.telefono
    ) {
      toast.error('Por favor, llene todos los campos');
      return false;
    }
    return true;
  };
  const get_roles = async () => {
    const data = await FetchData('roles', 'GET', null);
    console.log(data);
    if (data.detail) {
      toast.error(data.detail);
      return;
    }
    setRole(data);
    get_user();
  };
  useEffect(() => {
    get_roles();
  }, []);
  useEffect(() => {
    console.log(avatar);
  }, [avatar]);
  const create_user = async (e: event) => {
    // create user
    e.preventDefault();
    const form = document.getElementById('add-user-form');
    //console.log(form);
    if (!form) return;
    const formData = new FormData(form as HTMLFormElement);
    const data = {} as any;
    formData.forEach((value, key) => {
      if (value === '') return;
      data[key] = value;
    });
    const avatar_input = document.getElementById('avatar_input');
    if (avatar_input) {
      data.foto = avatar_input.getAttribute('src');
    }
    console.log(data);
    if (!validate_fields(data)) return;
    const fetchdata = await FetchData('usuarios/' + id, 'PUT', data);
    if (fetchdata.detail) {
      toast.error(fetchdata.detail);
    } else if (fetchdata.mensaje) {
      toast.success(fetchdata.mensaje);
      location('/user-management');
    }
    return;
  };
  return (
    <Fragment>
      <PageNavbar />
      <Container></Container>
      <Container>
        {/*         <BasicSettings title="Configuración básica" />
        <br />
        <PersonalInfo /> */}
        <div className="card min-w-full">
          <div className="card-header">
            <h3 className="card-title">Editar Usuario</h3>

            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary flex justify-center grow"
                onClick={() => location('/user-management')}
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
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Correo Electrónico</td>
                    <td className="py-2 min-w-60">
                      {/* <a href="#" className="text-gray-800 font-normal text-sm hover:text-primary-active">
                  jasontt@studio.co
                </a> */}
                      <input
                        name="correo"
                        type="text"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0  text-center"
                      />
                    </td>
                    <td className="py-2 max-w-16 text-end">
                      {/*   <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a> */}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Nombre de usuario</td>
                    <td className="py-2 min-w-60">
                      {/* <a href="#" className="text-gray-800 font-normal text-sm hover:text-primary-active">
                  jasontt@studio.co
                </a> */}
                      <input
                        name="nombre_usuario"
                        type="text"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0  text-center"
                      />
                    </td>
                    <td className="py-2 max-w-16 text-end">
                      {/*   <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a> */}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 text-gray-600 font-normal">Contraseña</td>
                    <td className="py-2 text-gray-700 font-normal">
                      <input
                        name="password"
                        autoComplete="off"
                        type="password"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0  text-center"
                      />
                    </td>
                    <td className="py-2 text-end">
                      {/*  <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a> */}
                    </td>
                  </tr>
                  {/*  <tr>
                                        <td className="py-3 text-gray-600 text-sm font-normal">Rol</td>
                                        <td className="py-3 text-gray-700 text-2sm font-normal"
                                        >
                                            <div className="flex items-center gap-0.5">
                                                <select className='select select' name='rol_id'>
                                                    <option value=''>Seleccione un rol</option>
                                                    {role && role.map((item: any, index: number) => {
                                                        return (
                                                            <option key={index} value={item.id}>
                                                                {item.nombre}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        </td>
                                    </tr> */}
                </tbody>
              </table>
            </div>
            <span className="ml-5 text-dark font-medium">Información Personal</span>
            <div className="card-table scrollable-x-auto pb-3">
              <table className="table align-middle text-sm text-gray-500">
                <tbody>
                  <tr>
                    <td className="py-2 min-w-28 text-gray-600 font-normal">Foto</td>
                    <td className="py-2 text-gray700 font-normal min-w-32 text-2sm">
                      Imagen JPEG, PNG 150x150px
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex justify-center items-center">
                        <CrudAvatarUpload avatar={avatar} setAvatar={setAvatar} />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-normal">Nombre</td>
                    <td className="py-2 text-gray-800 font-normaltext-sm">
                      <input
                        type="text"
                        name="nombre"
                        className="input input-bordered w-full"
                        defaultValue="John Doe"
                      />
                    </td>
                    <td className="py-2 text-center"></td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-normal">Apellido</td>
                    <td className="py-2 text-gray-800 font-normaltext-sm">
                      <input
                        type="text"
                        name="apellido"
                        className="input input-bordered w-full"
                        defaultValue="John Doe"
                      />
                    </td>
                    <td className="py-2 text-center"></td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-600 font-normal">Fecha de Nacimiento</td>
                    <td className="py-3 text-gray-700 text-sm font-normal">
                      <input
                        type="date"
                        name="fecha_nacimiento"
                        className="input input-bordered w-full"
                        defaultValue="01/01/1990"
                      />
                    </td>
                    <td className="py-3 text-center"></td>
                  </tr>
                  <tr>
                    <td className="py-3">Dirección</td>
                    <td className="py-3 text-gray-700 text-2sm font-normal">
                      <input
                        type="text"
                        name="direccion"
                        className="input input-bordered w-full"
                        defaultValue="Calle 123, Ciudad, País"
                      />
                    </td>
                    <td className="py-3 text-center">
                      {/*  <a href="#" className="btn btn-link btn-sm">
                  Agregar
                </a> */}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">Telefono</td>
                    <td className="py-3 text-gray-700 text-2sm font-normal">
                      <input
                        type="text"
                        name="telefono"
                        className="input input-bordered w-full"
                        defaultValue="+1234567890"
                      />
                    </td>
                    <td className="py-3 text-center">
                      {/* <a href="#" className="btn btn-link btn-sm">
                  Agregar
                </a> */}
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

export { EditUserLayout };
