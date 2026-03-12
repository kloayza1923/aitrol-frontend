import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, Chip, Autocomplete } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { FetchData } from '@/utils/FetchData';
import * as Yup from 'yup';

type Unidad = {
  id: number;
  nombre: string;
  codigo?: string;
};

type Quirofano = {
  id?: number;
  unidad_id?: number;
  nombre?: string;
  codigo?: string;
  estado?: string;
  unidad?: Unidad;
};

const ESTADOS_QUIROFANO = ['Disponible', 'En Uso', 'Mantenimiento', 'Fuera de Servicio'];

const quirofanoSchema = Yup.object().shape({
  nombre: Yup.string(),
  codigo: Yup.string(),
  estado: Yup.string(),
  unidad_id: Yup.number()
});

export default function QuirofanosList() {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    setLoadingUnidades(true);
    try {
      const response = await FetchData<any>('/salud/unidades/unidades', 'GET');
      setUnidades(response.items || []);
    } catch (error) {
      console.error('Error cargando unidades:', error);
    } finally {
      setLoadingUnidades(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'success';
      case 'En Uso':
        return 'primary';
      case 'Mantenimiento':
        return 'warning';
      case 'Fuera de Servicio':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef<Quirofano>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'codigo', headerName: 'Código', flex: 0.8, minWidth: 120 },
    { field: 'nombre', headerName: 'Nombre', flex: 1.2, minWidth: 180 },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Quirofano>) =>
        params.value ? (
          <Chip label={params.value} size="small" color={getEstadoColor(params.value) as any} />
        ) : (
          ''
        )
    },
    {
      field: 'unidad',
      headerName: 'Unidad',
      flex: 1.2,
      minWidth: 180,
      valueGetter: (value, row) => row.unidad?.nombre || ''
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Quirofano>
        title="Quirófanos"
        endpoint="/salud/unidades/quirofanos"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          nombre: '',
          codigo: '',
          estado: 'Disponible',
          unidad_id: undefined
        }}
        schema={quirofanoSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => {
          const selectedUnidad = unidades.find((u) => u.id === formValues.unidad_id);

          return (
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
                label="Nombre del Quirófano"
                name="nombre"
                value={formValues.nombre ?? ''}
                onChange={handleChange}
                error={Boolean(errors?.nombre)}
                helperText={errors?.nombre}
                fullWidth
                margin="normal"
              />

              <Autocomplete
                options={ESTADOS_QUIROFANO}
                value={formValues.estado || null}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    estado: newValue || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Estado"
                    error={Boolean(errors?.estado)}
                    helperText={errors?.estado}
                    margin="normal"
                  />
                )}
                fullWidth
              />

              <Autocomplete
                options={unidades}
                loading={loadingUnidades}
                getOptionLabel={(option) =>
                  `${option.nombre}${option.codigo ? ` - ${option.codigo}` : ''}`
                }
                value={selectedUnidad || null}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    unidad_id: newValue?.id || undefined
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Unidad"
                    error={Boolean(errors?.unidad_id)}
                    helperText={errors?.unidad_id}
                    margin="normal"
                  />
                )}
                fullWidth
              />
            </>
          );
        }}
      />
    </Container>
  );
}
