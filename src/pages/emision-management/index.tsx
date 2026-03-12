import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { GridColDef } from '@mui/x-data-grid';
import { Grid, TextField } from '@mui/material';
import { FetchData } from '@/utils/FetchData';
import { useEffect, useState } from 'react';

type EmissionPoint = {
  id?: number;
  id_punto_emision?: number;
  id_sucursal?: string;
  codigo?: string;
  direccion?: string;
  telefono?: string;
};

const EmissionPointList = () => {
  const [sucursalData, setSucursalData] = useState([]);
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0.5 },
    { field: 'codigo', headerName: 'Código', flex: 1 },
    { field: 'descripcion', headerName: 'Dirección', flex: 2 },
    { field: 'id_sucursal', headerName: 'ID Sucursal', flex: 1 }
  ];
  const getSucursalData = async () => {
    // Lógica para obtener los datos de las sucursales
    const resp = await FetchData('/sis/sucursal');
    setSucursalData(resp);
    return resp;
  };
  useEffect(() => {
    getSucursalData();
  }, []);

  return (
    <Container>
      <CrudDataGrid<EmissionPoint>
        title="Puntos de Emisión"
        endpoint="/sis/punto_emision"
        mode="crud"
        key={14444}
        showEdit={true}
        columns={columns}
        defaultFormValues={{
          id_sucursal: undefined,
          codigo: '',
          descripcion: ''
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
                  name="descripcion"
                  label="Descripción"
                  fullWidth
                  value={formValues.descripcion}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  name="id_sucursal"
                  label="Sucursal"
                  fullWidth
                  value={formValues.id_sucursal}
                  onChange={handleChange}
                  SelectProps={{
                    native: true
                  }}
                >
                  <option value="">Seleccione una sucursal</option>
                  {sucursalData.map((sucursal: any) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.codigo} - {sucursal.direccion}
                    </option>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          );
        }}
      />
    </Container>
  );
};

export default EmissionPointList;
