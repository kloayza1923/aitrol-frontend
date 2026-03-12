import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { MenuItem } from '@/components/menu/MenuItem';
import { FetchData } from '@/utils/FetchData';
import { contractSchema, hierarchicalLevelSchema } from '@/validations/tthValidations';
import { TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

type Contract = {
  id?: number;
  empleado_id: number;
  cargo_id: number;
  fecha_inicio: string;
  fecha_fin?: string;
  sueldo_base: number;
  tipo_contrato: string;
  estado: 'Activo' | 'Inactivo';
  empleado_nombre?: string;
  observaciones?: string;
};

export default function ContractManagement() {
  const columns: GridColDef[] = [
    { field: 'empleado_nombre', headerName: 'Empleado ID', flex: 1, minWidth: 200 },
    { field: 'cargo_id', headerName: 'Cargo ID', flex: 1, minWidth: 150 },
    { field: 'fecha_inicio', headerName: 'Fecha de Inicio', flex: 1, minWidth: 180 },
    { field: 'fecha_fin', headerName: 'Fecha de Fin', flex: 1, minWidth: 180 },
    { field: 'sueldo_base', headerName: 'Sueldo Base', flex: 1, minWidth: 150, type: 'number' },
    { field: 'tipo_contrato', headerName: 'Tipo de Contrato', flex: 1, minWidth: 150 },
    { field: 'observaciones', headerName: 'Observaciones', flex: 1, minWidth: 200 },
    { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 100, type: 'boolean' }
  ];

  const [empleados, setEmpleados] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  useEffect(() => {
    FetchData('/rrhh/empleados')
      .then((data) => setEmpleados(data))
      .catch((err) => console.error('Error fetching empleados:', err));
    FetchData('/rrhh/cargos')
      .then((data) => setCargos(data))
      .catch((err) => console.error('Error fetching cargos:', err));
  }, []);

  return (
    <Container>
      <CrudDataGrid<Contract>
        title="Gestión de Contratos"
        endpoint="/rrhh/contratos"
        mode="crud"
        columns={columns}
        schema={contractSchema}
        defaultFormValues={{
          empleado_id: 0,
          cargo_id: 0,
          fecha_inicio: '',
          fecha_fin: '',
          sueldo_base: 0,
          tipo_contrato: '',
          estado: 'Activo',
          observaciones: ''
        }}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Empleado ID"
              name="empleado_id"
              select
              value={formValues.empleado_id}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              margin="normal"
              error={!!errors?.empleado_id}
              helperText={errors?.empleado_id}
            >
              {empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombres}
                </option>
              ))}
            </TextField>
            <TextField
              label="Cargo ID"
              name="cargo_id"
              select
              value={formValues.cargo_id}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              margin="normal"
              error={!!errors?.cargo_id}
              helperText={errors?.cargo_id}
            >
              {cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nombre}
                </option>
              ))}
            </TextField>
            <TextField
              label="Fecha de Inicio"
              name="fecha_inicio"
              value={formValues.fecha_inicio}
              onChange={handleChange}
              fullWidth
              margin="normal"
              type="date"
              InputLabelProps={{ shrink: true }}
              error={!!errors?.fecha_inicio}
              helperText={errors?.fecha_inicio}
            />
            <TextField
              label="Fecha de Fin"
              name="fecha_fin"
              value={formValues.fecha_fin}
              onChange={handleChange}
              fullWidth
              margin="normal"
              type="date"
              InputLabelProps={{ shrink: true }}
              error={!!errors?.fecha_fin}
              helperText={errors?.fecha_fin}
            />
            <TextField
              label="Sueldo Base"
              name="sueldo_base"
              value={formValues.sueldo_base}
              onChange={handleChange}
              fullWidth
              margin="normal"
              type="number"
              error={!!errors?.sueldo_base}
              helperText={errors?.sueldo_base}
            />
            <TextField
              label="Tipo de Contrato"
              name="tipo_contrato"
              select
              value={formValues.tipo_contrato}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors?.tipo_contrato}
              helperText={errors?.tipo_contrato}
              SelectProps={{ native: true }}
            >
              <option value={'Indefinido'}>Indefinido</option>
              <option value={'Temporal'}>Temporal</option>
              <option value={'Por Proyecto'}>Por Proyecto</option>
            </TextField>
            <TextField
              label="Estado"
              name="estado"
              value={formValues.estado}
              onChange={handleChange}
              fullWidth
              margin="normal"
              select
              SelectProps={{ native: true, shrink: true }}
              InputLabelProps={{ shrink: true }}
              error={!!errors?.estado}
              helperText={errors?.estado}
            >
              <option value={'Activo'}>Activo</option>
              <option value={'Inactivo'}>Inactivo</option>
            </TextField>
            <TextField
              label="Observaciones"
              name="observaciones"
              value={formValues.observaciones}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors?.observaciones}
              helperText={errors?.observaciones}
            />
          </>
        )}
      />
    </Container>
  );
}
