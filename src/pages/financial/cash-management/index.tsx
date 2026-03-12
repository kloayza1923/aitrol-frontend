import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

type Caja = {
  id?: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
};

export default function CajasList() {
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 150 },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 200 }
  ];

  return (
    <Container>
      <CrudDataGrid<Caja>
        title="Cajas"
        endpoint="/caja"
        mode="crud"
        columns={columns}
        defaultFormValues={{ nombre: '', descripcion: '', estado: true }}
        renderForm={(formValues, handleChange) => (
          <>
            <TextField
              label="Nombre"
              name="nombre"
              value={formValues.nombre}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={formValues.descripcion}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
          </>
        )}
      />
    </Container>
  );
}
