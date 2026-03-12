import { Container } from '@/components/container';
import { useNavigate } from 'react-router-dom';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { GridColDef } from '@mui/x-data-grid';
import { Grid, TextField, Autocomplete } from '@mui/material';
import { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
type Branch = {
  id?: number;
  id_empresa?: string;
  codigo?: string;
  direccion?: string;
  telefono?: string;
  usuarios?: any[];
};
const BranchList = () => {
  const navigate = useNavigate();

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0.5 },
    { field: 'codigo', headerName: 'Código', flex: 1 },
    { field: 'direccion', headerName: 'Dirección', flex: 2 },
    { field: 'telefono', headerName: 'Teléfono', flex: 1 },
    { field: 'id_empresa', headerName: 'ID Empresa', flex: 1 }
  ];
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const userfetch = FetchData('/users', 'GET');
    userfetch.then((data) => setUsers(Array.isArray(data) ? data : []));
  }, []);

  return (
    <Container>
      <CrudDataGrid<Branch>
        title="Sucursales"
        endpoint="/sis/sucursal"
        mode="crud"
        key={13333}
        showEdit={true}
        columns={columns}
        defaultFormValues={{
          id_empresa: '1',
          codigo: '',
          direccion: '',
          telefono: '',
          usuarios: []
        }}
        renderForm={(formValues, handleChange, setFormValues) => {
          return (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="codigo"
                  label="Código"
                  fullWidth
                  value={formValues.codigo}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="direccion"
                  label="Dirección"
                  fullWidth
                  value={formValues.direccion}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="telefono"
                  label="Teléfono"
                  fullWidth
                  value={formValues.telefono}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={users}
                  getOptionLabel={(option: any) =>
                    option.nombre_usuario || option.nombre || String(option.id)
                  }
                  value={(formValues.usuarios || [])
                    .map((id: any) => users.find((u: any) => u.id === id))
                    .filter(Boolean)}
                  onChange={(_, value) => {
                    const ids = value.map((v: any) => v.id);
                    setFormValues({ ...formValues, usuarios: ids });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Usuarios" placeholder="Buscar usuarios" />
                  )}
                />
              </Grid>
            </Grid>
          );
        }}
      />
    </Container>
  );
};

export default BranchList;
