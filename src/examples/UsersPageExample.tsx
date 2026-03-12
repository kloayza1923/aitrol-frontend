import React from 'react';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { GridColDef } from '@mui/x-data-grid';
import { TextField, Box } from '@mui/material';
import * as Yup from 'yup';

// Ejemplo de uso del DataGridComponente refactorizado con Redux

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

const UsersPage: React.FC = () => {
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
    <div>
      <CrudDataGrid<User>
        title="Gestión de Usuarios"
        endpoint="users" // El endpoint de la API
        columns={columns}
        defaultFormValues={defaultFormValues}
        renderForm={renderForm}
        mode="crud"
        showDelete={true}
        showEdit={true}
        exportToExcel={true}
        schema={validationSchema}
        // Campos numéricos para gráficos (opcional)
        numericFields={[{ field: 'id', type: 'column' }]}
      />
    </div>
  );
};

export default UsersPage;
