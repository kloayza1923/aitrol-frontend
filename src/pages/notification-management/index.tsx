import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { MenuItem } from '@/components/menu/MenuItem';
import { FetchData } from '@/utils/FetchData';
import { cargoSchema, hierarchicalLevelSchema } from '@/validations/tthValidations';
import { notificationSchema } from '@/validations/userValidation';
import { TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

type Notificacion = {
  id?: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  fecha_creacion?: string;
  estado: string;
  ruta_archivo?: string;
  fecha_modificacion?: string;
};
const TipoNotificacionOptions = [
  { value: 'Info', label: 'Info' },
  { value: 'Alerta', label: 'Alerta' },
  { value: 'Recordatorio', label: 'Recordatorio' },
  { value: 'Promoción', label: 'Promoción' },
  { value: 'Otro', label: 'Otro' }
];
export default function NotificationManagement() {
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'tipo', headerName: 'Tipo', width: 130 },
    { field: 'titulo', headerName: 'Título', width: 200 },
    { field: 'mensaje', headerName: 'Mensaje', width: 300 },
    { field: 'fecha_creacion', headerName: 'Fecha de Creación', width: 180 },
    { field: 'estado', headerName: 'Estado', width: 130 },
    {
      field: 'ruta_archivo',
      headerName: 'Archivo',
      width: 200,
      renderCell: (params) =>
        params.value ? (
          <a href={params.value} target="_blank" rel="noopener noreferrer">
            Ver Archivo
          </a>
        ) : (
          'N/A'
        )
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Notificacion>
        title="Notificaciones"
        endpoint="/notificaciones"
        mode="crud"
        columns={columns}
        schema={notificationSchema}
        hasFile
        defaultFormValues={{ tipo: '', titulo: '', mensaje: '', estado: 'activo' }}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            <TextField
              label="Tipo"
              name="tipo"
              value={formValues.tipo}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors?.tipo}
              helperText={errors?.tipo}
              select
              InputLabelProps={{ shrink: true }}
              SelectProps={{ native: true }}
            >
              <option value="" disabled>
                Seleccione Tipo
              </option>
              {TipoNotificacionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
            <TextField
              label="Título"
              name="titulo"
              value={formValues.titulo}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              error={!!errors?.titulo}
              helperText={errors?.titulo}
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
              <option value={'Activo'}>Activo</option>
              <option value={'Archivado'}>Archivado</option>
              <option value={'Eliminada'}>Eliminada</option>
            </TextField>
            <TextField
              label="Mensaje"
              name="mensaje"
              value={formValues.mensaje}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              error={!!errors?.mensaje}
              helperText={errors?.mensaje}
            />
            {/*   <TextField
                            label="Ruta del Archivo"
                            name="ruta_archivo"
                            type='file'
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            error={!!errors?.ruta_archivo}
                            helperText={errors?.ruta_archivo}
                        /> */}
          </>
        )}
      />
    </Container>
  );
}
