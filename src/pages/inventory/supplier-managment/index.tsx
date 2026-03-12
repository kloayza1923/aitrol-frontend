import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { supplierSchema } from '@/validations/InventoryValidation';
type Proveedor = {
  id?: number;
  razon_social: string;
  nombre_contacto: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
};

export default function ProveedoresList() {
  const columns: GridColDef[] = [
    { field: 'razon_social', headerName: 'Razón Social', flex: 1, minWidth: 150 },
    { field: 'nombre_contacto', headerName: 'Nombre de Contacto', flex: 1, minWidth: 150 },
    { field: 'ruc', headerName: 'RUC', flex: 1, minWidth: 150 },
    { field: 'direccion', headerName: 'Dirección', flex: 2, minWidth: 200 },
    { field: 'telefono', headerName: 'Teléfono', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 150 }
  ];

  return (
    <Container>
      <CrudDataGrid<Proveedor>
        title="Proveedores"
        endpoint="/inv/proveedores"
        mode="crud"
        columns={columns}
        schema={supplierSchema}
        defaultFormValues={{
          razon_social: '',
          nombre_contacto: '',
          ruc: '',
          direccion: '',
          telefono: '',
          email: ''
        }}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Razón Social"
              name="razon_social"
              value={formValues.razon_social}
              onChange={handleChange}
              error={Boolean(errors?.razon_social)}
              helperText={errors?.razon_social || ''}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Nombre de Contacto"
              name="nombre_contacto"
              value={formValues.nombre_contacto}
              onChange={handleChange}
              error={Boolean(errors?.nombre_contacto)}
              helperText={errors?.nombre_contacto || ''}
              fullWidth
              margin="normal"
            />
            <TextField
              label="RUC"
              name="ruc"
              value={formValues.ruc}
              onChange={handleChange}
              fullWidth
              error={Boolean(errors?.ruc)}
              helperText={errors?.ruc || ''}
              margin="normal"
            />
            <TextField
              label="Dirección"
              name="direccion"
              value={formValues.direccion}
              onChange={handleChange}
              error={Boolean(errors?.direccion)}
              helperText={errors?.direccion || ''}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Teléfono"
              name="telefono"
              value={formValues.telefono}
              onChange={handleChange}
              error={Boolean(errors?.telefono)}
              helperText={errors?.telefono || ''}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Email"
              name="email"
              value={formValues.email}
              error={Boolean(errors?.email)}
              helperText={errors?.email || ''}
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
