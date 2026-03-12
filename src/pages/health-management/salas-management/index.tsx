import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, Chip, MenuItem, Autocomplete } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { FetchData } from '@/utils/FetchData';
import * as Yup from 'yup';

type Unidad = {
  id: number;
  nombre: string;
  codigo?: string;
};

type Sala = {
  id?: number;
  unidad_id?: number;
  nombre: string;
  tipo?: string;
  capacidad?: number;
  unidad?: Unidad;
};

const TIPOS_SALA = [
  'Cirugía',
  'Emergencia',
  'Hospitalización',
  'Consulta Externa',
  'UCI',
  'Neonatología',
  'Pediatría',
  'Maternidad',
  'Observación',
  'Otro'
];

const salaSchema = Yup.object().shape({
  nombre: Yup.string().required('El nombre es requerido'),
  tipo: Yup.string(),
  capacidad: Yup.number().min(1, 'La capacidad debe ser al menos 1'),
  unidad_id: Yup.number()
});

export default function SalasList() {
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

  const columns: GridColDef<Sala>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'nombre', headerName: 'Nombre Sala', flex: 1.5, minWidth: 200 },
    {
      field: 'tipo',
      headerName: 'Tipo',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Sala>) =>
        params.value ? <Chip label={params.value} size="small" color="primary" /> : ''
    },
    { field: 'capacidad', headerName: 'Capacidad', width: 120 },
    {
      field: 'unidad',
      headerName: 'Unidad',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row.unidad?.nombre || ''
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Sala>
        title="Salas"
        endpoint="/salud/unidades/salas"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          nombre: '',
          tipo: '',
          capacidad: 1,
          unidad_id: undefined
        }}
        schema={salaSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => {
          const selectedUnidad = unidades.find((u) => u.id === formValues.unidad_id);

          return (
            <>
              <TextField
                label="Nombre de la Sala"
                name="nombre"
                value={formValues.nombre ?? ''}
                onChange={handleChange}
                error={Boolean(errors?.nombre)}
                helperText={errors?.nombre}
                fullWidth
                margin="normal"
                required
              />

              <Autocomplete
                options={TIPOS_SALA}
                value={formValues.tipo || null}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    tipo: newValue || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tipo de Sala"
                    error={Boolean(errors?.tipo)}
                    helperText={errors?.tipo}
                    margin="normal"
                  />
                )}
                freeSolo
                fullWidth
              />

              <TextField
                label="Capacidad"
                name="capacidad"
                type="number"
                value={formValues.capacidad ?? 1}
                onChange={handleChange}
                error={Boolean(errors?.capacidad)}
                helperText={errors?.capacidad}
                fullWidth
                margin="normal"
                inputProps={{ min: 1 }}
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
