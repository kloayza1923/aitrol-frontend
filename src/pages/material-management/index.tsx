import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { useTabNavigate } from '@/hooks';

// Componente principal usando CrudDataGrid
const MaterialesManagement = () => {
  const navigate = useNavigate();
  const { navigateToTab } = useTabNavigate();

  return (
    <Fragment>
      <Container>
        <CrudDataGrid
          title="Materiales"
          columns={[
            { field: 'id', headerName: 'ID', width: 80 },
            { field: 'nombre', headerName: 'Nombre', flex: 1 }
          ]}
          mode="redirect"
          endpoint="/materiales"
          onEditClick={(row) =>
            navigateToTab(`/materiales-management-edit/${row.id}`, {
              customTitle: 'Editar Material'
            })
          }
          onCreateClick={() => navigate('/materiales-management-add')}
        />
      </Container>
    </Fragment>
  );
};

export { MaterialesManagement };
