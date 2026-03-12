/*
    Página para gestión de documentos de empleados.
    - Subida múltiple de archivos
    - Previsualización de imágenes
    - Asignación a un empleado y tipo de documento
    Nota: Asumo un endpoint POST en "/rrhh/documentos" que acepta FormData.
*/
import React, { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Avatar,
  Chip
} from '@mui/material';
import { UploadCloud, Trash2 } from 'lucide-react';
import { FetchData } from '@/utils/FetchData';
import { useNotification } from '@/hooks';

type FileWithPreview = {
  id: string;
  file: File;
  preview?: string;
};

const DocumentManagement: React.FC = () => {
  const notification = useNotification();
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [empleadoId, setEmpleadoId] = useState<number | ''>('');
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await FetchData('/rrhh/empleados');
      setEmpleados(res || []);
    };
    load();
  }, []);

  useEffect(() => {
    // cleanup object urls on unmount
    return () => {
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const arr: FileWithPreview[] = Array.from(selected).map((f) => {
      const isImage = f.type.startsWith('image/');
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file: f,
        preview: isImage ? URL.createObjectURL(f) : undefined
      };
    });
    setFiles((prev) => [...prev, ...arr]);
  };

  const onDragOver: React.DragEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave: React.DragEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length) {
      handleFiles(dt.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const toKeep = prev.filter((p) => p.id !== id);
      const removed = prev.find((p) => p.id === id);
      if (removed && removed.preview) URL.revokeObjectURL(removed.preview);
      return toKeep;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!empleadoId) return notification.error('Seleccione un empleado');
    if (!tipoDocumento) return notification.error('Seleccione tipo de documento');
    if (files.length === 0) return notification.error('Adjunte al menos un archivo');

    setLoading(true);
    const form = new FormData();
    form.append('empleado_id', String(empleadoId));
    form.append('tipo_documento', tipoDocumento);
    if (fechaVencimiento) form.append('fecha_vencimiento', fechaVencimiento);
    if (observaciones) form.append('observaciones', observaciones);
    files.forEach((f, idx) => {
      // backend may expect files[] or archivo; using files[]
      form.append('files', f.file, f.file.name);
    });

    try {
      const res = await FetchData('/rrhh/documentos', 'POST', form);
      if (res && (res.mensaje || res.success)) {
        notification.success('Documentos subidos correctamente', res.mensaje || '');

        // clear
        files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
        setFiles([]);
        setTipoDocumento('');
        setEmpleadoId('');
        setFechaVencimiento('');
        setObservaciones('');
      } else {
        notification.error('Error al subir documentos');
      }
    } catch (err) {
      console.error(err);
      notification.error('Error al subir documentos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Documentos
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Empleado"
                select
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
              >
                <MenuItem value="">Seleccione un empleado</MenuItem>
                {empleados.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.nombres
                      ? `${emp.nombres} ${emp.apellidos || ''}`.trim()
                      : emp.nombre || emp.id}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Tipo de documento"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                placeholder="Ej: Cédula, Contrato, Certificado"
                fullWidth
              >
                <MenuItem value="">Seleccione un tipo de documento</MenuItem>
                <MenuItem value="Cedula">Cédula</MenuItem>
                <MenuItem value="Contrato">Contrato</MenuItem>
                <MenuItem value="Certificado">Certificado</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Fecha de vencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                multiline
                rows={2}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              {/* Drag & drop area styled with Tailwind */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`w-full rounded-lg border-2 transition-colors p-6 flex items-center justify-between flex-col md:flex-row gap-4 ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-dashed border-gray-300 bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-md shadow-sm">
                    <UploadCloud className="text-blue-600" />
                  </div>
                  <div>
                    <Typography className="font-medium">Arrastra y suelta archivos aquí</Typography>
                    <Typography variant="body2" color="text.secondary">
                      o haz click para seleccionar
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    id="file-input"
                    type="file"
                    accept="*/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    Seleccionar archivos
                  </Button>
                  <Typography className="text-sm text-gray-600">
                    {files.length} seleccionado(s)
                  </Typography>
                </div>
              </div>
            </Grid>

            {files.length > 0 && (
              <Grid item xs={12}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="bg-white rounded-lg shadow-sm p-3 flex items-center gap-3"
                    >
                      <div className="w-16 h-16 flex-shrink-0">
                        {f.preview ? (
                          // image preview
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={f.preview}
                            alt={f.file.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm font-semibold text-gray-700">
                            {f.file.name.split('.').pop()?.toUpperCase() || 'F'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-medium truncate">{f.file.name}</div>
                            <div className="text-xs text-gray-500">
                              {(f.file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFile(f.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Grid>
            )}

            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                sx={{ mr: 2 }}
                onClick={() => {
                  files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
                  setFiles([]);
                }}
              >
                Limpiar
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Subiendo...' : 'Subir documentos'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Box mt={2}>
        <Chip label="Tip: puede adjuntar varios archivos a la vez" />
      </Box>
    </Container>
  );
};

export default DocumentManagement;
