import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, MenuItem, Select, FormControl, InputLabel, Box, Grid } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import * as yup from 'yup';

type UbicacionActivo = {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  id_sucursal: number | '';
  estado: string;
};

const ubicacionSchema = yup.object().shape({
  codigo: yup.string().required('El código es requerido'),
  nombre: yup.string().required('El nombre es requerido')
});

const UbicacionesActivosManagement = () => {
  const columns: GridColDef[] = [
    { field: 'codigo', headerName: 'Código', flex: 1, minWidth: 100 },
    { field: 'nombre', headerName: 'Nombre', flex: 2, minWidth: 200 },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 250 },
    { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 100 }
  ];

  return (
    <Container>
      <CrudDataGrid<UbicacionActivo>
        title="Ubicaciones de Activos Fijos"
        endpoint="/fin/ubicaciones-activos"
        mode="crud"
        schema={ubicacionSchema}
        columns={columns}
        defaultFormValues={{
          codigo: '',
          nombre: '',
          descripcion: '',
          id_sucursal: '',
          estado: 'ACTIVO'
        }}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Código"
                  name="codigo"
                  value={formValues.codigo}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(errors?.codigo)}
                  helperText={errors?.codigo}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={formValues.nombre}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(errors?.nombre)}
                  helperText={errors?.nombre}
                />
              </Grid>
              <Grid item xs={12}>
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
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={formValues.estado}
                    onChange={handleChange}
                    label="Estado"
                  >
                    <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                    <MenuItem value="INACTIVO">INACTIVO</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </>
        )}
      />
    </Container>
  );
};

export default UbicacionesActivosManagement;
