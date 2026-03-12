import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, FormControlLabel, Switch } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { brandSchema } from '@/validations/InventoryValidation';

type Marcas = {
  id?: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
};

export default function MarcasList() {
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 150 },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 200 }
  ];

  return (
    <Container>
      <CrudDataGrid<Marcas>
        title="Marcas"
        endpoint="/inv/marcas"
        mode="crud"
        columns={columns}
        defaultFormValues={{ nombre: '', descripcion: '', estado: true }}
        schema={brandSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Nombre"
              name="nombre"
              value={formValues.nombre ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.nombre)}
              helperText={errors?.nombre || ''}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={formValues.descripcion ?? ''}
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
