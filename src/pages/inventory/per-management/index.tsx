import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { FetchData } from '@/utils/FetchData';
import { TextField, Switch, FormControlLabel, MenuItem } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { perchaSchema } from '@/validations/InventoryValidation';
type Almacen = {
  id?: number;
  nombre: string;
  ubicacion?: string;
  estado: number;
};
type Percha = {
  id?: number;
  nombre: string;
  descripcion?: string;
  estado: number;
  almacen_id?: number;
  codigo?: string;
};

export default function PerchaList() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const fetchAlmacenes = async () => {
    try {
      const response = await FetchData('/inv/almacenes');
      setAlmacenes(response);
    } catch (error) {
      console.error('Error fetching almacenes:', error);
    }
  };
  useEffect(() => {
    fetchAlmacenes();
  }, []);

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 150 },
    { field: 'almacen_nombre', headerName: 'Almacén', flex: 1, minWidth: 150 },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 200 },
    { field: 'estado', headerName: 'Activo', flex: 0.5, minWidth: 100, type: 'number' }
  ];

  return (
    <Container>
      <CrudDataGrid<Percha>
        title="Perchas"
        endpoint="/inv/perchas"
        mode="crud"
        columns={columns}
        schema={perchaSchema}
        defaultFormValues={{
          nombre: '',
          descripcion: '',
          estado: 1,
          almacen_id: undefined,
          codigo: ''
        }}
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
              label="Código"
              name="codigo"
              value={formValues.codigo}
              onChange={handleChange}
              fullWidth
              error={Boolean(errors?.codigo)}
              helperText={errors?.codigo || ''}
              margin="normal"
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={formValues.descripcion}
              onChange={handleChange}
              fullWidth
              error={Boolean(errors?.descripcion)}
              helperText={errors?.descripcion || ''}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              label="Almacén"
              name="almacen_id"
              value={formValues.almacen_id !== undefined ? formValues.almacen_id.toString() : ''}
              onChange={(e) =>
                setFormValues({
                  ...formValues,
                  almacen_id: Number(e.target.value)
                })
              }
              error={Boolean(errors?.almacen_id)}
              helperText={errors?.almacen_id || ''}
              fullWidth
              margin="normal"
              select
            >
              {almacenes.map((almacen) => (
                <MenuItem key={almacen.id} value={almacen.id}>
                  {almacen.nombre}
                </MenuItem>
              ))}
            </TextField>
            {/*  <FormControlLabel
              control={
                <Switch
                  checked={formValues.estado}
                  onChange={(e) =>
                    handleChange({ target: { name: 'estado', value: e.target.checked } })
                  }
                  color="primary"
                />
              }
              label="Activo"
            />
          </> */}
          </>
        )}
      />
    </Container>
  );
}
