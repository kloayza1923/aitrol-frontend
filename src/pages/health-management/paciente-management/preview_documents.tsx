import React, { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import {
  Autocomplete,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Tooltip
} from '@mui/material';
import { Eye, Download } from 'lucide-react';
import { FetchData } from '@/utils/FetchData';

type Paciente = {
  id: number;
  persona?: {
    nombre_completo?: string;
  };
  codigo_paciente?: string;
};

type Documento = {
  id: number;
  tipo_documento: string;
  nombre_archivo: string;
  ruta_archivo: string;
  url_archivo?: string | null;
  fecha_vencimiento?: string | null;
  observaciones?: string | null;
};

const PreviewPacienteDocuments: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [pacienteId, setPacienteId] = useState<number | ''>('');
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Documento | null>(null);

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
    const loadDocs = async () => {
      if (!pacienteId) return setDocumentos([]);
      const res = await FetchData(`/salud/pacientes/documentos/${pacienteId}`);
      setDocumentos(res || []);
    };
    loadDocs();
  }, [pacienteId]);

  const getPacienteLabel = (p: Paciente) =>
    p.persona?.nombre_completo || p.codigo_paciente || String(p.id);

  const openPreview = (doc: Documento) => {
    setActiveDoc(doc);
    setOpen(true);
  };

  const closePreview = () => {
    setOpen(false);
    setActiveDoc(null);
  };

  const filtered = filterTipo
    ? documentos.filter((d) => d.tipo_documento === filterTipo)
    : documentos;

  const apiBase = import.meta.env.VITE_APP_API_URL || '';
  const resolveDocUrl = (doc: Documento) =>
    doc.url_archivo ? `${apiBase}${doc.url_archivo}` : `${apiBase}/storage/${doc.ruta_archivo}`;

  return (
    <Container>
      <Typography variant="h4" className="mb-4">
        Galeria de Documentos
      </Typography>

      <Paper className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <TextField {...params} label="Paciente" placeholder="Buscar paciente" size="small" />
            )}
          />

          <TextField
            select
            label="Tipo"
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            size="small"
          >
            <MenuItem value="">Todos</MenuItem>
            {[...new Set(documentos.map((d) => d.tipo_documento))].map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>

          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onClick={() => {
                setFilterTipo('');
                setDocumentos([]);
                setPacienteId('');
                setSelectedPaciente(null);
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Paper>

      <Grid container spacing={3} sx={{ overflowY: 'auto', maxHeight: '70vh' }}>
        {filtered.length === 0 ? (
          <Grid item xs={12}>
            <Paper className="p-6 text-center">
              <Typography>No hay documentos para mostrar</Typography>
            </Paper>
          </Grid>
        ) : (
          filtered.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Paper
                className="p-3 h-full hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openPreview(doc)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 flex-shrink-0">
                    {doc.nombre_archivo.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveDocUrl(doc)}
                        alt={doc.nombre_archivo}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm font-semibold text-gray-700">
                        {doc.nombre_archivo.split('.').pop()?.toUpperCase() || 'F'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <Tooltip title={doc.nombre_archivo} placement="top" arrow>
                          <div className="font-medium truncate max-w-[120px]">
                            {doc.nombre_archivo}
                          </div>
                        </Tooltip>
                        <div className="text-xs text-gray-500">
                          {doc.tipo_documento}{' '}
                          {doc.fecha_vencimiento ? `· vence: ${doc.fecha_vencimiento}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPreview(doc);
                          }}
                        >
                          <Eye size={16} />
                        </IconButton>
                        <a href={resolveDocUrl(doc)} target="_blank" rel="noreferrer" download>
                          <IconButton size="small">
                            <Download size={16} />
                          </IconButton>
                        </a>
                      </div>
                    </div>

                    {doc.observaciones && (
                      <div className="text-sm text-gray-600 mt-2 truncate">{doc.observaciones}</div>
                    )}
                  </div>
                </div>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={open} onClose={closePreview} maxWidth="lg" fullWidth>
        <DialogTitle>{activeDoc?.nombre_archivo}</DialogTitle>
        <DialogContent>
          {activeDoc ? (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                {activeDoc.nombre_archivo.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveDocUrl(activeDoc)}
                    alt={activeDoc.nombre_archivo}
                    className="w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="p-8 bg-gray-50 rounded text-center">
                    Archivo no visualizable - haga click en descargar
                  </div>
                )}
              </div>

              <div className="w-80">
                <Paper className="p-4">
                  <Typography variant="subtitle1">Detalle</Typography>
                  <div className="mt-2 text-sm text-gray-600">
                    <div>
                      <strong>Tipo:</strong> {activeDoc.tipo_documento}
                    </div>
                    <div>
                      <strong>Vencimiento:</strong> {activeDoc.fecha_vencimiento || 'N/A'}
                    </div>
                    <div>
                      <strong>Observaciones:</strong> {activeDoc.observaciones || '-'}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <a href={resolveDocUrl(activeDoc)} target="_blank" rel="noreferrer" download>
                      <Button variant="contained" startIcon={<Download />}>
                        Descargar
                      </Button>
                    </a>
                    <Button variant="outlined" onClick={closePreview}>
                      Cerrar
                    </Button>
                  </div>
                </Paper>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default PreviewPacienteDocuments;
