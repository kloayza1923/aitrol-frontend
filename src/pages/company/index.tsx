import React, { useEffect, useState } from 'react';
import {
  TextField,
  Switch,
  Button,
  Paper,
  Grid,
  Typography,
  Avatar,
  Box,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { FetchData } from '../../utils/FetchData';
import { useCompany } from '@/providers';

type Company = {
  id_empresa?: number;
  ruc?: string;
  razon_social?: string;
  nombre_comercial?: string | null;
  direccion_matriz?: string | null;
  contribuyente_especial?: string | null;
  obligado_contabilidad?: boolean;
  logo?: string | null;
  firma?: string | null;
  clave_firma?: string | null;
  favicon?: string | null;
};

export default function CompanyPage() {
  const [company, setCompany] = useState<Company>({});
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [firmaFile, setFirmaFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [firmaPreview, setFirmaPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { refreshCompany } = useCompany();

  useEffect(() => {
    // Fetch the list of empresas and pick the first one to edit.
    // The backend endpoint in this project is `/sis/empresa` (GET returns list).
    async function fetchCompany() {
      try {
        setLoading(true);
        const data = await FetchData('sis/empresa', 'GET');
        if (Array.isArray(data) && data.length > 0) setCompany(data[0]);
        else if (data) setCompany(data);
      } catch (err) {
        console.error('fetchCompany error', err);
        setMessage('No se pudo cargar la empresa. Revisa el backend.');
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, []);

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setLogoPreview(company.logo || null);
  }, [logoFile, company.logo]);

  useEffect(() => {
    if (firmaFile) {
      const url = URL.createObjectURL(firmaFile);
      setFirmaPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFirmaPreview(company.firma || null);
  }, [firmaFile, company.firma]);

  function handleChange<K extends keyof Company>(key: K, value: Company[K]) {
    setCompany((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!company.id_empresa) {
      setMessage('No hay empresa seleccionada para actualizar.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // 1) Update textual fields via PUT
      // The backend in this repo expects a PUT at /sis/empresa/{id_empresa}.
      // Note: backend signature may require form/query params; adjust if needed.
      const body = {
        ruc: company.ruc || '',
        razon_social: company.razon_social || '',
        nombre_comercial: company.nombre_comercial || null,
        direccion_matriz: company.direccion_matriz || null,
        contribuyente_especial: company.contribuyente_especial || null,
        obligado_contabilidad: !!company.obligado_contabilidad
      };

      await FetchData(`sis/empresa/${company.id_empresa}`, 'PUT', body);

      // 2) Upload files (logo and firma) if selected.
      // The backend in this project doesn't include upload endpoints by default.
      // We're attempting a POST to `/sis/empresa/{id}/upload` with multipart form data.
      // If your backend uses a different endpoint, adapt this path.
      if (logoFile || firmaFile) {
        const fd = new FormData();
        if (logoFile) fd.append('logo', logoFile);
        if (firmaFile) fd.append('firma', firmaFile);
        if (company.clave_firma) fd.append('clave_firma', company.clave_firma);

        try {
          await FetchData(`sis/empresa/${company.id_empresa}/upload`, 'PUT', fd);
          setMessage('Empresa actualizada correctamente.');
          // Recargar contexto global de empresa para actualizar logo en toda la app
          await refreshCompany();
        } catch (err) {
          console.warn('Upload failed:', err);
          setMessage(
            'Guardado: campos actualizados. La subida de archivos falló o el endpoint no existe.'
          );
        }
      } else {
        setMessage('Empresa actualizada correctamente.');
        // Recargar contexto global de empresa
        await refreshCompany();
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`Error al guardar: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
      <Card sx={{ width: '100%', maxWidth: 980 }} elevation={3}>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Stack>
              <Typography variant="h6">Editar Empresa</Typography>
              <Typography variant="body2" color="text.secondary">
                Actualiza la información y los archivos de la empresa
              </Typography>
            </Stack>
            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
              </Button>
            </Box>
          </Stack>

          {message && (
            <Box sx={{ mb: 2 }}>
              <Alert severity={message.includes('Error') ? 'error' : 'success'}>{message}</Alert>
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                <TextField
                  label="RUC"
                  fullWidth
                  value={company.ruc || ''}
                  onChange={(e) => handleChange('ruc', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  label="Razón social"
                  fullWidth
                  value={company.razon_social || ''}
                  onChange={(e) => handleChange('razon_social', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  label="Nombre comercial"
                  fullWidth
                  value={company.nombre_comercial || ''}
                  onChange={(e) => handleChange('nombre_comercial', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  label="Dirección matriz"
                  fullWidth
                  value={company.direccion_matriz || ''}
                  onChange={(e) => handleChange('direccion_matriz', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  label="Contribuyente especial"
                  fullWidth
                  value={company.contribuyente_especial || ''}
                  onChange={(e) => handleChange('contribuyente_especial', e.target.value)}
                  variant="outlined"
                />

                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <Switch
                    checked={!!company.obligado_contabilidad}
                    onChange={(e) => handleChange('obligado_contabilidad', e.target.checked)}
                    color="primary"
                  />
                  <Typography variant="body2">Obligado a llevar contabilidad</Typography>
                </Stack>

                <TextField
                  label="Clave firma"
                  fullWidth
                  value={company.clave_firma || ''}
                  onChange={(e) => handleChange('clave_firma', e.target.value)}
                  type="password"
                  variant="outlined"
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack spacing={2}>
                <Typography variant="subtitle1">Logo</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={logoPreview || undefined}
                    variant="rounded"
                    sx={{ width: 96, height: 96 }}
                  />
                  <Box>
                    <label htmlFor="logo-upload">
                      <input
                        accept="image/*"
                        id="logo-upload"
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
                      />
                      <Button variant="outlined" component="span" startIcon={<PhotoCamera />}>
                        Subir logo
                      </Button>
                    </label>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Resolución recomendada: 300x300 PNG/JPG
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="subtitle1">Firma electrónica</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <label htmlFor="firma-upload">
                      <input
                        accept="*/*"
                        id="firma-upload"
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => setFirmaFile(e.target.files ? e.target.files[0] : null)}
                      />
                      <Button variant="outlined" component="span">
                        Seleccionar archivo
                      </Button>
                    </label>
                    {firmaPreview && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Archivo listo para subir
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Vista previa de logo y firma antes de guardar.
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
