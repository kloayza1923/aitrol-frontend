import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  LinearProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import VerifiedIcon from '@mui/icons-material/Verified';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CodeIcon from '@mui/icons-material/Code';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { FetchData } from '../../../utils/FetchData';

type SignedFile = {
  filename: string;
  size: number;
  created_at: string;
  download_url: string;
};

export default function FirmaElectronicaPage() {
  const [files, setFiles] = useState<SignedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadSignedFiles();
  }, []);

  const loadSignedFiles = async () => {
    try {
      setLoading(true);
      const response = await FetchData('firma/list', 'GET');
      setFiles(response.files || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error al cargar archivos: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setMessage(null);
    }
  };

  const handleSign = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Selecciona un archivo para firmar' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('id_empresa', '1');

      const response = await FetchData('firma/sign', 'POST', formData);

      setMessage({
        type: 'success',
        text: `Archivo firmado correctamente: ${response.signed_file}`
      });
      setSelectedFile(null);

      // Resetear input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Recargar lista
      await loadSignedFiles();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Error al firmar el archivo'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const baseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:3000';
      const downloadUrl = `${baseUrl}/firma/download/${filename}`;

      // Abrir en nueva pestaña para forzar descarga
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error al descargar: ${error.message}` });
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`¿Estás seguro de eliminar ${filename}?`)) return;

    try {
      await FetchData(`firma/delete/${filename}`, 'DELETE');
      setMessage({ type: 'success', text: 'Archivo eliminado correctamente' });
      await loadSignedFiles();
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error al eliminar: ${error.message}` });
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PictureAsPdfIcon color="error" />;
    if (ext === 'xml' || ext === 'xsd') return <CodeIcon color="primary" />;
    return <InsertDriveFileIcon color="action" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h5" gutterBottom>
            Firma Electrónica de Documentos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Firma PDFs, XMLs y otros documentos usando la firma electrónica de la empresa
          </Typography>
        </Box>

        {/* Upload Card */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <VerifiedIcon color="primary" />
                <Typography variant="h6">Firmar Documento</Typography>
              </Stack>

              {message && (
                <Alert severity={message.type} onClose={() => setMessage(null)}>
                  {message.text}
                </Alert>
              )}

              <Stack direction="row" spacing={2} alignItems="center">
                <label htmlFor="file-upload">
                  <input
                    id="file-upload"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept=".pdf,.xml,.xsd,.doc,.docx,.xlsx,.zip"
                  />
                  <Button variant="outlined" component="span" startIcon={<UploadFileIcon />}>
                    Seleccionar archivo
                  </Button>
                </label>

                {selectedFile && (
                  <Chip
                    label={selectedFile.name}
                    onDelete={() => setSelectedFile(null)}
                    color="primary"
                    variant="outlined"
                  />
                )}

                <Button
                  variant="contained"
                  onClick={handleSign}
                  disabled={!selectedFile || uploading}
                  startIcon={uploading ? <CircularProgress size={20} /> : <VerifiedIcon />}
                >
                  {uploading ? 'Firmando...' : 'Firmar'}
                </Button>
              </Stack>

              {uploading && <LinearProgress />}

              <Alert severity="info">
                <strong>Formatos soportados:</strong> PDF (firma embebida), XML (XMLDSig), otros
                archivos (firma separada .sig)
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">Documentos Firmados</Typography>
              <Button variant="text" onClick={loadSignedFiles} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Actualizar'}
              </Button>
            </Stack>

            {loading && files.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : files.length === 0 ? (
              <Alert severity="info">No hay documentos firmados todavía</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Archivo</TableCell>
                      <TableCell>Tamaño</TableCell>
                      <TableCell>Fecha de firma</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.filename}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {getFileIcon(file.filename)}
                            <Typography variant="body2">{file.filename}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>{formatDate(file.created_at)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownload(file.filename)}
                            title="Descargar"
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(file.filename)}
                            title="Eliminar"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
