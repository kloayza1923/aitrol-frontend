import { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, FormControlLabel, Switch, MenuItem, Autocomplete } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { FetchData } from '@/utils/FetchData';
import * as Yup from 'yup';
import { CrudAvatarUpload } from '@/partials/crud';

type Vehicle = {
  id?: number;
  nombre: string;
  tipo_id?: number;
  tipo_nombre?: string;
  conductor_id?: number;
  conductor_nombre?: string;
  kilometraje_inicial?: number;
  capacidad?: number;
  estado?: boolean;
  aviso_mantenimiento?: number;
  foto?: string;
};

export const VehicleManagement = () => {
  const [types, setTypes] = useState<any>([]);
  const [conductores, setConductores] = useState<any>([]);
  const [avatar, setAvatar] = useState<any>([]);

  useEffect(() => {
    const load = async () => {
      const t = await FetchData('vehicles_types', 'GET', {});
      if (t && !t.detail) setTypes(t);
      const c = await FetchData('users', 'GET', {});
      if (c && !c.detail) setConductores(c);
    };
    load();
  }, []);

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 150 },
    { field: 'tipo_nombre', headerName: 'Tipo', flex: 1, minWidth: 120 },
    { field: 'conductor_nombre', headerName: 'Conductor', flex: 1, minWidth: 150 },
    { field: 'kilometraje_inicial', headerName: 'Kilometraje', flex: 1, minWidth: 120 },
    { field: 'capacidad', headerName: 'Capacidad', flex: 1, minWidth: 120 },
    { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 80 }
  ];

  const vehicleSchema = Yup.object().shape({
    nombre: Yup.string().required('Placa es requerida'),
    tipo_id: Yup.number().required('Seleccione un tipo').typeError('Seleccione un tipo'),
    conductor_id: Yup.number()
      .required('Seleccione un conductor')
      .typeError('Seleccione un conductor'),
    kilometraje_inicial: Yup.number().min(0),
    capacidad: Yup.number().min(0),
    estado: Yup.boolean(),
    aviso_mantenimiento: Yup.number().nullable()
  });

  return (
    <Container>
      <CrudDataGrid<Vehicle>
        title="Gestión de Vehículos"
        endpoint="/vehicles"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          nombre: '',
          tipo_id: 0,
          conductor_id: 0,
          kilometraje_inicial: 0,
          capacidad: 0,
          estado: true,
          aviso_mantenimiento: 0,
          foto: ''
        }}
        schema={vehicleSchema}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Placa"
              name="nombre"
              value={formValues.nombre ?? ''}
              onChange={handleChange}
              error={Boolean(errors?.nombre)}
              helperText={errors?.nombre || ''}
              fullWidth
              margin="normal"
            />

            <TextField
              select
              label="Tipo"
              name="tipo_id"
              value={formValues.tipo_id ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={Boolean(errors?.tipo_id)}
              helperText={errors?.tipo_id || ''}
            >
              <MenuItem value="">Seleccione un tipo</MenuItem>
              {types.map((t: any) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.nombre}
                </MenuItem>
              ))}
            </TextField>

            {/* <TextField
              select
              label="Conductor"
              name="conductor_id"
              value={formValues.conductor_id ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={Boolean(errors?.conductor_id)}
              helperText={errors?.conductor_id || ''}
            >
              <MenuItem value="">Seleccione un conductor</MenuItem>
              {conductores.map((c: any) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombres || c.nombre || c.email}
                </MenuItem>
              ))}
            </TextField> */}
            <Autocomplete
              options={conductores}
              getOptionLabel={(option: any) => option.nombre + ' ' + option.apellido}
              value={conductores.find((c: any) => c.id === formValues.conductor_id) || null}
              onChange={(_, value) => {
                setFormValues({
                  ...formValues,
                  conductor_id: value ? value.id : 0
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Conductor"
                  placeholder="Seleccione un conductor"
                  margin="normal"
                  error={Boolean(errors?.conductor_id)}
                  helperText={errors?.conductor_id || ''}
                />
              )}
            />

            <TextField
              label="Kilometraje Inicial"
              name="kilometraje_inicial"
              type="number"
              value={formValues.kilometraje_inicial ?? 0}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={Boolean(errors?.kilometraje_inicial)}
              helperText={errors?.kilometraje_inicial || ''}
            />

            <TextField
              label="Capacidad"
              name="capacidad"
              type="number"
              value={formValues.capacidad ?? 0}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={Boolean(errors?.capacidad)}
              helperText={errors?.capacidad || ''}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={!!formValues.estado}
                  onChange={(e) => setFormValues({ ...formValues, estado: e.target.checked })}
                />
              }
              label="Activo"
            />

            <TextField
              label="Aviso de Mantenimiento (km)"
              name="aviso_mantenimiento"
              type="number"
              value={formValues.aviso_mantenimiento ?? ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <CrudAvatarUpload
              key={formValues.id || 'new'}
              label="Foto del Vehículo"
              name="foto"
              avatar={avatar}
              setAvatar={setAvatar}
              value={formValues.foto}
              onChange={(e: any) => {
                if (e.target?.value) {
                  setFormValues({ ...formValues, foto: e.target.value });
                }
              }}
              onSuccess={(file) => {
                if (file?.dataURL) {
                  setFormValues({ ...formValues, foto: file.dataURL });
                }
              }}
              error={Boolean(errors?.foto)}
              helperText={errors?.foto || ''}
            />
          </>
        )}
      />
    </Container>
  );
};
