import { useContext, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { Container } from '@/components/container';
import { FetchData } from '@/utils/FetchData';
import { AuthContext } from '@/auth/providers/JWTProvider';

export default function UploadStockInicial() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    mensaje?: string;
    errores?: string[];
    productos?: any[];
  }>();
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [perchas, setPerchas] = useState<any[]>([]);
  const { currentUser } = useContext(AuthContext);
  const [selectedAlmacen, setSelectedAlmacen] = useState<number | null>(null);
  const [selectedPercha, setSelectedPercha] = useState<number | null>(null);

  // Descarga el formato de Excel
  const handleDownloadFormato = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = JSON.parse(localStorage.getItem('auth') || '{}');
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/inv/productos_subir/formato_stock_inicial`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.token}`
          }
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formato_stock_inicial.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Subir el archivo Excel
  const handleUpload = async () => {
    if (!file) return;
    if (!selectedAlmacen) {
      setError('Selecciona un almacén');
      return;
    }
    if (!selectedPercha) {
      setError('Selecciona una percha');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // TODO: Reemplaza estos valores por los reales del contexto
      formData.append('id_almacen', selectedAlmacen.toString());
      formData.append('id_usuario', currentUser?.id.toString() || '1');
      formData.append('percha_id', selectedPercha.toString());
      const response = await FetchData('/inv/productos_subir/stock_inicial', 'POST', formData);
      //
      const data = response;
      setResult(data);
      // Si hay productos subidos exitosamente, puedes mostrarlos aquí
      if (data.mensaje) {
        // Opcional: podrías hacer un fetch para obtener los productos subidos
        // setProductos([...]);
        setMessage(data.mensaje);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const getAlmacenes = async () => {
    try {
      const response = await FetchData('/inv/almacenes', 'GET');
      setAlmacenes(response);
    } catch (err: any) {
      setError(err.message);
    }
  };
  const getPerchas = async (almacenId: number) => {
    try {
      const response = await FetchData('/inv/perchas', 'GET', { almacen_id: almacenId });
      setPerchas(response);
    } catch (err: any) {
      setError(err.message);
    }
  };
  useEffect(() => {
    getAlmacenes();
  }, []);
  useEffect(() => {
    if (almacenes.length > 0) {
      getPerchas(almacenes[0].id);
    }
  }, [almacenes]);

  return (
    <Container>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Subir Inventario Inicial
        </Typography>
        <Typography variant="body1" gutterBottom>
          Descarga el formato de Excel, ingresa los números de serie y súbelo para registrar el
          inventario inicial.
        </Typography>
        <Box display="flex" gap={2} mb={2}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<DownloadIcon />}
            onClick={handleDownloadFormato}
            disabled={loading}
          >
            Descargar Formato
          </Button>
          <Button
            variant="contained"
            component="label"
            fullWidth
            startIcon={<CloudUploadIcon />}
            disabled={loading}
          >
            Seleccionar archivo
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
              }}
            />
          </Button>
          <TextField
            label="Almacén"
            select
            fullWidth
            value={selectedAlmacen}
            variant="outlined"
            onChange={(e) => {
              const selectedId = Number(e.target.value);
              setSelectedAlmacen(selectedId);
              getPerchas(selectedId);
            }}
          >
            {almacenes.map((almacen) => (
              <MenuItem key={almacen.id} value={almacen.id}>
                {almacen.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Percha"
            select
            fullWidth
            value={selectedPercha}
            variant="outlined"
            onChange={(e) => {
              const selectedId = Number(e.target.value);
              setSelectedPercha(selectedId);
            }}
          >
            {perchas.map((percha) => (
              <MenuItem key={percha.id} value={percha.id}>
                {percha.nombre}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={handleUpload}
            disabled={!file || loading}
          >
            Subir Excel
          </Button>
        </Box>
        {file && (
          <Typography variant="body2" color="textSecondary" mb={2}>
            Archivo seleccionado: {file.name}
          </Typography>
        )}
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {result?.errores && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Errores:</Typography>
            <ul>
              {result.errores.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </Alert>
        )}
        {result?.mensaje && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {result.mensaje}
          </Alert>
        )}
      </Paper>
      {/* Tabla de productos subidos exitosamente (opcional, si el backend lo retorna) */}
    </Container>
  );
}
