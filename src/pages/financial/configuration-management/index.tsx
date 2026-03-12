import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Autocomplete
} from '@mui/material';
import { DeleteOutline, Add } from '@mui/icons-material';
import { FetchData } from '@/utils/FetchData';
import { useNotification } from '@/hooks';

type Config = {
  id?: number;
  clave?: string;
  descripcion?: string;
  cuenta_id?: number | null;
};

export default function ConfiguracionContabilidad() {
  const notification = useNotification();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await FetchData('/contabilidad/configuracion_contabilidad', 'GET');
      const raw = res?.data ?? res;
      const dataArray: Config[] = Array.isArray(raw) ? raw : [raw];
      setConfigs(dataArray);
    } catch (err) {
      console.error('Error cargando configuración contable', err);
      notification.error('Error cargando configuración');
    } finally {
      setLoading(false);
    }
  };
  const getAccounts = async () => {
    try {
      const res = await FetchData('/contabilidad/plan_cuentas', 'GET');
      const items = res.data || [];
      setAccounts(items);
      return items;
    } catch (err) {
      console.error('Error loading plan cuentas', err);
      notification.error('Error cargando plan de cuentas');
      return [];
    }
  };

  useEffect(() => {
    fetchConfig();
    getAccounts();
  }, []);

  const handleChange = (index: number, field: keyof Config, value: any) => {
    setConfigs((prev) => {
      const copy = [...prev];
      const item = { ...(copy[index] || {}) };
      if (field === 'cuenta_id')
        item.cuenta_id = value === '' || value === null ? null : Number(value);
      else item[field] = value;
      copy[index] = item;
      return copy;
    });
  };

  const handleAddRow = () => {
    setConfigs((prev) => [...prev, { clave: '', descripcion: '', cuenta_id: null }]);
  };

  const handleRemoveRow = (index: number) => {
    setConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validaciones básicas: claves únicas y no vacías
    const cleaned = configs.map((c) => ({
      clave: (c.clave || '').trim(),
      descripcion: c.descripcion,
      cuenta_id: c.cuenta_id
    }));
    const claves = cleaned.map((c) => c.clave);
    if (claves.some((k) => !k)) {
      notification.error('Todas las configuraciones deben tener una clave');
      return;
    }
    const duplicates = claves.filter((v, i) => claves.indexOf(v) !== i);
    if (duplicates.length > 0) {
      notification.error(`Claves duplicadas: ${[...new Set(duplicates)].join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      await FetchData(`/contabilidad/configuracion_contabilidad`, 'PUT', cleaned);
      notification.success('Configuraciones actualizadas');
      fetchConfig();
    } catch (err) {
      console.error('Error actualizando configuración', err);
      notification.error('Error actualizando configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Configuración de Contabilidad
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {configs.map((item, idx) => (
            <Box
              key={idx}
              sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  label="Clave"
                  value={item.clave ?? ''}
                  onChange={(e) => handleChange(idx, 'clave', e.target.value)}
                  fullWidth
                />
                {/*  <TextField
                                    label="Cuenta ID"
                                    value={item.cuenta_id ?? ''}
                                    onChange={(e) => handleChange(idx, 'cuenta_id', e.target.value)}
                                    type="number"
                                    sx={{ width: 160 }}
                                /> */}
                <Autocomplete
                  options={accounts}
                  fullWidth
                  getOptionLabel={(option: any) => `${option.codigo} - ${option.nombre}`}
                  value={accounts.find((acc) => acc.id === item.cuenta_id) || null}
                  onChange={(_, value) => {
                    handleChange(idx, 'cuenta_id', value ? value.id : null);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cuenta"
                      placeholder="Seleccione cuenta"
                      fullWidth
                    />
                  )}
                  sx={{ flexGrow: 1 }}
                />
                <IconButton
                  color="error"
                  onClick={() => handleRemoveRow(idx)}
                  aria-label="Eliminar"
                >
                  <DeleteOutline />
                </IconButton>
              </Stack>
              <TextField
                label="Descripción"
                value={item.descripcion ?? ''}
                onChange={(e) => handleChange(idx, 'descripcion', e.target.value)}
                fullWidth
                multiline
                minRows={2}
                sx={{ mt: 2 }}
              />
            </Box>
          ))}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar todas'}
            </Button>
            <Button variant="outlined" onClick={fetchConfig} disabled={loading || saving}>
              Recargar
            </Button>
            <Button variant="text" startIcon={<Add />} onClick={handleAddRow}>
              Agregar fila
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
}
