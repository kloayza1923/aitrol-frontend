import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { GridColDef } from '@mui/x-data-grid';

type Marcacion = {
  id: number;
  empleado_nombre: string;
  tipo: string;
  latitud: number;
  longitud: number;
  timestamp: string;
};

export default function MarcacionesRRHHList() {
  const columns: GridColDef[] = [
    { field: 'empleado_nombre', headerName: 'Empleado', flex: 1, minWidth: 180 },
    { field: 'tipo', headerName: 'Tipo', flex: 1, minWidth: 150 },
    {
      field: 'latitud',
      headerName: 'Latitud',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => params?.value?.toFixed(4)
    },
    {
      field: 'longitud',
      headerName: 'Longitud',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => params?.value?.toFixed(4)
    },
    {
      field: 'timestamp',
      headerName: 'Fecha/Hora',
      flex: 1,
      minWidth: 180,
      valueFormatter: (params) => new Date(String(params).replace(' ', 'T')).toLocaleString()
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Marcacion>
        title="Marcaciones de Empleados"
        endpoint="/rrhh/marcaciones"
        mode="list" // Solo listar y eliminar
        columns={columns}
        // No hay formulario porque no creamos/actualizamos desde RRHH
      />
    </Container>
  );
}
