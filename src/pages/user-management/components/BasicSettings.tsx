import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { Select } from '@mui/material';
import { useNavigate } from 'react-router-dom';
interface IBasicSettingsProps {
  title: string;
}

const BasicSettings = ({ title }: IBasicSettingsProps) => {
  const location = useNavigate();
  return (
    <div className="card min-w-full">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary flex justify-center grow"
            onClick={() => location('/user-management')}
          >
            Regresar
          </button>
        </div>
      </div>
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
            <tr>
              <td className="py-3 text-gray-600 text-sm font-normal">Rol</td>
              <td className="py-3 text-gray-700 text-2sm font-normal">
                <div className="flex items-center gap-0.5">
                  <select className="select select">
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { BasicSettings, type IBasicSettingsProps };
