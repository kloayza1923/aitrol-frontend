import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

type CajaMovimiento = {
  id?: number;
  fecha: string;
  id_usuario: string;
  tipo_movimiento: boolean;
  concepto: string;
  monto: number;
  id_referencia: string;
  origen: string;
  observacion: string;
};

export default function CajasMov() {
  const columns: GridColDef[] = [
    { field: 'fecha', headerName: 'Fecha', flex: 1, minWidth: 150 },
    { field: 'tipo_movimiento', headerName: 'Tipo Movimiento', flex: 1, minWidth: 150 },
    { field: 'concepto', headerName: 'Concepto', flex: 1, minWidth: 150 },
    { field: 'monto', headerName: 'Monto', flex: 1, minWidth: 150 },
    { field: 'id_referencia', headerName: 'ID Referencia', flex: 1, minWidth: 150 },
    { field: 'origen', headerName: 'Origen', flex: 1, minWidth: 150 },
    { field: 'observacion', headerName: 'Observación', flex: 1, minWidth: 150 }
  ];

  return (
    <Container>
      <CrudDataGrid<CajaMovimiento>
        title="Cajas"
        endpoint="/caja/movimiento"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          fecha: '',
          tipo_movimiento: true,
          concepto: '',
          monto: 0,
          id_referencia: '',
          origen: '',
          observacion: ''
        }}
        renderForm={(formValues, handleChange) => (
          <>
            <TextField
              label="Fecha"
              name="fecha"
              type="date"
              value={formValues.fecha}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Tipo Movimiento"
              name="tipo_movimiento"
              value={formValues.tipo_movimiento}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Concepto"
              name="concepto"
              value={formValues.concepto}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Monto"
              name="monto"
              type="number"
              value={formValues.monto}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="ID Referencia"
              name="id_referencia"
              value={formValues.id_referencia}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Origen"
              name="origen"
              value={formValues.origen}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Observación"
              name="observacion"
              value={formValues.observacion}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </>
        )}
      />
    </Container>
  );
}
