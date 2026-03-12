import React, { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { TextField, Grid, Box, IconButton, MenuItem, Select, Autocomplete } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { GridColDef } from '@mui/x-data-grid';
import * as Yup from 'yup';
import { FetchData } from '@/utils/FetchData';

type Diario = {
  id?: number;
  fecha: string;
  numero_asiento?: string;
  descripcion?: string;
  id_usuario?: number;
  detalles_count?: number;
  detalles?: any[];
};

const diarioSchema = Yup.object({
  fecha: Yup.string().required('La fecha es obligatoria'),
  descripcion: Yup.string().required('La descripción es obligatoria'),
  numero_asiento: Yup.string().nullable()
});

export default function DiarioList() {
  const [planCuentas, setPlanCuentas] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await FetchData('/contabilidad/plan_cuentas', 'GET');
        const items = res.data || [];
        // keep only accounts that have a parent (id_padre != null)
        const leaves = items.filter((i: any) => i.id_padre !== null && i.id_padre !== undefined);
        setPlanCuentas(leaves);
      } catch (err) {
        console.error('Error loading plan cuentas', err);
      }
    };
    load();
  }, []);

  const toDateTimeLocal = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const columns: GridColDef[] = [
    {
      field: 'created_at',
      headerName: 'Fecha',
      flex: 1,
      minWidth: 150
    },
    { field: 'numero_asiento', headerName: 'Número Asiento', flex: 1, minWidth: 150 },
    { field: 'descripcion', headerName: 'Descripción', flex: 2, minWidth: 200 },
    { field: 'detalles_count', headerName: 'Líneas', flex: 0.5, minWidth: 80 }
  ];

  return (
    <Container>
      <CrudDataGrid<Diario>
        title="Diario"
        endpoint="/contabilidad/diario"
        mode="crud"
        columns={columns}
        schema={diarioSchema}
        defaultFormValues={{
          fecha: '',
          numero_asiento: '',
          descripcion: '',
          detalles: []
        }}
        renderForm={(formValues: any, handleChange: any, setFormValues: any, errors: any) => {
          const detalles: any[] = formValues.detalles || [];

          const setDetalle = (index: number, changes: any) => {
            const newDetalles = [...detalles];
            newDetalles[index] = { ...(newDetalles[index] || {}), ...changes };
            setFormValues({ ...formValues, detalles: newDetalles });
          };

          const addDetalle = () => {
            const newDetalles = [
              ...detalles,
              {
                id_cuenta: null,
                descripcion: '',
                debe: 0,
                haber: 0,
                id_sucursal: null,
                id_usuario: null
              }
            ];
            setFormValues({ ...formValues, detalles: newDetalles });
          };

          const removeDetalle = (index: number) => {
            const newDetalles = detalles.filter((_, i) => i !== index);
            setFormValues({ ...formValues, detalles: newDetalles });
          };

          return (
            <>
              <TextField
                label="Fecha"
                name="fecha"
                value={formValues.fecha}
                onChange={handleChange}
                fullWidth
                error={Boolean(errors?.fecha)}
                helperText={errors?.fecha || ''}
                margin="normal"
                disabled
                type="date"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Número Asiento"
                name="numero_asiento"
                value={formValues.numero_asiento}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Descripción"
                name="descripcion"
                value={formValues.descripcion}
                onChange={handleChange}
                error={Boolean(errors?.descripcion)}
                helperText={errors?.descripcion || ''}
                fullWidth
                margin="normal"
                multiline
                rows={3}
              />

              <Box mt={2} mb={1} display="flex" alignItems="center" justifyContent="space-between">
                <Box component="span" sx={{ fontWeight: 600 }}>
                  Detalles
                </Box>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={addDetalle}
                  aria-label="Agregar detalle"
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {detalles.length === 0 && (
                <Box mb={2} color="text.secondary">
                  No hay líneas. Agrega detalles usando el botón +.
                </Box>
              )}

              {detalles.map((d, idx) => (
                <Grid container spacing={1} alignItems="center" key={idx} mb={1}>
                  <Grid item xs={12} sm={3}>
                    <Autocomplete
                      options={planCuentas}
                      getOptionLabel={(option: any) => `${option.codigo} - ${option.nombre}`}
                      value={planCuentas.find((p) => p.id === d.id_cuenta) || null}
                      onChange={(_, value) => {
                        setDetalle(idx, { id_cuenta: value ? value.id : null });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Cuenta"
                          placeholder="Seleccione cuenta"
                          margin="dense"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Descripción"
                      name={`detalles[${idx}].descripcion`}
                      value={d.descripcion}
                      onChange={(e) => setDetalle(idx, { descripcion: e.target.value })}
                      fullWidth
                      margin="dense"
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      label="Debe"
                      name={`detalles[${idx}].debe`}
                      value={d.debe}
                      type="number"
                      onChange={(e) => setDetalle(idx, { debe: Number(e.target.value || 0) })}
                      fullWidth
                      margin="dense"
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      label="Haber"
                      name={`detalles[${idx}].haber`}
                      value={d.haber}
                      type="number"
                      onChange={(e) => setDetalle(idx, { haber: Number(e.target.value || 0) })}
                      fullWidth
                      margin="dense"
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeDetalle(idx)}
                      aria-label="Eliminar detalle"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </>
          );
        }}
      />
    </Container>
  );
}
