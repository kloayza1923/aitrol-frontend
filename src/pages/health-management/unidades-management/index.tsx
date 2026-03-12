import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { FetchData } from '@/utils/FetchData';
import { TextField, MenuItem, Autocomplete } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import React from 'react';
import * as Yup from 'yup';

type Unidad = {
  id?: number;
  piso_id?: number;
  nombre: string;
  codigo?: string;
  descripcion?: string;
};

const unidadSchema = Yup.object().shape({
  nombre: Yup.string().required('El nombre es requerido'),
  codigo: Yup.string(),
  descripcion: Yup.string(),
  piso_id: Yup.number()
});

export default function UnidadesList() {
  const [loadingPisos, setLoadingPisos] = React.useState(false);
  const [pisos, setPisos] = React.useState<any[]>([]);
  const columns: GridColDef<Unidad>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'codigo', headerName: 'Código', flex: 0.8, minWidth: 100 },
    { field: 'nombre', headerName: 'Nombre', flex: 1.5, minWidth: 200 },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 250 },
    { field: 'piso_id', headerName: 'Piso ID', width: 100 }
  ];

  const get_piso_options = async () => {
    const response = await FetchData<any>('/salud/pisos', 'GET');
    setPisos(response.items || []);
  };
  React.useEffect(() => {
    get_piso_options();
  }, []);

  return (
    <Container>
      <CrudDataGrid<Unidad>
        title="Unidades"
        endpoint="/salud/unidades/unidades"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          nombre: '',
          codigo: '',
          descripcion: '',
          piso_id: undefined
        }}
        schema={unidadSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Código"
              name="codigo"
              value={formValues.codigo ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.codigo)}
              helperText={errors?.codigo}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Nombre"
              name="nombre"
              value={formValues.nombre ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.nombre)}
              helperText={errors?.nombre}
              fullWidth
              margin="normal"
              required
            />

            <TextField
              label="Descripción"
              name="descripcion"
              value={formValues.descripcion ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.descripcion)}
              helperText={errors?.descripcion}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />

            {/*  <TextField
              label="Piso ID"
              name="piso_id"
              type="number"
              value={formValues.piso_id ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.piso_id)}
              helperText={errors?.piso_id}
              fullWidth
              margin="normal"
            /> */}
            <Autocomplete
              options={pisos}
              loading={loadingPisos}
              getOptionLabel={(option) =>
                `${option.nombre}${option.codigo ? ` - ${option.codigo}` : ''}`
              }
              value={pisos.find((p) => p.id === formValues.piso_id) || null}
              onChange={(_, newValue) => {
                setFormValues((prev: any) => ({
                  ...prev,
                  piso_id: newValue?.id || undefined
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Piso"
                  error={Boolean(errors?.piso_id)}
                  helperText={errors?.piso_id || 'Selecciona el piso donde se encuentra la unidad'}
                  margin="normal"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <div>
                    <div>{option.nombre}</div>
                    {option.codigo && (
                      <div style={{ fontSize: '0.8em', color: '#666' }}>{option.codigo}</div>
                    )}
                  </div>
                </li>
              )}
              fullWidth
            />
          </>
        )}
      />
    </Container>
  );
}
