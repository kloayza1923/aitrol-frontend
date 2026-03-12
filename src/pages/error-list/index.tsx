import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

type ErrorLog = {
  id?: number;
  endpoint: string;
  metodo: string;
  error_mensaje: string;
  error_detalle: string;
};

export default function ErrorList() {
  const columns: GridColDef[] = [
    { field: 'endpoint', headerName: 'Endpoint', flex: 1, minWidth: 150 },
    { field: 'metodo', headerName: 'Método', flex: 1, minWidth: 150 },
    { field: 'error_mensaje', headerName: 'Error Mensaje', flex: 2, minWidth: 200 },
    { field: 'error_detalle', headerName: 'Error Detalle', flex: 2, minWidth: 200 },
    { field: 'fecha', headerName: 'Fecha', flex: 1, minWidth: 150 }
  ];

  return (
    <Container>
      <CrudDataGrid<ErrorLog>
        title="Errores"
        endpoint="/logs"
        mode="table"
        showEdit={false}
        columns={columns}
        defaultFormValues={{
          endpoint: '',
          metodo: '',
          error_mensaje: '',
          error_detalle: '',
          fecha: ''
        }}
      />
    </Container>
  );
}
