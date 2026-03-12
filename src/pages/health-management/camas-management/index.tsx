import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, Chip, Autocomplete } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { FetchData } from '@/utils/FetchData';
import * as Yup from 'yup';

type Sala = {
  id: number;
  nombre: string;
  tipo?: string;
};

type Cama = {
  id?: number;
  sala_id?: number;
  codigo: string;
  tipo_cama?: string;
  estado?: string;
  sala?: Sala;
};

const TIPOS_CAMA = [
  'Simple',
  'Eléctrica',
  'UCI',
  'Pediátrica',
  'Neonatal',
  'Obstétrica',
  'Camilla',
  'Otro'
];

const ESTADOS_CAMA = ['Disponible', 'Ocupada', 'Mantenimiento', 'Limpieza', 'Fuera de Servicio'];

const camaSchema = Yup.object().shape({
  codigo: Yup.string().required('El código es requerido'),
  tipo_cama: Yup.string(),
  estado: Yup.string(),
  sala_id: Yup.number()
});

export default function CamasList() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loadingSalas, setLoadingSalas] = useState(false);

  useEffect(() => {
    loadSalas();
  }, []);

  const loadSalas = async () => {
    setLoadingSalas(true);
    try {
      const response = await FetchData<any>('/salud/unidades/salas', 'GET');
      setSalas(response.items || []);
    } catch (error) {
      console.error('Error cargando salas:', error);
    } finally {
      setLoadingSalas(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'success';
      case 'Ocupada':
        return 'error';
      case 'Mantenimiento':
        return 'warning';
      case 'Limpieza':
        return 'info';
      case 'Fuera de Servicio':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: GridColDef<Cama>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'codigo', headerName: 'Código', flex: 1, minWidth: 130 },
    {
      field: 'tipo_cama',
      headerName: 'Tipo',
      flex: 1,
      minWidth: 130,
      renderCell: (params: GridRenderCellParams<Cama>) =>
        params.value ? <Chip label={params.value} size="small" color="primary" /> : ''
    },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Cama>) =>
        params.value ? (
          <Chip label={params.value} size="small" color={getEstadoColor(params.value) as any} />
        ) : (
          ''
        )
    },
    {
      field: 'sala',
      headerName: 'Sala',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (value, row) => row.sala?.nombre || ''
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Cama>
        title="Camas"
        endpoint="/salud/unidades/camas"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          codigo: '',
          tipo_cama: 'Simple',
          estado: 'Disponible',
          sala_id: undefined
        }}
        schema={camaSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => {
          const selectedSala = salas.find((s) => s.id === formValues.sala_id);

          return (
            <>
              <TextField
                label="Código de Cama"
                name="codigo"
                value={formValues.codigo ?? ''}
                onChange={handleChange}
                error={Boolean(errors?.codigo)}
                helperText={errors?.codigo || 'Ejemplo: C-101, CAMA-A1'}
                fullWidth
                margin="normal"
                required
              />

              <Autocomplete
                options={TIPOS_CAMA}
                value={formValues.tipo_cama || null}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    tipo_cama: newValue || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tipo de Cama"
                    error={Boolean(errors?.tipo_cama)}
                    helperText={errors?.tipo_cama}
                    margin="normal"
                  />
                )}
                freeSolo
                fullWidth
              />

              <Autocomplete
                options={ESTADOS_CAMA}
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
                options={salas}
                loading={loadingSalas}
                getOptionLabel={(option) =>
                  `${option.nombre}${option.tipo ? ` - ${option.tipo}` : ''}`
                }
                value={selectedSala || null}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    sala_id: newValue?.id || undefined
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sala"
                    error={Boolean(errors?.sala_id)}
                    helperText={errors?.sala_id}
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
