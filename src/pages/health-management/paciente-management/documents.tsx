/*
  Pagina para gestion de documentos de pacientes.
  - Subida multiple de archivos
  - Previsualizacion de imagenes
  - Asignacion a un paciente y tipo de documento
  Nota: Asumo un endpoint POST en "/salud/pacientes/documentos" que acepta FormData.
*/
import React, { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
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

type Paciente = {
  id: number;
  persona?: {
    nombre_completo?: string;
  };
  codigo_paciente?: string;
};

const DOCUMENT_TYPES = [
  { value: 'Cedula', label: 'Cedula de identidad' },
  { value: 'Consentimiento', label: 'Consentimiento informado' },
  { value: 'HistoriaClinica', label: 'Historia clinica' },
  { value: 'ExamenLaboratorio', label: 'Examen de laboratorio' },
  { value: 'ImagenDiagnostica', label: 'Imagen diagnostica' },
  { value: 'Receta', label: 'Receta' },
  { value: 'Referencia', label: 'Referencia' },
  { value: 'Contrarreferencia', label: 'Contrarreferencia' },
  { value: 'Alta', label: 'Alta / Epicrisis' },
  { value: 'FormularioMSP', label: 'Formulario MSP' },
  { value: 'Certificado', label: 'Certificado medico' },
  { value: 'Otro', label: 'Otro' }
];

const PatientDocuments: React.FC = () => {
  const notification = useNotification();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [pacienteId, setPacienteId] = useState<number | ''>('');
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setLoadingPacientes(true);
      try {
        const res = await FetchData<any>('/salud/pacientes', 'GET', {
          page: 1,
          limit: 50,
          search: pacienteSearch || undefined
        });
        const items = Array.isArray(res) ? res : res?.items || [];
        setPacientes(items);
      } catch (e) {
        console.error('Error buscando pacientes', e);
      } finally {
        setLoadingPacientes(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [pacienteSearch]);

  useEffect(() => {
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
    if (!pacienteId) return notification.error('Seleccione un paciente');
    if (!tipoDocumento) return notification.error('Seleccione tipo de documento');
    if (files.length === 0) return notification.error('Adjunte al menos un archivo');

    setLoading(true);
    const form = new FormData();
    form.append('paciente_id', String(pacienteId));
    form.append('tipo_documento', tipoDocumento);
    if (fechaVencimiento) form.append('fecha_vencimiento', fechaVencimiento);
    if (observaciones) form.append('observaciones', observaciones);
    files.forEach((f) => {
      form.append('files', f.file, f.file.name);
    });

    try {
      const res = await FetchData('/salud/pacientes/documentos', 'POST', form);
      if (res && (res.mensaje || res.success)) {
        notification.success('Documentos subidos correctamente', res.mensaje || '');
        files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
        setFiles([]);
        setTipoDocumento('');
        setPacienteId('');
        setSelectedPaciente(null);
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

  const getPacienteLabel = (p: Paciente) =>
    p.persona?.nombre_completo || p.codigo_paciente || String(p.id);


  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Documentos del paciente
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={pacientes}
                getOptionLabel={getPacienteLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedPaciente}
                onChange={(_, value) => {
                  setSelectedPaciente(value || null);
                  setPacienteId(value ? value.id : '');
                }}
                onInputChange={(_, value) => setPacienteSearch(value)}
                loading={loadingPacientes}
                filterOptions={(x) => x}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Paciente"
                    placeholder="Buscar paciente"
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Tipo de documento"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                placeholder="Ej: Historia clinica, Consentimiento"
                fullWidth
              >
                <MenuItem value="">Seleccione un tipo de documento</MenuItem>
                {DOCUMENT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
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
                    <Typography className="font-medium">Arrastra y suelta archivos aqui</Typography>
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

export default PatientDocuments;
