import React from 'react';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { GridColDef } from '@mui/x-data-grid';
import { TextField, Box } from '@mui/material';
import * as Yup from 'yup';

// Ejemplo COMPLETO usando verdadero Redux Toolkit Query

interface User {
  id?: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('El nombre es requerido'),
  email: Yup.string().email('Email inválido').required('El email es requerido'),
  role: Yup.string().required('El rol es requerido')
});

const UsersPageWithRedux: React.FC = () => {
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Nombre', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'role', headerName: 'Rol', width: 150 },
    { field: 'created_at', headerName: 'Creado', width: 180 }
  ];

  const defaultFormValues: User = {
    name: '',
    email: '',
    role: ''
  };

  const renderForm = (
    formValues: User,
    handleChange: (e: any) => void,
    setFormValues: React.Dispatch<React.SetStateAction<User>>,
    errors: Partial<Record<keyof User, string>>
  ) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        name="name"
        label="Nombre"
        value={formValues.name}
        onChange={handleChange}
        error={!!errors.name}
        helperText={errors.name}
        fullWidth
      />
      <TextField
        name="email"
        label="Email"
        type="email"
        value={formValues.email}
        onChange={handleChange}
        error={!!errors.email}
        helperText={errors.email}
        fullWidth
      />
      <TextField
        name="role"
        label="Rol"
        value={formValues.role}
        onChange={handleChange}
        error={!!errors.role}
        helperText={errors.role}
        fullWidth
      />
    </Box>
  );

  return (
    <ReduxProvider>
      <div style={{ padding: '20px' }}>
        <h1>Ejemplo con Redux Toolkit Query</h1>
        <CrudDataGrid<User>
          title="Gestión de Usuarios"
          endpoint="users" // Este endpoint ahora usa Redux RTK Query
          columns={columns}
          defaultFormValues={defaultFormValues}
          renderForm={renderForm}
          mode="crud"
          showDelete={true}
          showEdit={true}
          exportToExcel={true}
          schema={validationSchema}
          numericFields={[{ field: 'id', type: 'column' }]}
        />
      </div>
    </ReduxProvider>
  );
};

export default UsersPageWithRedux;

/* 
CARACTERÍSTICAS REDUX QUE AHORA TIENES:

✅ Cache automático - Los datos se cachean y reutilizan
✅ Loading states - Estados de carga automáticos 
✅ Error handling - Manejo de errores centralizado
✅ Optimistic updates - Actualizaciones optimistas
✅ Background refetching - Refetch automático en background
✅ Tag-based invalidation - Cache inteligente que se invalida automáticamente
✅ Normalized data - Datos normalizados automáticamente
✅ DevTools support - Debugging con Redux DevTools

BENEFICIOS:
- Ya no necesitas manejar loading states manualmente
- El cache se invalida automáticamente después de crear/editar/eliminar
- Los datos se comparten entre componentes automáticamente
- Performance mejorada con memoización automática
- Menos código boilerplate
*/
