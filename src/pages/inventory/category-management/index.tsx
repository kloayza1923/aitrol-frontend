import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { categorySchema } from '@/validations/InventoryValidation';
type Category = {
  id?: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
};

export default function CategoriasList() {
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 150 },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 200 }
  ];

  return (
    <Container>
      <CrudDataGrid<Category>
        title="Categorías"
        endpoint="/inv/categorias"
        mode="crud"
        columns={columns}
        schema={categorySchema}
        defaultFormValues={{ nombre: '', descripcion: '', estado: true }}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Nombre"
              name="nombre"
              value={formValues.nombre}
              onChange={handleChange}
              fullWidth
              error={Boolean(errors?.nombre)}
              helperText={errors?.nombre || ''}
              margin="normal"
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={formValues.descripcion}
              onChange={handleChange}
              error={Boolean(errors?.descripcion)}
              helperText={errors?.descripcion || ''}
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
