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

const EditVehicleLayout = () => {
  const { currentLayout } = useLayout();
  const location = useNavigate();
  const lc = useLocation();
  const id = lc.state?.vehicle_id;
  const [avatar, setAvatar] = useState<any>([]);
  const [types, setTypes] = useState<any>([]); // Para los tipos
  const [vehicle, setVehicle] = useState<any>([]); // Para los vehículos
  const [status, setStatus] = useState<boolean>(true); // Estado activo/inactivo
  const [conductores, setConductores] = useState<any>([]); // Para los conductores

  const validate_fields = (data: any) => {
    if (
      !data.nombre ||
      !data.tipo_id ||
      !data.kilometraje_inicial ||
      !data.capacidad ||
      !data.estado
    ) {
      toast.error('Por favor, llene todos los campos');
      return false;
    }
    return true;
  };
  const get_types = async () => {
    const data = await FetchData('vehicles_types', 'GET', null); // Obtener tipos desde el backend
    if (data.detail) {
      toast.error(data.detail);
      return;
    }
    setTypes(data); // Asignar tipos
  };
  const get_conductores = async () => {
    const data = await FetchData('users', 'GET', null); // Obtener conductores desde el backend
    console.log(data);
    if (data.detail) {
      toast.error(data.detail);
      return;
    }
    setConductores(data); // Asignar conductores
  };
  useEffect(() => {
    if (conductores.length === 0) return;
    get_vehicle(); // Cargar vehículo al inicio
  }, [conductores]);
  const get_vehicle = async () => {
    if (!id) {
      toast.error('Error al obtener el vehículo');
      return;
    }
    const data = await FetchData('vehicles/' + id, 'GET', null); // Obtener vehículo desde el backend
    if (data.detail) {
      toast.error(data.detail);
      return;
    }
    setVehicle(data); // Asignar vehículo

    const form = document.getElementById('add-form');
    if (!form) return;
    const inputs = form.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (input.name === 'foto') {
        /* console.log("Foto", data[input.name]);
                const avatar_input = document.getElementById('avatar_input');
                if (avatar_input) {
                    avatar_input.setAttribute('src', data.foto);
                } */
        //setAvatar(data[input.name]);
      } else {
        try {
          input.value = data[input.name];
        } catch (e) {
          console.log(e);
        }
      }
    }
    const selects = form.getElementsByTagName('select');
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i];
      console.log(select.name);
      select.value = data[select.name];
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  useEffect(() => {
    get_types(); // Cargar tipos al inicio
    get_conductores(); // Cargar conductores al inicio
    //get_vehicle(); // Cargar vehículo al inicio
  }, []);

  const create_vehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = document.getElementById('add-form');
    if (!form) return;
    const formData = new FormData(form as HTMLFormElement);
    const data: any = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    const avatar_input = document.getElementById('avatar_input');
    if (avatar_input) {
      data.foto = avatar_input.getAttribute('src');
    } else {
      data.foto = '';
    }

    if (!validate_fields(data)) return;

    const fetchdata = await FetchData('vehicles/' + id, 'PUT', data);
    if (fetchdata.detail) {
      toast.error(fetchdata.detail);
    } else if (fetchdata.mensaje) {
      toast.success(fetchdata.mensaje);
      location('/vehicle-management');
    }
  };

  return (
    <Fragment>
      <Container>
        <div className="card min-w-full">
          <div className="card-header">
            <h3 className="card-title">Editar Vehículo</h3>
            <p className="text-sm text-gray-500">Complete los campos para editar un vehículo</p>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary flex justify-center grow"
                onClick={() => location('/vehicle-management')}
              >
                Regresar
              </button>
            </div>
          </div>
          <form id="add-form" className="card-body" onSubmit={(e) => create_vehicle(e)}>
            <div className="card-table scrollable-x-auto pb-3">
              <table className="table align-middle text-sm text-gray-500">
                <tbody>
                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Placa</td>
                    <td className="py-2 min-w-60">
                      <input
                        name="nombre"
                        type="text"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0 text-center"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Conductor</td>
                    <td className="py-2 min-w-60">
                      <select name="conductor_id" className="select select-bordered">
                        <option value="">Seleccione un conductor</option>
                        {conductores &&
                          conductores.map((item: any, index: number) => (
                            <option key={index} value={item.id}>
                              {item.nombre}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Tipo</td>
                    <td className="py-2 min-w-60">
                      <select name="tipo_id" className="select select-bordered">
                        <option value="">Seleccione un tipo</option>
                        {types &&
                          types.map((item: any, index: number) => (
                            <option key={index} value={item.id}>
                              {item.nombre}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Kilometraje Inicial</td>
                    <td className="py-2 min-w-60">
                      <input
                        name="kilometraje_inicial"
                        type="number"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0 text-center"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Capacidad</td>
                    <td className="py-2 min-w-60">
                      <input
                        name="capacidad"
                        type="number"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0 text-center"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 text-gray-600 font-normal">Estado</td>
                    <td className="py-2">
                      <select name="estado" className="select select-bordered">
                        <option value="1">Activo</option>
                        <option value="0">Inactivo</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-normal">Aviso de Mantenimiento</td>
                    <td className="py-2">
                      <input
                        name="aviso_mantenimiento"
                        type="number"
                        className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0 text-center"
                        placeholder="Kilometros
                                        "
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 min-w-36 text-gray-600 font-normal">Foto</td>
                    <td className="py-2 text-gray-700 font-normal min-w-32 text-2sm">
                      Imagen JPEG, PNG 150x150px
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex justify-center items-center">
                        <CrudAvatarUpload avatar={avatar} setAvatar={setAvatar} />
                      </div>
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

export { EditVehicleLayout };
