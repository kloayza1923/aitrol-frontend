import { KeenIcon } from '@/components';

import { CrudAvatarUpload } from '@/partials/crud';

const PersonalInfo = () => {
  return (
    <div className="card min-w-full">
      <div className="card-header">
        <h3 className="card-title">Información Personal</h3>
      </div>
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
                  <CrudAvatarUpload />
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-2 text-gray-600 font-normal">Nombre</td>
              <td className="py-2 text-gray-800 font-normaltext-sm">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  defaultValue="John Doe"
                />
              </td>
              <td className="py-2 text-center">
                {/*  <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a> */}
              </td>
            </tr>
            {/*   <tr>
              <td className="py-3 text-gray-600 font-normal">Disponibilidad</td>
              <td className="py-3 text-gray-800 font-normal">
                <span className="badge badge-sm badge-outline badge-success">Disponible ahora</span>
              </td>
              <td className="py-3 text-center">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr> */}
            <tr>
              <td className="py-3 text-gray-600 font-normal">Fecha de Nacimiento</td>
              <td className="py-3 text-gray-700 text-sm font-normal">
                <input
                  type="date"
                  className="input input-bordered w-full"
                  defaultValue="01/01/1990"
                />
              </td>
              <td className="py-3 text-center">
                {/*  <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a> */}
              </td>
            </tr>
            {/*             <tr>
              <td className="py-3 text-gray-600 font-normal">Género</td>
              <td className="py-3 text-gray-700 text-sm font-normal">Masculino</td>
              <td className="py-3 text-center">
                <a href="#" className="btn btn-sm btn-icon btn-clear btn-primary">
                  <KeenIcon icon="notepad-edit" />
                </a>
              </td>
            </tr> */}
            <tr>
              <td className="py-3">Dirección</td>
              <td className="py-3 text-gray-700 text-2sm font-normal">
                <input
                  type="text"
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
    </div>
  );
};

export { PersonalInfo };
