import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { MenuItem } from '@/components/menu/MenuItem';
import { hierarchicalLevelSchema } from '@/validations/tthValidations';
import { TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

type NivelJerarquico = {
  id?: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  fecha_creacion?: string;
  nivel_orden: number;
};

export default function HierarchicalLevelsManagement() {
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 150 },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 200 },
    { field: 'estado', headerName: 'Estado', flex: 1, minWidth: 100, type: 'boolean' },
    {
      field: 'fecha_creacion',
      headerName: 'Fecha de Creación',
      flex: 1,
      minWidth: 180,
      type: 'date'
    },
    { field: 'nivel_orden', headerName: 'Nivel/Orden', flex: 1, minWidth: 120, type: 'number' }
  ];

  return (
    <Container>
      <CrudDataGrid<NivelJerarquico>
        title="Niveles Jerárquicos"
        endpoint="/rrhh/niveles-jerarquicos"
        mode="crud"
        columns={columns}
        schema={hierarchicalLevelSchema}
        defaultFormValues={{ nombre: '', descripcion: '', estado: true, nivel_orden: 0 }}
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
              label="Nivel/Orden"
              name="nivel_orden"
              value={formValues.nivel_orden}
              onChange={handleChange}
              fullWidth
              margin="normal"
              type="number"
              error={!!errors?.nivel_orden}
              helperText={errors?.nivel_orden}
            />
          </>
        )}
      />
    </Container>
  );
}
