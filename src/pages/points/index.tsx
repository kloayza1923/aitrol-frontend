import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container } from '@/components/container';
import { DataGrid, DataGridRowSelect, KeenIcon } from '@/components';
import { toast } from 'sonner';
import { useLayout } from '@/providers';
import { FetchData } from '@/utils/FetchData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';

// Toolbar separada para evitar errores de referencia
const Toolbar = ({ searchInput, setSearchInput }) => {
  const navigate = useNavigate();
  return (
    <div className="card-header flex-wrap gap-2 border-b-0 px-5">
      <h3 className="card-title font-medium text-sm"></h3>
      <div className="flex flex-wrap gap-2 lg:gap-5">
        <div className="flex">
          <label className="input input-sm">
            <KeenIcon icon="magnifier" />
            <input
              type="text"
              placeholder="Buscar"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
        </div>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            navigate('/order-management-add');
          }}
        >
          <KeenIcon icon="plus" /> Agregar Orden
        </button>
      </div>
    </div>
  );
};
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '1px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: '10px'
};

// Componente principal
const Points = () => {
  const { currentLayout } = useLayout();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [id, setId] = useState(0);
  const navigate = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [registrosAnteriores, setRegistrosAnteriores] = useState([]);
  useEffect(() => {
    const get_data = async () => {
      const response = await FetchData('points', 'GET', {});
      if (response) {
        setRegistros(response.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
        setRegistrosAnteriores(response.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      } else {
        toast.error('Error al obtener los datos');
      }
    };
    get_data();
  }, []);

  return (
    <Fragment>
      <Container>
        <div className="card-header flex-wrap gap-2 border-b-0 px-5">
          <h3 className="card-title font-medium text-sm"></h3>
          <div className="flex flex-wrap gap-2 lg:gap-5">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                navigate('/points-management/add-points');
              }}
            >
              <KeenIcon icon="plus" /> Agregar Puntos
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover table-striped">
            <thead>
              <tr>
                <th>Usuario </th>
                <th>Fecha Creación</th>
                <th>Puntos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center">
                    No hay registros
                  </td>
                </tr>
              )}
              {registros.map((item: any, index) => (
                <tr key={index}>
                  <td>{item.usuario}</td>
                  <td>{item.created_at}</td>
                  <td>{item.puntos}</td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <KeenIcon icon="dots-vertical" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[150px] bg-white border border-gray-200 z-50
                      shadow-lg rounded-lg p-4"
                      >
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            navigate(`/points-management/edit-points/${item.id}`);
                          }}
                        >
                          <Button variant="link" size="sm">
                            <KeenIcon icon="pencil" />
                            Editar
                          </Button>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            const confirm = window.confirm(
                              '¿Está seguro de que desea eliminar esta orden?'
                            );
                            if (confirm) {
                              // Aquí puedes agregar la lógica para eliminar la orden
                              const deleteOrder = async () => {
                                const response = await FetchData('points/' + item.id, 'DELETE', {});
                                if (response) {
                                  setRegistros(
                                    registros.filter((registro: any) => registro.id !== item.id)
                                  );
                                  toast.success('Puntos eliminados correctamente');
                                } else {
                                  toast.error('Error al eliminar la Puntos');
                                }
                              };
                              deleteOrder();
                              toast.success('Puntos eliminados correctamente');
                            }
                          }}
                        >
                          <Button variant="link" size="sm">
                            <KeenIcon icon="trash" />
                            Eliminar
                          </Button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </Fragment>
  );
};

export { Points };
