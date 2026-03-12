import { AuthContext } from '@/auth/providers/JWTProvider';
import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { MenuItem, TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useContext, useEffect, useState } from 'react';

type SolicitudVacaciones = {
  id?: number;
  empleado_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo?: string;
};

export default function SolicitudesVacacionesEmpleado() {
  const columns: GridColDef[] = [
    { field: 'empleado', headerName: 'Empleado', flex: 1, minWidth: 120 },
    { field: 'fecha_inicio', headerName: 'Fecha Inicio', flex: 1, minWidth: 150 },
    { field: 'fecha_fin', headerName: 'Fecha Fin', flex: 1, minWidth: 150 },
    { field: 'motivo', headerName: 'Motivo', flex: 2, minWidth: 200 },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      minWidth: 150
    }
  ];
  const [empleados, setEmpleados] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const getEmpleados = async () => {
    const response = await fetch('/rrhh/empleados');
    const data = await response.json();
    setEmpleados(data);
  };
  useEffect(() => {
    getEmpleados();
  }, []);

  return (
    <Container>
      <CrudDataGrid<SolicitudVacaciones>
        title="Solicitudes de Vacaciones"
        endpoint="/vacaciones/solicitud" // tu endpoint de creación/listado
        mode="crud"
        columns={columns}
        defaultFormValues={{
          empleado_id: currentUser?.id || 0, // Aquí deberías setear el empleado logueado automáticamente
          fecha_inicio: '',
          fecha_fin: '',
          motivo: ''
        }}
        params={{ empleado_id: currentUser?.id }} // Filtrar por el empleado logueado
        renderForm={(formValues, handleChange) => (
          <>
            <TextField
              label="Fecha Inicio"
              name="fecha_inicio"
              type="date"
              value={formValues.fecha_inicio}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha Fin"
              name="fecha_fin"
              type="date"
              value={formValues.fecha_fin}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Motivo"
              name="motivo"
              value={formValues.motivo}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
          </>
        )}
      />
    </Container>
  );
}
