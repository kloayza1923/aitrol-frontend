import { Container } from '@/components/container';
import { useNavigate } from 'react-router-dom';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { GridColDef } from '@mui/x-data-grid';
import { useTabNavigate } from '@/hooks';

const RolesPagoList = () => {
  const navigate = useNavigate();
  const { navigateToTab } = useTabNavigate();

  const columns: GridColDef[] = [
    { field: 'tipo_rol', headerName: 'Tipo Rol', flex: 1 },
    { field: 'fecha_generacion', headerName: 'Fecha Generación', flex: 1 },
    { field: 'mes_correspondiente', headerName: 'Mes', flex: 0.5 },
    { field: 'anio_correspondiente', headerName: 'Año', flex: 0.5 },
    { field: 'estado', headerName: 'Estado', flex: 0.7 },
    { field: 'total', headerName: 'Total', flex: 0.7 }
  ];

  return (
    <Container>
      <CrudDataGrid
        title="Roles de Pago"
        endpoint="/rrhh/roles_pago"
        mode="redirect"
        columns={columns}
        numericFields={[{ field: 'total', type: 'line' }]}
        onCreateClick={() => navigate('/rhrol-management/create')}
        onEditClick={(row) =>
          navigateToTab(`/rhrol-management/edit/${row.id}`, { customTitle: 'Editar Rol de Pago' })
        }
        showDelete={false} // No eliminamos roles
      />
    </Container>
  );
};

export default RolesPagoList;
