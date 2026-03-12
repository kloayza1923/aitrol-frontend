import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Container } from '@/components/container';
import { DataGrid, DataGridRowSelect, KeenIcon, useDataGrid } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useLayout } from '@/providers';
import { FetchData } from '@/utils/FetchData';

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

        <div className="flex flex-wrap gap-2.5">
          <Select defaultValue="active">
            <SelectTrigger className="w-28" size="sm">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="w-32">
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="disabled">Deshabilitado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="latest">
            <SelectTrigger className="w-28" size="sm">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="w-32">
              <SelectItem value="latest">Más reciente</SelectItem>
              <SelectItem value="older">Más antiguo</SelectItem>
              <SelectItem value="oldest">Más viejo</SelectItem>
            </SelectContent>
          </Select>

          <button className="btn btn-sm btn-outline btn-primary">
            <KeenIcon icon="setting-4" /> Filtros
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              navigate('/puerto-management-add');
            }}
          >
            <KeenIcon icon="plus" /> Agregar puerto
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
const PuertoManagement = () => {
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const get_data = async () => {
      const response = await FetchData('puertos', 'GET', {});
      if (response) {
        setUsers(response);
      } else {
        toast.error('Error al obtener los datos');
      }
    };
    get_data();
  }, []);

  return (
    <Fragment>
      <Container>
        <DataGrid
          columns={[
            {
              accessorFn: (row: any) => row.nombre,
              Header: 'Nombre',
              id: 'nombre',
              Cell: ({ row }) => <DataGridRowSelect row={row} />
            },
            {
              accessorFn: (row: any) => row.direccion,
              Header: 'Dirección',
              id: 'direccion'
            },
            {
              accessorFn: (row: any) => row.telefono,
              Header: 'Teléfono',
              id: 'telefono'
            },
            {
              id: 'actions',
              Header: 'Acciones',
              enableSorting: false,
              cell: (row) => (
                <button
                  className="btn btn-sm btn-icon btn-icon-lg btn-clear btn-light"
                  onClick={() => {
                    navigate('/puerto-management-edit', {
                      state: { client_id: row.row.original.id }
                    });
                  }}
                >
                  <KeenIcon icon="notepad-edit" />
                </button>
              )
            }
          ]}
          data={users}
          rowSelection={false}
          pagination={{ size: 20 }}
          sorting={[{ id: 'nombre', desc: false }]}
          toolbar={<Toolbar searchInput={searchInput} setSearchInput={setSearchInput} />}
          layout={{ card: true }}
        />
      </Container>
    </Fragment>
  );
};

export { PuertoManagement };
