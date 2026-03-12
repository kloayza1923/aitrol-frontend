import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, Autocomplete, Box, Typography } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { FetchData } from '@/utils/FetchData';
import * as Yup from 'yup';

type Sede = {
  id: number;
  nombre: string;
  codigo?: string;
};

type Piso = {
  id?: number;
  sede_id?: number;
  numero_piso?: number;
  nombre: string;
  descripcion?: string;
  sede?: Sede;
};

const pisoSchema = Yup.object().shape({
  nombre: Yup.string().required('El nombre es requerido'),
  numero_piso: Yup.number().min(0, 'El número de piso debe ser mayor o igual a 0'),
  descripcion: Yup.string(),
  sede_id: Yup.number()
});

export default function PisosList() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loadingSedes, setLoadingSedes] = useState(false);

  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    setLoadingSedes(true);
    try {
      const response = await FetchData<any>('/salud/sedes', 'GET');
      setSedes(response.items || []);
    } catch (error) {
      console.error('Error cargando sedes:', error);
    } finally {
      setLoadingSedes(false);
    }
  };

  const columns: GridColDef<Piso>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'numero_piso',
      headerName: 'N° Piso',
      width: 100,
      renderCell: (params: GridRenderCellParams<Piso>) => (
        <Box
          sx={{
            fontWeight: 'bold',
            color: params.value !== undefined ? 'primary.main' : 'text.secondary'
          }}
        >
          {params.value !== undefined ? params.value : '-'}
        </Box>
      )
    },
    { field: 'nombre', headerName: 'Nombre', flex: 1.5, minWidth: 200 },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 250 },
    {
      field: 'sede',
      headerName: 'Sede',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Piso>) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.row.sede?.nombre || 'N/A'}
          </Typography>
          {params.row.sede?.codigo && (
            <Typography variant="caption" color="text.secondary">
              {params.row.sede.codigo}
            </Typography>
          )}
        </Box>
      )
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Piso>
        title="Pisos"
        endpoint="/salud/pisos"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          nombre: '',
          numero_piso: 0,
          descripcion: '',
          sede_id: undefined
        }}
        schema={pisoSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => {
          const selectedSede = sedes.find((s) => s.id === formValues.sede_id);

          return (
            <>
              <Autocomplete
                options={sedes}
                loading={loadingSedes}
                getOptionLabel={(option) =>
                  `${option.nombre}${option.codigo ? ` - ${option.codigo}` : ''}`
                }
                value={selectedSede || null}
                onChange={(_, newValue) => {
                  setFormValues((prev: any) => ({
                    ...prev,
                    sede_id: newValue?.id || undefined
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sede"
                    error={Boolean(errors?.sede_id)}
                    helperText={errors?.sede_id || 'Selecciona la sede donde se encuentra el piso'}
                    margin="normal"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2">{option.nombre}</Typography>
                      {option.codigo && (
                        <Typography variant="caption" color="text.secondary">
                          {option.codigo}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
                fullWidth
              />

              <TextField
                label="Número de Piso"
                name="numero_piso"
                type="number"
                value={formValues.numero_piso ?? 0}
                onChange={handleChange}
                error={Boolean(errors?.numero_piso)}
                helperText={errors?.numero_piso || 'Ej: 0 (Planta Baja), 1, 2, 3... o -1 (Sótano)'}
                fullWidth
                margin="normal"
                inputProps={{ step: 1 }}
              />

              <TextField
                label="Nombre del Piso"
                name="nombre"
                value={formValues.nombre ?? ''}
                onChange={handleChange}
                error={Boolean(errors?.nombre)}
                helperText={errors?.nombre || 'Ej: Planta Baja, Primer Piso, Emergencias'}
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
                placeholder="Describe las características o servicios disponibles en este piso"
              />
            </>
          );
        }}
      />
    </Container>
  );
}
