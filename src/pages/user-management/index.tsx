import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, MenuItem, Select, FormControl, InputLabel, Box, Grid } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { CrudAvatarUpload } from '@/partials/crud';
import { FetchData } from '@/utils/FetchData';
import { userSchema } from '@/validations/userValidation';

type User = {
  id?: number;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  email: string;
  rol_id: number | '';
  estado: string;
  foto: string;
  fecha_nacimiento: string;
  telefono: string;
};

const UserManagement = () => {
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([]);
  const [avatar, setAvatar] = useState<any[]>([]);

  const getRoles = async () => {
    const data = await FetchData('/roles', 'GET', {});
    if (!data.detail) setRoles(data);
  };

  useEffect(() => {
    getRoles();
  }, []);
  useEffect(() => {
    //console.log({ avatar });
  }, [avatar]);
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 150 },
    { field: 'apellido', headerName: 'Apellido', flex: 1, minWidth: 150 },
    { field: 'nombre_usuario', headerName: 'Usuario', flex: 1, minWidth: 150 },
    { field: 'correo', headerName: 'Correo', flex: 2, minWidth: 200 },
    {
      field: 'foto',
      headerName: 'Foto',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <img src={params.value} alt="user" className="w-10 h-10 rounded-full" />
      )
    }
  ];

  return (
    <Container>
      <CrudDataGrid<User>
        title="Usuarios"
        endpoint="/users"
        mode="crud"
        schema={userSchema}
        columns={columns}
        defaultFormValues={{
          nombre: '',
          apellido: '',
          nombre_usuario: '',
          email: '',
          rol_id: '',
          estado: 'activo',
          foto: '',
          password: '',
          fecha_nacimiento: '',
          telefono: ''
        }}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={formValues.nombre}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={Boolean(errors?.nombre)}
                  helperText={errors?.nombre}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Apellido"
                  name="apellido"
                  value={formValues.apellido}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!errors.apellido}
                  helperText={errors.apellido}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Usuario"
                  name="nombre_usuario"
                  value={formValues.nombre_usuario}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!errors.nombre_usuario}
                  helperText={errors.nombre_usuario}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Correo"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={formValues.password}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  value={formValues.fecha_nacimiento}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!errors.fecha_nacimiento}
                  helperText={errors.fecha_nacimiento}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teléfono"
                  name="telefono"
                  value={formValues.telefono}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!errors.telefono}
                  helperText={errors.telefono}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Rol</InputLabel>
                  <Select
                    name="rol_id"
                    value={formValues.rol_id ?? ''}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        rol_id: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    label="Rol"
                    error={!!errors.rol_id}
                    helperText={errors.rol_id}
                  >
                    <MenuItem value="">Seleccione un rol</MenuItem>
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={formValues.estado}
                    onChange={handleChange}
                    label="Estado"
                    error={!!errors.estado}
                    helperText={errors.estado}
                  >
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="deshabilitado">Deshabilitado</MenuItem>
                    <MenuItem value="pendiente">Pendiente</MenuItem>
                  </Select>
                </FormControl>
              </Grid> */}
              <Grid item xs={12}>
                <Box mt={2}>
                  <CrudAvatarUpload
                    avatar={avatar}
                    setAvatar={setAvatar}
                    onChange={handleChange}
                    onSuccess={(url) => setFormValues({ ...formValues, foto: url.dataURL })}
                  />
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      />
    </Container>
  );
};

export { UserManagement };
