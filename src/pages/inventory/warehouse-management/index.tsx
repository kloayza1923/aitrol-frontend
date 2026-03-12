import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, Switch, FormControlLabel } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { warehouseSchema } from '@/validations/InventoryValidation';
type Almacen = {
  id?: number;
  nombre: string;
  ubicacion?: string;
  estado: boolean;
};

export default function WarehouseList() {
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 150 },
    { field: 'ubicacion', headerName: 'Ubicación', flex: 2, minWidth: 200 },
    { field: 'estado', headerName: 'Activo', flex: 0.5, minWidth: 100, type: 'boolean' }
  ];

  return (
    <Container>
      <CrudDataGrid<Almacen>
        title="Almacenes"
        endpoint="/inv/almacenes"
        mode="crud"
        columns={columns}
        schema={warehouseSchema}
        defaultFormValues={{ nombre: '', ubicacion: '', estado: 1 }}
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
              label="Ubicación"
              name="ubicacion"
              error={Boolean(errors?.ubicacion)}
              helperText={errors?.ubicacion || ''}
              value={formValues.ubicacion}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </>
        )}
      />
    </Container>
  );
}
