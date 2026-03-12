import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Grid,
  Chip
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import * as yup from 'yup';

type ActivoFijo = {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  id_categoria: number | '';
  id_ubicacion: number | '';
  fecha_compra: string;
  valor_compra: number | '';
  valor_residual: number | '';
  vida_util_anos: number | '';
  metodo_depreciacion: string;
  serie: string;
  modelo: string;
  marca: string;
  proveedor: string;
  responsable: string;
  estado: string;
};

const activoSchema = yup.object().shape({
  codigo: yup.string().required('El código es requerido'),
  nombre: yup.string().required('El nombre es requerido'),
  id_categoria: yup.number().required('La categoría es requerida'),
  fecha_compra: yup.string().required('La fecha de compra es requerida'),
  valor_compra: yup.number().required('El valor de compra es requerido').positive(),
  vida_util_anos: yup.number().required('La vida útil es requerida').positive().integer()
});

const ActivosFijosManagement = () => {
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [ubicaciones, setUbicaciones] = useState<{ id: number; nombre: string }[]>([]);

  const getData = async () => {
    const [catData, ubiData] = await Promise.all([
      FetchData('/fin/categorias-activos', 'GET', {}),
      FetchData('/fin/ubicaciones-activos', 'GET', {})
    ]);

    if (!catData.detail && catData.data) setCategorias(catData.data);
    if (!ubiData.detail && ubiData.data) setUbicaciones(ubiData.data);
  };

  useEffect(() => {
    getData();
  }, []);

  const columns: GridColDef[] = [
    { field: 'codigo', headerName: 'Código', flex: 1, minWidth: 100 },
    { field: 'nombre', headerName: 'Nombre', flex: 2, minWidth: 200 },
    { field: 'categoria_nombre', headerName: 'Categoría', flex: 1.5, minWidth: 150 },
    { field: 'ubicacion_nombre', headerName: 'Ubicación', flex: 1.5, minWidth: 150 },
    {
      field: 'fecha_compra',
      headerName: 'Fecha Compra',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'valor_compra',
      headerName: 'Valor Compra',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => `$${Number(params.value).toFixed(2)}`
    },
    {
      field: 'valor_libro',
      headerName: 'Valor Libro',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => `$${Number(params.value).toFixed(2)}`
    },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
          ACTIVO: 'success',
          INACTIVO: 'default',
          VENDIDO: 'warning',
          DADO_BAJA: 'error',
          EN_REPARACION: 'warning'
        };
        return <Chip label={params.value} color={colors[params.value] || 'default'} size="small" />;
      }
    }
  ];

  return (
    <Container>
      <CrudDataGrid<ActivoFijo>
        title="Activos Fijos"
        endpoint="/fin/activos-fijos"
        mode="crud"
        schema={activoSchema}
        columns={columns}
        defaultFormValues={{
          codigo: '',
          nombre: '',
          descripcion: '',
          id_categoria: '',
          id_ubicacion: '',
          fecha_compra: new Date().toISOString().split('T')[0],
          valor_compra: '',
          valor_residual: 0,
          vida_util_anos: '',
          metodo_depreciacion: 'LINEAL',
          serie: '',
          modelo: '',
          marca: '',
          proveedor: '',
          responsable: '',
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
                <FormControl fullWidth margin="normal" error={Boolean(errors?.id_categoria)}>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    name="id_categoria"
                    value={formValues.id_categoria}
                    onChange={handleChange}
                    label="Categoría"
                  >
                    <MenuItem value="">Seleccione una categoría</MenuItem>
                    {categorias.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Ubicación</InputLabel>
                  <Select
                    name="id_ubicacion"
                    value={formValues.id_ubicacion}
                    onChange={handleChange}
                    label="Ubicación"
                  >
                    <MenuItem value="">Seleccione una ubicación</MenuItem>
                    {ubicaciones.map((ubi) => (
                      <MenuItem key={ubi.id} value={ubi.id}>
                        {ubi.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Compra"
                  name="fecha_compra"
                  type="date"
                  value={formValues.fecha_compra}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(errors?.fecha_compra)}
                  helperText={errors?.fecha_compra}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Valor de Compra"
                  name="valor_compra"
                  type="number"
                  value={formValues.valor_compra}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(errors?.valor_compra)}
                  helperText={errors?.valor_compra}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Valor Residual"
                  name="valor_residual"
                  type="number"
                  value={formValues.valor_residual}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
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
                <FormControl fullWidth margin="normal">
                  <InputLabel>Método de Depreciación</InputLabel>
                  <Select
                    name="metodo_depreciacion"
                    value={formValues.metodo_depreciacion}
                    onChange={handleChange}
                    label="Método de Depreciación"
                  >
                    <MenuItem value="LINEAL">Línea Recta</MenuItem>
                    <MenuItem value="ACELERADA">Acelerada</MenuItem>
                    <MenuItem value="SUMA_DIGITOS">Suma de Dígitos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Serie"
                  name="serie"
                  value={formValues.serie}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Modelo"
                  name="modelo"
                  value={formValues.modelo}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Marca"
                  name="marca"
                  value={formValues.marca}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Proveedor"
                  name="proveedor"
                  value={formValues.proveedor}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Responsable"
                  name="responsable"
                  value={formValues.responsable}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
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
                    <MenuItem value="EN_REPARACION">EN REPARACIÓN</MenuItem>
                    <MenuItem value="VENDIDO">VENDIDO</MenuItem>
                    <MenuItem value="DADO_BAJA">DADO DE BAJA</MenuItem>
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

export default ActivosFijosManagement;
