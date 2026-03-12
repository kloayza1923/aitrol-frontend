import { Fragment } from 'react';

import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { PageNavbar } from '@/pages/account';
import { useLayout } from '@/providers';
import { KeenIcon } from '@/components';
import { FetchData } from '@/utils/FetchData';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const CreateRol = () => {
  const { currentLayout } = useLayout();
  const location = useNavigate();
  const keenIcons = [
    'activity',
    'add',
    'alert-circle',
    'analytics',
    'api',
    'app-store',
    'arrow-down',
    'arrow-left',
    'arrow-right',
    'arrow-up',
    'at',
    'attachment',
    'badge',
    'bar-chart',
    'bell',
    'book',
    'bookmark',
    'briefcase',
    'calendar',
    'camera',
    'car',
    'chart-bar',
    'chart-line',
    'chart-line-star',
    'check',
    'check-circle',
    'cheque',
    'clock',
    'close',
    'close-circle',
    'cloud',
    'code',
    'cog',
    'collection',
    'color-palette',
    'compass',
    'credit-card',
    'currency-dollar',
    'dashboard',
    'database',
    'device',
    'document',
    'download',
    'edit',
    'email',
    'eye',
    'face-id',
    'file',
    'filter',
    'flag',
    'folder',
    'gift',
    'globe',
    'grid',
    'heart',
    'help',
    'home',
    'image',
    'inbox',
    'info',
    'key',
    'layers',
    'layout',
    'link',
    'list'
  ];
  const handleSave = async (event: any) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const data = {
      nombre: form.get('nombre'),
      descripcion: form.get('descripcion'),
      icono: form.get('icono'),
      subtitulo: form.get('subtitulo'),
      permisos: {
        crear: form.get('crear') === 'on' ? true : false,
        leer: form.get('leer') === 'on' ? true : false,
        actualizar: form.get('actualizar') === 'on' ? true : false,
        eliminar: form.get('eliminar') === 'on' ? true : false
      }
    };
    const fetchdata = await FetchData('create_role', 'POST', data);
    if (fetchdata.mensaje) {
      toast.success(fetchdata.mensaje);
      location('/account/members/roles');
    } else {
      toast.error('Error al crear el rol');
    }
  };
  return (
    <Fragment>
      <PageNavbar />

      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Crea un nuevo rol para tu equipo</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="flex justify-center items-center mb-10">
          <h1 className="text-4xl text-dark-400">Crear rol de equipo</h1>
        </div>
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="nombre" className="form-label pb-4">
                    Nombre del rol
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0"
                  />
                </div>
                <div>
                  <label htmlFor="subtitulo" className="form-label pb-4">
                    Subtítulo
                  </label>
                  <input
                    id="subtitulo"
                    name="subtitulo"
                    className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0"
                  />
                </div>
                <div>
                  <label htmlFor="descripcion" className="form-label pb-4">
                    Descripción
                  </label>
                  <input
                    id="descripcion"
                    name="descripcion"
                    className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity shrink-0"
                  />
                </div>
                <div>
                  <label htmlFor="icono" className="form-label pb-4">
                    Icono
                  </label>
                  <div className="flex items-center gap-4">
                    <select id="icono" name="icono" className="select select-bordered w-40">
                      {keenIcons.map((icon, index) => {
                        return (
                          <option key={index} value={icon}>
                            {icon}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 mt-10">
                <div>
                  <label htmlFor="permisos" className="form-label pb-4">
                    Permisos
                  </label>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <input type="checkbox" id="crear" name="crear" className="checkbox" />
                      <label htmlFor="crear" className="form-label">
                        Crear
                      </label>
                    </div>
                    <div>
                      <input type="checkbox" id="leer" name="leer" className="checkbox" />
                      <label htmlFor="leer" className="form-label">
                        Leer
                      </label>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        id="actualizar"
                        name="actualizar"
                        className="checkbox"
                      />
                      <label htmlFor="actualizar" className="form-label">
                        Actualizar
                      </label>
                    </div>
                    <div>
                      <input type="checkbox" id="eliminar" name="eliminar" className="checkbox" />
                      <label htmlFor="eliminar" className="form-label">
                        Eliminar
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-10">
                <button className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { CreateRol };
