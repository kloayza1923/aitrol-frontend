import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { cie10Schema } from '@/validations/HealthValidation';

type Cie10 = {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  capitulo?: string;
  tipo?: string;
  estado?: string;
  sis_sucursal_id?: number;
};

const TIPOS_DIAGNOSTICO = ['Principal', 'Secundario', 'Comorbilidad', 'Complicación'];

const ESTADOS = ['Activo', 'Inactivo'];

const CATEGORIAS_CIE10 = [
  'Enfermedades infecciosas y parasitarias',
  'Neoplasias',
  'Enfermedades de la sangre',
  'Enfermedades endocrinas y metabólicas',
  'Trastornos mentales',
  'Enfermedades del sistema nervioso',
  'Enfermedades del ojo',
  'Enfermedades del oído',
  'Enfermedades del sistema circulatorio',
  'Enfermedades del sistema respiratorio',
  'Enfermedades del sistema digestivo',
  'Enfermedades de la piel',
  'Enfermedades del sistema musculoesquelético',
  'Enfermedades del sistema genitourinario',
  'Embarazo, parto y puerperio',
  'Afecciones perinatales',
  'Malformaciones congénitas',
  'Síntomas y signos no clasificados',
  'Traumatismos y envenenamientos',
  'Causas externas',
  'Factores que influyen en el estado de salud'
];

export default function Cie10List() {
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Principal':
        return 'primary';
      case 'Secundario':
        return 'info';
      case 'Comorbilidad':
        return 'warning';
      case 'Complicación':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef<Cie10>[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'codigo', headerName: 'Código CIE-10', width: 130, minWidth: 110 },
    { field: 'nombre', headerName: 'Nombre / Diagnóstico', flex: 2, minWidth: 220 },
    { field: 'categoria', headerName: 'Categoría', flex: 1.2, minWidth: 150 },
    { field: 'capitulo', headerName: 'Capítulo', flex: 1, minWidth: 120 },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 140,
      renderCell: (params: GridRenderCellParams<Cie10>) =>
        params.value ? (
          <Chip label={params.value} size="small" color={getTipoColor(params.value) as any} />
        ) : (
          ''
        )
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 110,
      renderCell: (params: GridRenderCellParams<Cie10>) =>
        params.value ? (
          <Chip
            label={params.value}
            size="small"
            color={params.value === 'Activo' ? 'success' : 'default'}
          />
        ) : (
          ''
        )
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Cie10>
        title="Diagnósticos CIE-10"
        endpoint="/salud/cie10"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          codigo: '',
          nombre: '',
          descripcion: '',
          categoria: '',
          capitulo: '',
          tipo: 'Principal',
          estado: 'Activo',
          sis_sucursal_id: undefined
        }}
        schema={cie10Schema}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Código CIE-10"
              name="codigo"
              value={formValues.codigo ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.codigo)}
              helperText={errors?.codigo || 'Ej: A00, J06.9, K29.7'}
              fullWidth
              margin="normal"
              required
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />

            <TextField
              label="Nombre / Diagnóstico"
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
              rows={2}
            />

            <Autocomplete
              options={CATEGORIAS_CIE10}
              value={formValues.categoria || null}
              onChange={(_, newValue) => {
                setFormValues((prev: any) => ({
                  ...prev,
                  categoria: newValue || ''
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categoría"
                  error={Boolean(errors?.categoria)}
                  helperText={errors?.categoria}
                  margin="normal"
                />
              )}
              freeSolo
              fullWidth
            />

            <TextField
              label="Capítulo"
              name="capitulo"
              value={formValues.capitulo ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.capitulo)}
              helperText={errors?.capitulo || 'Ej: Capítulo I, Capítulo X'}
              fullWidth
              margin="normal"
            />

            <Autocomplete
              options={TIPOS_DIAGNOSTICO}
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
                  label="Tipo de Diagnóstico"
                  error={Boolean(errors?.tipo)}
                  helperText={errors?.tipo}
                  margin="normal"
                />
              )}
              fullWidth
            />

            <Autocomplete
              options={ESTADOS}
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
          </>
        )}
      />
    </Container>
  );
}
