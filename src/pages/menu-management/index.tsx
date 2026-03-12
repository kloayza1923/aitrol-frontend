import { Container } from '@/components/container';
import { useNavigate } from 'react-router-dom';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { useTabNavigate } from '@/hooks';
import { GridColDef } from '@mui/x-data-grid';
import { Button, Box } from '@mui/material';
import { Sort } from '@mui/icons-material';

const MenuList = () => {
  const navigate = useNavigate();
  const { navigateToTab } = useTabNavigate();

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Título', flex: 1 },
    { field: 'icon', headerName: 'Icono', flex: 0.8 },
    { field: 'path', headerName: 'Ruta', flex: 1 },
    { field: 'heading', headerName: 'Encabezado', flex: 1 },
    { field: 'parent_name', headerName: 'Padre', flex: 1 },
    {
      field: 'orden',
      headerName: 'Orden',
      flex: 0.5,
      type: 'number'
    },
    {
      field: 'parent_menu_id',
      headerName: 'Padre',
      flex: 0.6,
      valueGetter: (params) => params?.row?.parent_menu_id ?? '—'
    }
  ];

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Sort />}
          onClick={() => navigateToTab('/menu-management/order', { enableTabs: false })}
        >
          Ordenar Menús
        </Button>
      </Box>
      <CrudDataGrid
        title="Menú del Sistema"
        endpoint="/menu"
        mode="redirect"
        columns={columns}
        onCreateClick={() => navigateToTab('/menu-management/create', { enableTabs: false })}
        onEditClick={(row) =>
          navigateToTab(`/menu-management/edit/${row.id}`, {
            customTitle: 'Editar Menú',
            enableTabs: false
          })
        }
      />
    </Container>
  );
};

export default MenuList;
