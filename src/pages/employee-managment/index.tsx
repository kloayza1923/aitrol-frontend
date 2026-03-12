import { Container } from '@/components/container';
import { Fragment, useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import { useNavigate } from 'react-router';
import { useTabNavigate } from '@/hooks';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';

type Empleado = {
  id: number;
  cedula: string;
  nombres: string;
  cargo: string;
  sueldo_basico: number;
  area: string | null;
  jefe_inmediato: string | null;
};

type EmpleadoDetalle = {
  cedula: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  fecha_ingreso: string;
  cargo: string;
  sueldo_basico: number;
  area_id?: number;
  jefe_id?: number;
};

const EmployeesList = () => {
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | null>(null);
  const [empleadoDetalle, setEmpleadoDetalle] = useState<EmpleadoDetalle | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const location = useNavigate();
  const { navigateToTab } = useTabNavigate();
  // Carga la lista de empleados activos
  const loadEmpleados = async () => {
    setLoading(true);
    const data = await FetchData('/rrhh/empleados', 'GET', { estado: 'activo' });
    setEmpleados(data || []);
    setLoading(false);
  };

  // Carga los detalles de un empleado para editar
  const loadEmpleadoDetalle = async (id: number) => {
    setFormLoading(true);
    const data = await FetchData(`/rrhh/empleados/${id}`, 'GET');
    setEmpleadoDetalle(data);
    setFormLoading(false);
  };

  useEffect(() => {
    loadEmpleados();
  }, []);

  // Al seleccionar un empleado, carga sus datos
  useEffect(() => {
    if (selectedEmpleadoId !== null) {
      loadEmpleadoDetalle(selectedEmpleadoId);
    } else {
      setEmpleadoDetalle(null);
    }
  }, [selectedEmpleadoId]);

  // Maneja el cambio de campos en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!empleadoDetalle) return;
    const { name, value } = e.target;
    setEmpleadoDetalle({ ...empleadoDetalle, [name]: value });
  };

  // Guardar actualización del empleado
  const handleSave = async () => {
    if (!empleadoDetalle || selectedEmpleadoId === null) return;
    setFormLoading(true);
    const response = await fetch(`/rrhh/empleados/${selectedEmpleadoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empleadoDetalle)
    });
    if (response.ok) {
      alert('Empleado actualizado exitosamente');
      await loadEmpleados();
      setSelectedEmpleadoId(null);
    } else {
      alert('Error actualizando empleado');
    }
    setFormLoading(false);
  };

  return (
    <Container>
      {loading ? (
        <p>Cargando empleados...</p>
      ) : (
        <CrudDataGrid
          title="Empleados"
          columns={[
            { field: 'id', headerName: 'ID', width: 90 },
            { field: 'cedula', headerName: 'Cédula', flex: 1 },
            { field: 'nombres', headerName: 'Nombres', flex: 1 },
            { field: 'cargo', headerName: 'Cargo', flex: 1 },
            { field: 'sueldo_basico', headerName: 'Sueldo Básico', type: 'number', flex: 1 },
            { field: 'area', headerName: 'Área', flex: 1 },
            { field: 'jefe_inmediato', headerName: 'Jefe Inmediato', flex: 1 }
          ]}
          mode="redirect"
          endpoint="/rrhh/empleados"
          onEditClick={({ id }) => {
            if (id) {
              setSelectedEmpleadoId(id);
              navigateToTab(`/employee-management/edit/${id}`, { customTitle: 'Editar Empleado' });
            }
          }}
          onCreateClick={() => {
            setSelectedEmpleadoId(null);
            location('/employee-management/create');
          }}
        />
      )}
    </Container>
  );
};

export default EmployeesList;
