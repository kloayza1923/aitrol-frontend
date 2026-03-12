import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { aseguradoraSchema } from '@/validations/HealthValidation';

type Aseguradora = {
  id?: number;
  nombre: string;
  tipo?: string;
  codigo?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  sis_sucursal_id?: number;
};

export default function AseguradorasList() {
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 200 },
    { field: 'tipo', headerName: 'Tipo', flex: 1, minWidth: 120 },
    { field: 'codigo', headerName: 'Código', flex: 1, minWidth: 120 },
    { field: 'telefono', headerName: 'Teléfono', flex: 1, minWidth: 140 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 }
  ];

  return (
    <Container>
      <CrudDataGrid<Aseguradora>
        title="Aseguradoras"
        endpoint="/salud/aseguradoras"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          nombre: '',
          tipo: '',
          codigo: '',
          direccion: '',
          telefono: '',
          email: '',
          sis_sucursal_id: 0
        }}
        schema={aseguradoraSchema}
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
              label="Tipo"
              name="tipo"
              value={formValues.tipo ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.tipo)}
              helperText={errors?.tipo || ''}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Código"
              name="codigo"
              value={formValues.codigo ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Dirección"
              name="direccion"
              value={formValues.direccion ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              label="Teléfono"
              name="telefono"
              value={formValues.telefono ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Email"
              name="email"
              value={formValues.email ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Sucursal ID"
              name="sis_sucursal_id"
              type="number"
              value={formValues.sis_sucursal_id ?? 0}
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
