import { Container } from '@/components/container';
import { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import {
  Checkbox,
  Button,
  FormControlLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Grid,
  Divider,
  TextField,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { toast } from 'sonner';

interface Permiso {
  id: number;
  nombre: string;
  descripcion?: string;
  tipos: string[]; // ['lectura', 'escritura', 'edicion']
}

interface PermisosAsignados {
  [permisoId: number]: Set<string>; // permisos asignados por tipo
}

interface Rol {
  id: number;
  nombre: string;
}

const RolesPermisosList = () => {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolId, setRolId] = useState<string>('');
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [asignados, setAsignados] = useState<PermisosAsignados>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const tiposDisponibles = ['lectura', 'escritura', 'edicion'];
  // Filtrar permisos según el término de búsqueda
  const filteredPermisos = permisos.filter((permiso) =>
    permiso.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    FetchData('roles').then(setRoles);
  }, []);

  useEffect(() => {
    if (!rolId) {
      setPermisos([]);
      setAsignados({});
      return;
    }

    // Obtener todos los permisos disponibles con tipos posibles
    FetchData('permisos_sistema_con_tipos').then((data: Permiso[]) => {
      setPermisos(data);
    });

    // Obtener permisos asignados al rol (por tipo)
    FetchData(`roles_permisos_con_tipos/${rolId}`).then(
      (data: { permiso_id: number; accion: string }[]) => {
        const asignadosMap: PermisosAsignados = {};
        data.forEach(({ permiso_id, accion }) => {
          if (!asignadosMap[permiso_id]) asignadosMap[permiso_id] = new Set();
          asignadosMap[permiso_id].add(accion);
        });
        setAsignados(asignadosMap);
      }
    );
  }, [rolId]);

  // Helper to check if all displayed permisos are fully selected
  const allSelected =
    filteredPermisos.length > 0 &&
    filteredPermisos.every((permiso) => {
      const set = asignados[permiso.id];
      return set && tiposDisponibles.every((t) => set.has(t));
    });

  const togglePermisoTipo = (permisoId: number, tipo: string) => {
    setAsignados((prev) => {
      const newAsignados = { ...prev };
      if (!newAsignados[permisoId]) newAsignados[permisoId] = new Set();

      if (newAsignados[permisoId].has(tipo)) {
        newAsignados[permisoId].delete(tipo);
        if (newAsignados[permisoId].size === 0) delete newAsignados[permisoId];
      } else {
        newAsignados[permisoId].add(tipo);
      }
      return newAsignados;
    });
  };

  const guardar = async () => {
    const payload = [];
    for (const permisoId in asignados) {
      for (const tipo of asignados[permisoId]) {
        payload.push({ permiso_id: Number(permisoId), accion: tipo });
      }
    }

    await FetchData('roles_permisos_guardar', 'POST', {
      rol_id: Number(rolId),
      asignaciones: payload
    });

    toast.success('Permisos guardados correctamente');
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Asignar Permisos por Tipo a Rol
      </Typography>

      <Select
        value={rolId}
        onChange={(e) => setRolId(e.target.value)}
        displayEmpty
        fullWidth
        sx={{ mb: 3 }}
      >
        <MenuItem value="">Seleccione un rol</MenuItem>
        {roles.map((r) => (
          <MenuItem key={r.id} value={r.id.toString()}>
            {r.nombre}
          </MenuItem>
        ))}
      </Select>
      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Seleccionar todos (visible)</Typography>
        <Checkbox
          title="Seleccionar todos los visibles"
          checked={allSelected}
          onChange={(e) => {
            const checked = e.target.checked;
            const newAsignados = { ...asignados };
            // Only toggle the currently filtered (visible) permisos
            filteredPermisos.forEach((permiso) => {
              if (checked) {
                newAsignados[permiso.id] = new Set(tiposDisponibles);
              } else {
                delete newAsignados[permiso.id];
              }
            });
            setAsignados(newAsignados);
          }}
        />
      </Box>
      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Permisos Disponibles
      </Typography>
      {/* Buscador */}
      <TextField
        variant="outlined"
        placeholder="Buscar permisos"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchTerm('')} aria-label="clear search">
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />

      <div style={{ marginBottom: '16px', maxHeight: '420px', overflowY: 'auto' }}>
        {filteredPermisos.length > 0 ? (
          <Grid container spacing={2}>
            {filteredPermisos.map((permiso) => (
              <Grid item xs={12} md={6} key={permiso.id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1">{permiso.nombre}</Typography>
                        {permiso.descripcion && (
                          <Typography variant="body2" color="text.secondary">
                            {permiso.descripcion}
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    <Box mt={1} display="flex" gap={2} flexWrap="wrap">
                      {tiposDisponibles.map((tipo) => (
                        <FormControlLabel
                          key={tipo}
                          control={
                            <Checkbox
                              checked={asignados[permiso.id]?.has(tipo) ?? false}
                              onChange={() => togglePermisoTipo(permiso.id, tipo)}
                            />
                          }
                          label={tipo}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No se encontraron permisos.
          </Typography>
        )}
      </div>

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        disabled={!rolId}
        onClick={guardar}
      >
        Guardar Permisos
      </Button>
    </Container>
  );
};

export default RolesPermisosList;
