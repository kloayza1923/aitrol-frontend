import React, { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { FetchData } from '@/utils/FetchData';

type Account = {
  id: number;
  codigo: string;
  nombre: string;
  nivel?: number;
  id_padre?: number | null;
  estado?: string;
};

export default function PlanCuentasPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<any>({
    codigo: '',
    nombre: '',
    tipo: '',
    es_movimiento: false,
    nivel: 0,
    id_padre: null,
    estado: 'Activo'
  });

  // open add dialog
  const handleOpenAdd = () => {
    setForm({
      codigo: '',
      nombre: '',
      tipo: '',
      es_movimiento: false,
      nivel: 0,
      id_padre: null,
      estado: 'Activo'
    });
    setDialogMode('add');
    setDialogOpen(true);
  };

  // open edit dialog
  const handleOpenEdit = (node: any) => {
    setForm({
      id: node.id,
      codigo: node.codigo,
      nombre: node.nombre,
      tipo: node.tipo,
      es_movimiento: node.es_movimiento,
      nivel: node.nivel,
      id_padre: node.id_padre,
      estado: node.estado
    });
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const saveForm = async () => {
    try {
      if (dialogMode === 'add') {
        await FetchData('/contabilidad/plan_cuentas', 'POST', form);
      } else {
        await FetchData(`/contabilidad/plan_cuentas/${form.id}`, 'PUT', form);
      }
      setDialogOpen(false);
      await loadAccounts();
    } catch (err) {
      console.error('Error saving plan de cuenta', err);
      // TODO: show user-friendly error
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar cuenta? Esto la marcará como Inactivo.')) return;
    try {
      await FetchData(`/contabilidad/plan_cuentas/${id}`, 'DELETE');
      await loadAccounts();
    } catch (err) {
      console.error('Error eliminando cuenta', err);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await FetchData('/contabilidad/plan_cuentas', 'GET');
      // API returns { data: [...], total }
      setAccounts(res.data || []);
    } catch (err) {
      console.error('Error loading plan de cuentas', err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }

  const buildTree = () => {
    const map = new Map<number, Account & { children: Account[] }>();
    accounts.forEach((a) => map.set(a.id, { ...a, children: [] }));

    const roots: (Account & { children: Account[] })[] = [];
    map.forEach((node) => {
      if (node.id_padre == null) {
        roots.push(node);
      } else {
        const parent = map.get(node.id_padre as number);
        if (parent) parent.children.push(node);
        else roots.push(node); // fallback
      }
    });

    // sort children by codigo
    const sortRec = (nodes: any[]) => {
      nodes.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''));
      nodes.forEach((n) => sortRec(n.children || []));
    };
    sortRec(roots);
    return roots;
  };

  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});

  const toggle = (id: number) => {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));
  };

  const renderNode = (node: Account & { children: Account[] }) => {
    const hasChildren = node.children && node.children.length > 0;
    return (
      <React.Fragment key={node.id}>
        <ListItemButton onClick={() => (hasChildren ? toggle(node.id) : undefined)}>
          <ListItemText primary={node.codigo ? `${node.codigo} - ${node.nombre}` : node.nombre} />
          {/* actions */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(node);
            }}
            aria-label="editar"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(node.id);
            }}
            aria-label="eliminar"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
          {hasChildren ? expanded[node.id] ? <ExpandLess /> : <ExpandMore /> : null}
        </ListItemButton>
        {hasChildren && (
          <Collapse in={Boolean(expanded[node.id])} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 4 }}>
              {node.children.map((c) => renderNode(c as any))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const roots = buildTree();

  return (
    <Container>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Plan de Cuentas</Typography>
        <Box>
          <Button variant="contained" onClick={handleOpenAdd} sx={{ mr: 1 }}>
            Agregar
          </Button>
          <Button variant="outlined" onClick={loadAccounts} disabled={loading}>
            Actualizar
          </Button>
        </Box>
      </Box>

      <Box bgcolor="background.paper" p={2} borderRadius={1}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {roots.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay cuentas
              </Typography>
            ) : (
              <List>{roots.map((r) => renderNode(r as any))}</List>
            )}
          </>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogMode === 'add' ? 'Agregar cuenta' : 'Editar cuenta'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              label="Código"
              fullWidth
              margin="dense"
              value={form.codigo || ''}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
            <TextField
              label="Nombre"
              fullWidth
              margin="dense"
              value={form.nombre || ''}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <TextField
              label="Tipo"
              fullWidth
              margin="dense"
              value={form.tipo || ''}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            />
            <Select
              fullWidth
              value={form.id_padre ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  id_padre: e.target.value === '' ? null : Number(e.target.value)
                })
              }
              displayEmpty
              sx={{ mt: 2 }}
            >
              <MenuItem value="">-- Sin padre --</MenuItem>
              {accounts.map((a) => (
                <MenuItem key={a.id} value={a.id}>{`${a.codigo} - ${a.nombre}`}</MenuItem>
              ))}
            </Select>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(form.es_movimiento)}
                  onChange={(e) => setForm({ ...form, es_movimiento: e.target.checked })}
                />
              }
              label="Es movimiento"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={() => saveForm()} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
export {};
