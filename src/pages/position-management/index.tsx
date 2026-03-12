import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { MenuItem } from '@/components/menu/MenuItem';
import { FetchData } from '@/utils/FetchData';
import { cargoSchema, hierarchicalLevelSchema } from '@/validations/tthValidations';
import { TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

type Cargos = {
  id?: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  sueldo_minimo: number;
  sueldo_maximo: number;
  nivel_jerarquico_id?: number;
  nivel_jerarquico_nombre?: string;
};

export default function PositionManagement() {
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 150 },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 200 },
    { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 100, type: 'boolean' },
    { field: 'sueldo_minimo', headerName: 'Sueldo Mínimo', flex: 1, minWidth: 180, type: 'number' },
    { field: 'sueldo_maximo', headerName: 'Sueldo Máximo', flex: 1, minWidth: 180, type: 'number' },
    { field: 'nivel_jerarquico_nombre', headerName: 'Nivel Jerárquico', flex: 1, minWidth: 120 }
  ];
  const getNivelesJerarquicos = async () => {
    const response = await FetchData('/rrhh/niveles-jerarquicos');
    return response;
  };
  const [nivelesJerarquicos, setNivelesJerarquicos] = useState([]);
  const fetchNivelesJerarquicos = async () => {
    const data = await getNivelesJerarquicos();
    setNivelesJerarquicos(data);
  };
  useEffect(() => {
    fetchNivelesJerarquicos();
  }, []);

  return (
    <Container>
      <CrudDataGrid<Cargos>
        title="Cargos"
        endpoint="/rrhh/cargos"
        mode="crud"
        columns={columns}
        schema={cargoSchema}
        defaultFormValues={{
          nombre: '',
          descripcion: '',
          estado: true,
          sueldo_minimo: 0,
          sueldo_maximo: 0
        }}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Nombre"
              name="nombre"
              value={formValues.nombre}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors?.nombre}
              helperText={errors?.nombre}
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={formValues.descripcion}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              error={!!errors?.descripcion}
              helperText={errors?.descripcion}
            />
            <TextField
              select
              label="Estado"
              name="estado"
              value={formValues.estado}
              onChange={handleChange}
              fullWidth
              margin="normal"
              SelectProps={{ native: true, shrink: true }}
              error={!!errors?.estado}
              helperText={errors?.estado}
            >
              <option value={true}>Activo</option>
              <option value={false}>Inactivo</option>
            </TextField>
            <TextField
              label="Sueldo Mínimo"
              name="sueldo_minimo"
              type="number"
              value={formValues.sueldo_minimo}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors?.sueldo_minimo}
              helperText={errors?.sueldo_minimo}
            />
            <TextField
              label="Sueldo Máximo"
              name="sueldo_maximo"
              type="number"
              value={formValues.sueldo_maximo}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors?.sueldo_maximo}
              helperText={errors?.sueldo_maximo}
            />
            <TextField
              select
              label="Nivel Jerárquico"
              name="nivel_jerarquico_id"
              value={formValues.nivel_jerarquico_id || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              SelectProps={{ native: true }}
              error={!!errors?.nivel_jerarquico_id}
              helperText={errors?.nivel_jerarquico_id}
            >
              <option value="">Seleccione un nivel jerárquico</option>
              {nivelesJerarquicos.map((nivel: any) => (
                <option key={nivel.id} value={nivel.id}>
                  {nivel.nombre}
                </option>
              ))}
            </TextField>
          </>
        )}
      />
    </Container>
  );
}
