import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { Autocomplete, Chip, FormControlLabel, Switch, TextField } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { medicamentoSchema } from '@/validations/HealthValidation';

type Medicamento = {
  id?: number;
  codigo?: string;
  nombre_generico: string;
  nombre_comercial?: string;
  principio_activo?: string;
  forma_farmaceutica?: string;
  concentracion?: string;
  via_administracion?: string;
  categoria_terapeutica?: string;
  presentacion?: string;
  unidad_medida?: string;
  codigo_atc?: string;
  requiere_receta?: boolean;
  estado?: string;
  sis_sucursal_id?: number;
};

const FORMAS_FARMACEUTICAS = [
  'Tableta',
  'Cápsula',
  'Jarabe',
  'Suspensión',
  'Solución oral',
  'Solución inyectable',
  'Crema',
  'Ungüento',
  'Gel',
  'Parche transdérmico',
  'Supositorio',
  'Óvulo',
  'Gotas oftálmicas',
  'Gotas óticas',
  'Spray nasal',
  'Inhalador',
  'Polvo para reconstituir',
  'Ampolla',
  'Vial'
];

const VIAS_ADMINISTRACION = [
  'Oral',
  'Intravenosa (IV)',
  'Intramuscular (IM)',
  'Subcutánea (SC)',
  'Tópica',
  'Oftálmica',
  'Ótica',
  'Nasal',
  'Inhalatoria',
  'Rectal',
  'Vaginal',
  'Sublingual',
  'Transdérmica'
];

const CATEGORIAS_TERAPEUTICAS = [
  'Analgésico',
  'Antibiótico',
  'Antiinflamatorio (AINE)',
  'Antiinflamatorio (Corticoide)',
  'Antihipertensivo',
  'Antidiabético',
  'Anticoagulante',
  'Antihistamínico',
  'Broncodilatador',
  'Antifúngico',
  'Antiviral',
  'Antiparasitario',
  'Gastroprotector',
  'Antieméticos',
  'Vitaminas y minerales',
  'Anticonvulsivante',
  'Antidepresivo',
  'Ansiolítico',
  'Antipsicótico',
  'Hipnótico / Sedante',
  'Diurético',
  'Hormonal',
  'Inmunosupresor',
  'Oncológico',
  'Otro'
];

const UNIDADES_MEDIDA = [
  'tableta',
  'cápsula',
  'ml',
  'mg',
  'g',
  'UI',
  'ampolla',
  'frasco',
  'parche',
  'supositorio'
];

const ESTADOS = ['Activo', 'Inactivo'];

export default function MedicamentosList() {
  const columns: GridColDef<Medicamento>[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'codigo', headerName: 'Código', width: 110 },
    { field: 'nombre_generico', headerName: 'Nombre Genérico', flex: 1.5, minWidth: 180 },
    { field: 'nombre_comercial', headerName: 'Nombre Comercial', flex: 1.2, minWidth: 160 },
    { field: 'concentracion', headerName: 'Concentración', width: 130 },
    {
      field: 'forma_farmaceutica',
      headerName: 'Forma',
      width: 130,
      renderCell: (params: GridRenderCellParams<Medicamento>) =>
        params.value ? <Chip label={params.value} size="small" color="info" /> : ''
    },
    {
      field: 'via_administracion',
      headerName: 'Vía',
      width: 130,
      renderCell: (params: GridRenderCellParams<Medicamento>) =>
        params.value ? <Chip label={params.value} size="small" color="secondary" /> : ''
    },
    { field: 'categoria_terapeutica', headerName: 'Categoría', flex: 1, minWidth: 150 },
    {
      field: 'requiere_receta',
      headerName: 'Receta',
      width: 100,
      renderCell: (params: GridRenderCellParams<Medicamento>) => (
        <Chip
          label={params.value ? 'Sí' : 'No'}
          size="small"
          color={params.value ? 'warning' : 'default'}
        />
      )
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 110,
      renderCell: (params: GridRenderCellParams<Medicamento>) =>
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
      <CrudDataGrid<Medicamento>
        title="Medicamentos"
        endpoint="/salud/medicamentos"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          codigo: '',
          nombre_generico: '',
          nombre_comercial: '',
          principio_activo: '',
          forma_farmaceutica: 'Tableta',
          concentracion: '',
          via_administracion: 'Oral',
          categoria_terapeutica: '',
          presentacion: '',
          unidad_medida: 'tableta',
          codigo_atc: '',
          requiere_receta: false,
          estado: 'Activo',
          sis_sucursal_id: undefined
        }}
        schema={medicamentoSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Código"
              name="codigo"
              value={formValues.codigo ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.codigo)}
              helperText={errors?.codigo || 'Ej: MED-001, FAR-0023'}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Nombre Genérico"
              name="nombre_generico"
              value={formValues.nombre_generico ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.nombre_generico)}
              helperText={errors?.nombre_generico}
              fullWidth
              margin="normal"
              required
            />

            <TextField
              label="Nombre Comercial"
              name="nombre_comercial"
              value={formValues.nombre_comercial ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.nombre_comercial)}
              helperText={errors?.nombre_comercial}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Principio Activo"
              name="principio_activo"
              value={formValues.principio_activo ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.principio_activo)}
              helperText={errors?.principio_activo}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Concentración"
              name="concentracion"
              value={formValues.concentracion ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.concentracion)}
              helperText={errors?.concentracion || 'Ej: 500mg, 250mg/5ml, 10mg/ml'}
              fullWidth
              margin="normal"
            />

            <Autocomplete
              options={FORMAS_FARMACEUTICAS}
              value={formValues.forma_farmaceutica || null}
              onChange={(_, newValue) => {
                setFormValues((prev: any) => ({
                  ...prev,
                  forma_farmaceutica: newValue || ''
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Forma Farmacéutica"
                  error={Boolean(errors?.forma_farmaceutica)}
                  helperText={errors?.forma_farmaceutica}
                  margin="normal"
                />
              )}
              freeSolo
              fullWidth
            />

            <Autocomplete
              options={VIAS_ADMINISTRACION}
              value={formValues.via_administracion || null}
              onChange={(_, newValue) => {
                setFormValues((prev: any) => ({
                  ...prev,
                  via_administracion: newValue || ''
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vía de Administración"
                  error={Boolean(errors?.via_administracion)}
                  helperText={errors?.via_administracion}
                  margin="normal"
                />
              )}
              freeSolo
              fullWidth
            />

            <Autocomplete
              options={CATEGORIAS_TERAPEUTICAS}
              value={formValues.categoria_terapeutica || null}
              onChange={(_, newValue) => {
                setFormValues((prev: any) => ({
                  ...prev,
                  categoria_terapeutica: newValue || ''
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categoría Terapéutica"
                  error={Boolean(errors?.categoria_terapeutica)}
                  helperText={errors?.categoria_terapeutica}
                  margin="normal"
                />
              )}
              freeSolo
              fullWidth
            />

            <TextField
              label="Presentación"
              name="presentacion"
              value={formValues.presentacion ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.presentacion)}
              helperText={errors?.presentacion || 'Ej: Caja x 30 tabletas, Frasco 120ml'}
              fullWidth
              margin="normal"
            />

            <Autocomplete
              options={UNIDADES_MEDIDA}
              value={formValues.unidad_medida || null}
              onChange={(_, newValue) => {
                setFormValues((prev: any) => ({
                  ...prev,
                  unidad_medida: newValue || ''
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Unidad de Medida"
                  error={Boolean(errors?.unidad_medida)}
                  helperText={errors?.unidad_medida}
                  margin="normal"
                />
              )}
              freeSolo
              fullWidth
            />

            <TextField
              label="Código ATC"
              name="codigo_atc"
              value={formValues.codigo_atc ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.codigo_atc)}
              helperText={errors?.codigo_atc || 'Código Anatómico Terapéutico Químico'}
              fullWidth
              margin="normal"
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

            <FormControlLabel
              control={
                <Switch
                  checked={formValues.requiere_receta ?? false}
                  onChange={(e) =>
                    setFormValues((prev: any) => ({
                      ...prev,
                      requiere_receta: e.target.checked
                    }))
                  }
                  color="warning"
                />
              }
              label="Requiere receta médica"
              sx={{ mt: 1, ml: 0.5 }}
            />
          </>
        )}
      />
    </Container>
  );
}
