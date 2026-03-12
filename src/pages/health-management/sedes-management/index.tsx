import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, Chip, Autocomplete } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import * as Yup from 'yup';

type Sede = {
  id?: number;
  cliente_id?: number;
  nombre: string;
  codigo?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  tipo_sede?: string;
  estado?: string;
};

const TIPOS_SEDE = [
  'Hospital',
  'Clínica',
  'Centro de Salud',
  'Consultorio',
  'Laboratorio',
  'Centro de Diagnóstico',
  'Farmacia',
  'Otro'
];

const ESTADOS_SEDE = ['Activo', 'Inactivo', 'En Mantenimiento', 'Cerrado Temporalmente'];

const sedeSchema = Yup.object().shape({
  nombre: Yup.string().required('El nombre es requerido'),
  codigo: Yup.string(),
  direccion: Yup.string(),
  telefono: Yup.string(),
  email: Yup.string().email('Email inválido'),
  tipo_sede: Yup.string(),
  estado: Yup.string(),
  cliente_id: Yup.number()
});

export default function SedesList() {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'success';
      case 'Inactivo':
        return 'default';
      case 'En Mantenimiento':
        return 'warning';
      case 'Cerrado Temporalmente':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef<Sede>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'codigo', headerName: 'Código', flex: 0.8, minWidth: 100 },
    { field: 'nombre', headerName: 'Nombre', flex: 1.5, minWidth: 200 },
    {
      field: 'tipo_sede',
      headerName: 'Tipo',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Sede>) =>
        params.value ? <Chip label={params.value} size="small" color="primary" /> : ''
    },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Sede>) =>
        params.value ? (
          <Chip label={params.value} size="small" color={getEstadoColor(params.value) as any} />
        ) : (
          ''
        )
    },
    { field: 'direccion', headerName: 'Dirección', flex: 1.5, minWidth: 200 },
    { field: 'telefono', headerName: 'Teléfono', width: 130 }
  ];

  return (
    <Container>
      <CrudDataGrid<Sede>
        title="Sedes"
        endpoint="/salud/sedes"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          nombre: '',
          codigo: '',
          direccion: '',
          telefono: '',
          email: '',
          tipo_sede: 'Clínica',
          estado: 'Activo',
          cliente_id: undefined
        }}
        schema={sedeSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Código"
              name="codigo"
              value={formValues.codigo ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.codigo)}
              helperText={errors?.codigo || 'Ej: SEDE-01, CLI-001'}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Nombre de la Sede"
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
              options={TIPOS_SEDE}
              value={formValues.tipo_sede || null}
              onChange={(_, newValue) => {
                setFormValues((prev: any) => ({
                  ...prev,
                  tipo_sede: newValue || ''
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tipo de Sede"
                  error={Boolean(errors?.tipo_sede)}
                  helperText={errors?.tipo_sede}
                  margin="normal"
                />
              )}
              freeSolo
              fullWidth
            />

            <TextField
              label="Dirección"
              name="direccion"
              value={formValues.direccion ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.direccion)}
              helperText={errors?.direccion}
              fullWidth
              margin="normal"
              multiline
              rows={2}
            />

            <TextField
              label="Teléfono"
              name="telefono"
              value={formValues.telefono ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.telefono)}
              helperText={errors?.telefono}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={formValues.email ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.email)}
              helperText={errors?.email}
              fullWidth
              margin="normal"
            />

            <Autocomplete
              options={ESTADOS_SEDE}
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

            <TextField
              label="Cliente ID"
              name="cliente_id"
              type="number"
              value={formValues.cliente_id ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.cliente_id)}
              helperText={errors?.cliente_id}
              fullWidth
              margin="normal"
            />
          </>
        )}
      />
    </Container>
  );
}
