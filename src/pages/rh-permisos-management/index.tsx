import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, MenuItem } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import { permissionRequestSchema } from '@/validations/tthValidations';
type Permiso = {
  id?: number;
  empleado_id: number;
  tipo_permiso: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo?: string;
  estado: string;
};

type Empleado = {
  id: number;
  nombre: string;
};

export default function PermisosList() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  // 🔹 Cargar lista de empleados
  useEffect(() => {
    const loadEmpleados = async () => {
      try {
        const data = await FetchData('/rrhh/empleados');
        setEmpleados(data);
      } catch (error) {
        console.error('Error cargando empleados', error);
      }
    };
    loadEmpleados();
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'empleado_nombre',
      headerName: 'Empleado',
      flex: 1,
      minWidth: 150
    },
    { field: 'tipo_permiso', headerName: 'Tipo', flex: 1, minWidth: 150 },
    { field: 'fecha_inicio', headerName: 'Inicio', flex: 1, minWidth: 120 },
    { field: 'fecha_fin', headerName: 'Fin', flex: 1, minWidth: 120 },
    { field: 'motivo', headerName: 'Motivo', flex: 2, minWidth: 200 },
    { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 120 }
  ];

  return (
    <Container>
      <CrudDataGrid<Permiso>
        title="Permisos de RRHH"
        endpoint="/rrhh/permisos"
        mode="crud"
        columns={columns}
        schema={permissionRequestSchema}
        defaultFormValues={{
          empleado_id: 0,
          tipo_permiso: '',
          fecha_inicio: '',
          fecha_fin: '',
          motivo: '',
          estado: 'Pendiente'
        }}
        renderForm={(formValues, handleChange, setFieldValue, errors) => (
          <>
            {/* Select de empleados */}
            <TextField
              select
              label="Empleado"
              name="empleado_id"
              value={formValues.empleado_id}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={Boolean(errors.empleado_id)}
              helperText={errors.empleado_id}
            >
              {empleados.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.nombres}
                </MenuItem>
              ))}
            </TextField>

            {/* Tipo de permiso */}
            <TextField
              select
              label="Tipo de permiso"
              name="tipo_permiso"
              value={formValues.tipo_permiso}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={Boolean(errors.tipo_permiso)}
              helperText={errors.tipo_permiso}
            >
              <MenuItem value="Vacaciones">Vacaciones</MenuItem>
              <MenuItem value="Enfermedad">Enfermedad</MenuItem>
              <MenuItem value="Personal">Personal</MenuItem>
            </TextField>

            {/* Fechas */}
            <TextField
              label="Fecha inicio"
              type="date"
              name="fecha_inicio"
              value={formValues.fecha_inicio}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={Boolean(errors.fecha_inicio)}
              helperText={errors.fecha_inicio}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha fin"
              type="date"
              name="fecha_fin"
              value={formValues.fecha_fin}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={Boolean(errors.fecha_fin)}
              helperText={errors.fecha_fin}
              InputLabelProps={{ shrink: true }}
            />

            {/* Motivo */}
            <TextField
              label="Motivo"
              name="motivo"
              value={formValues.motivo}
              onChange={handleChange}
              error={Boolean(errors.motivo)}
              helperText={errors.motivo}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />

            {/* Estado */}
            <TextField
              select
              label="Estado"
              name="estado"
              value={formValues.estado}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              <MenuItem value="Pendiente">Pendiente</MenuItem>
              <MenuItem value="Aprobado">Aprobado</MenuItem>
              <MenuItem value="Rechazado">Rechazado</MenuItem>
            </TextField>
          </>
        )}
      />
    </Container>
  );
}
