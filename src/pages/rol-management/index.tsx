import { Container } from '@/components/container';
import { useNavigate } from 'react-router-dom';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { GridColDef } from '@mui/x-data-grid';
import { MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';

const PermisosSistemaList = () => {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<any[]>([]);
  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { field: 'descripcion', headerName: 'Descripción', flex: 1.5 },
    { field: 'accion', headerName: 'Acción', flex: 0.8 }, // lectura, escritura, edición
    { field: 'nombre_menu', headerName: 'Menú', flex: 1 },
    { field: 'icono_menu', headerName: 'Icono', flex: 0.8 }
  ];
  const getMenu = async () => {
    const response = await FetchData('/menu');
    setMenu(response);
  };
  useEffect(() => {
    getMenu();
  }, []);

  return (
    <Container>
      <CrudDataGrid
        title="Permisos del Sistema"
        endpoint="/permisos_sistema"
        mode="crud"
        columns={columns}
        defaultFormValues={{
          nombre: '',
          descripcion: '',
          accion: 'lectura', // Valor por defecto
          menu_id: '',
          icono_menu: ''
        }}
        renderForm={(formValues, handleChange) => (
          <div>
            <TextField
              label="Nombre"
              name="nombre"
              value={formValues.nombre}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={formValues.descripcion}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Acción"
              name="accion"
              select
              value={formValues.accion}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              <MenuItem value="lectura">Lectura</MenuItem>
              <MenuItem value="escritura">Escritura</MenuItem>
              <MenuItem value="edicion">Edición</MenuItem>
            </TextField>
            <TextField
              label="Menú"
              name="menu_id"
              select
              value={formValues.menu_id}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              <MenuItem value="">— Ninguno —</MenuItem>
              {menu.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Icono" name="icono_menu" fullWidth margin="normal" />
          </div>
        )}
        showDelete={true}
      />
    </Container>
  );
};

export default PermisosSistemaList;
