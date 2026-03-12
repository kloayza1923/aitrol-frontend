import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { FetchData } from '@/utils/FetchData';
import { MenuItem, TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';

type CajaUser = {
  id?: number;
  id_caja: string;
  puede_abrir: string;
  puede_cerrar: string;
  id_usuario?: number;
  puede_registrar: string;
};
type Caja = {
  id?: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
};
export default function CajasUser() {
  const columns: GridColDef[] = [
    { field: 'id_caja', headerName: 'ID Caja', flex: 1, minWidth: 150 },
    { field: 'id_usuario', headerName: 'ID Usuario', flex: 1, minWidth: 150 },
    { field: 'puede_abrir', headerName: 'Puede Abrir', flex: 1, minWidth: 100 },
    { field: 'puede_cerrar', headerName: 'Puede Cerrar', flex: 1, minWidth: 100 },
    { field: 'puede_registrar', headerName: 'Puede Registrar', flex: 1, minWidth: 100 }
  ];
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const getCajas = async () => {
    try {
      const response = await FetchData('/caja', 'GET');
      console.log('Cajas fetched:', response);
      if (Array.isArray(response)) {
        setCajas(response);
      }
    } catch (error) {
      console.error('Error fetching cajas:', error);
    }
  };

  const getUsuarios = async () => {
    try {
      const response = await FetchData('/users', 'GET');
      console.log('Usuarios fetched:', response);
      if (Array.isArray(response)) {
        setUsuarios(response);
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    }
  };

  useEffect(() => {
    getCajas();
    getUsuarios();
  }, []);

  return (
    <Container>
      <CrudDataGrid<CajaUser>
        title="Cajas"
        endpoint="/caja/usuario"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          id_caja: '',
          puede_abrir: '',
          puede_cerrar: '',
          puede_registrar: '',
          id_usuario: undefined
        }}
        renderForm={(formValues, handleChange) => (
          <>
            <TextField
              label="ID Caja"
              name="id_caja"
              value={formValues.id_caja}
              onChange={handleChange}
              fullWidth
              margin="normal"
              select
            >
              <MenuItem value="" disabled>
                <em>Seleccione una caja</em>
              </MenuItem>
              {cajas?.map((caja) => (
                <MenuItem key={caja.id} value={caja.id}>
                  {caja.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="ID Usuario"
              name="id_usuario"
              value={formValues.id_usuario?.toString() || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              select
            >
              {usuarios?.map((usuario) => (
                <MenuItem key={usuario.id} value={usuario.id.toString()}>
                  {usuario.nombre} {usuario.apellido} ({usuario.nombre_usuario})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Puede Abrir"
              name="puede_abrir"
              value={formValues.puede_abrir}
              onChange={handleChange}
              fullWidth
              margin="normal"
              select
            >
              <MenuItem value="true">Sí</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </TextField>
            <TextField
              label="Puede Cerrar"
              name="puede_cerrar"
              value={formValues.puede_cerrar}
              onChange={handleChange}
              fullWidth
              margin="normal"
              select
            >
              <MenuItem value="true">Sí</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </TextField>
            <TextField
              label="Puede Registrar"
              name="puede_registrar"
              value={formValues.puede_registrar}
              onChange={handleChange}
              fullWidth
              margin="normal"
              select
            >
              <MenuItem value="true">Sí</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </TextField>
          </>
        )}
      />
    </Container>
  );
}
