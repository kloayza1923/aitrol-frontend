import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, MenuItem, Select, FormControl, InputLabel, Box, Grid } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import * as yup from 'yup';

type CategoriaActivo = {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  vida_util_anos: number | '';
  porcentaje_depreciacion: number | '';
  id_cuenta_activo: number | '';
  id_cuenta_depreciacion: number | '';
  id_cuenta_gasto_depreciacion: number | '';
  estado: string;
};

const categoriaSchema = yup.object().shape({
  codigo: yup.string().required('El código es requerido'),
  nombre: yup.string().required('El nombre es requerido'),
  vida_util_anos: yup.number().required('La vida útil es requerida').positive().integer(),
  porcentaje_depreciacion: yup.number().required('El porcentaje es requerido').min(0).max(100)
});

const CategoriasActivosManagement = () => {
  const [cuentas, setCuentas] = useState<{ id: number; nombre: string; codigo: string }[]>([]);

  const getCuentas = async () => {
    const data = await FetchData('/contabilidad/plan_cuentas', 'GET', {});
    if (!data.detail && data.data) setCuentas(data.data);
  };

  useEffect(() => {
    getCuentas();
  }, []);

  const columns: GridColDef[] = [
    { field: 'codigo', headerName: 'Código', flex: 1, minWidth: 100 },
    { field: 'nombre', headerName: 'Nombre', flex: 2, minWidth: 200 },
    { field: 'vida_util_anos', headerName: 'Vida Útil (años)', flex: 1, minWidth: 120 },
    {
      field: 'porcentaje_depreciacion',
      headerName: '% Depreciación',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => `${params.value}%`
    },
    { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 100 }
  ];

  return (
    <Container>
      <CrudDataGrid<CategoriaActivo>
        title="Categorías de Activos Fijos"
        endpoint="/fin/categorias-activos"
        mode="crud"
        schema={categoriaSchema}
        columns={columns}
        defaultFormValues={{
          codigo: '',
          nombre: '',
          descripcion: '',
          vida_util_anos: '',
          porcentaje_depreciacion: '',
          id_cuenta_activo: '',
          id_cuenta_depreciacion: '',
          id_cuenta_gasto_depreciacion: '',
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
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vida Útil (años)"
                  name="vida_util_anos"
                  type="number"
                  value={formValues.vida_util_anos}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(errors?.vida_util_anos)}
                  helperText={errors?.vida_util_anos}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Porcentaje Depreciación Anual (%)"
                  name="porcentaje_depreciacion"
                  type="number"
                  value={formValues.porcentaje_depreciacion}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(errors?.porcentaje_depreciacion)}
                  helperText={errors?.porcentaje_depreciacion}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Cuenta de Activo</InputLabel>
                  <Select
                    name="id_cuenta_activo"
                    value={formValues.id_cuenta_activo}
                    onChange={handleChange}
                    label="Cuenta de Activo"
                  >
                    <MenuItem value="">Seleccione una cuenta</MenuItem>
                    {cuentas.map((cuenta) => (
                      <MenuItem key={cuenta.id} value={cuenta.id}>
                        {cuenta.codigo} - {cuenta.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Cuenta de Depreciación Acumulada</InputLabel>
                  <Select
                    name="id_cuenta_depreciacion"
                    value={formValues.id_cuenta_depreciacion}
                    onChange={handleChange}
                    label="Cuenta de Depreciación Acumulada"
                  >
                    <MenuItem value="">Seleccione una cuenta</MenuItem>
                    {cuentas.map((cuenta) => (
                      <MenuItem key={cuenta.id} value={cuenta.id}>
                        {cuenta.codigo} - {cuenta.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Cuenta de Gasto por Depreciación</InputLabel>
                  <Select
                    name="id_cuenta_gasto_depreciacion"
                    value={formValues.id_cuenta_gasto_depreciacion}
                    onChange={handleChange}
                    label="Cuenta de Gasto por Depreciación"
                  >
                    <MenuItem value="">Seleccione una cuenta</MenuItem>
                    {cuentas.map((cuenta) => (
                      <MenuItem key={cuenta.id} value={cuenta.id}>
                        {cuenta.codigo} - {cuenta.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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

export default CategoriasActivosManagement;
