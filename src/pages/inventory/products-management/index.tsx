import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import {
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  CircularProgress,
  Modal,
  Paper,
  Divider,
  Stack
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import { DialogContent } from '@/components/ui/dialog';
import { productSchema } from '@/validations/InventoryValidation';

type Producto = {
  id?: number;
  categoria_id: number;
  marca_id?: number;
  nombre: string;
  descripcion?: string;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida?: string;
  estado: boolean;
  codigo: string;
  foto_principal?: File | string;
  categoria?: string;
  marca?: string;
  control_stock: number;
};

type Categoria = { id: number; nombre: string };
type Marca = { id: number; nombre: string };

type KardexMovimiento = {
  fecha: string;
  tipo: string;
  cantidad: number;
  precio_unitario: number | null;
  descripcion: string | null;
  saldo: number;
};

export default function ProductosList() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [details, setDetails] = useState<Producto | null>(null);
  const [modalData, setModalData] = useState<KardexMovimiento[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const data = await FetchData('/inv/categorias');
        setCategorias(data);
      } catch (error) {
        console.error('Error cargando categorías', error);
      }
    };
    const loadMarcas = async () => {
      try {
        const data = await FetchData('/inv/marcas');
        setMarcas(data);
      } catch (error) {
        console.error('Error cargando marcas', error);
      }
    };
    loadCategorias();
    loadMarcas();
  }, []);

  useEffect(() => {
    if (modalOpen && details?.id) {
      const loadDetails = async () => {
        try {
          setModalData(null); // resetea modalData para mostrar loader
          const data = await FetchData(`/inv/kardex/${details.id}`);
          setModalData(data);
        } catch (error) {
          console.error('Error cargando detalles del producto', error);
          setModalData([]);
        }
      };
      loadDetails();
    }
  }, [modalOpen, details]);

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 150 },
    { field: 'categoria', headerName: 'Categoría', flex: 1, minWidth: 150 },
    { field: 'marca', headerName: 'Marca', flex: 1, minWidth: 150 },
    { field: 'precio_compra', headerName: 'Precio Compra', flex: 1, minWidth: 120 },
    { field: 'precio_venta', headerName: 'Precio Venta', flex: 1, minWidth: 120 },
    { field: 'stock_actual', headerName: 'Stock Actual', flex: 1, minWidth: 120 },
    { field: 'stock_minimo', headerName: 'Stock Mínimo', flex: 1, minWidth: 120 },
    { field: 'unidad_medida', headerName: 'Unidad', flex: 1, minWidth: 100 },
    {
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => (params.value ? 'Activo' : 'Inactivo')
    },
    {
      field: 'foto_principal',
      headerName: 'Foto',
      flex: 1,
      minWidth: 150,
      renderCell: (params) =>
        params.value ? (
          <img
            src={params?.value}
            alt="Foto producto"
            style={{ width: 50, height: 45, objectFit: 'contain' }}
          />
        ) : (
          <Typography variant="caption" color="textSecondary">
            Sin foto
          </Typography>
        )
    }
  ];

  return (
    <Container>
      <CrudDataGrid<Producto>
        title="Productos"
        endpoint="/inv/productos"
        mode="crud"
        columns={columns}
        schema={productSchema}
        defaultFormValues={{
          categoria_id: 0,
          marca_id: undefined,
          nombre: '',
          descripcion: '',
          codigo: '',
          precio_compra: 0,
          precio_venta: 0,
          stock_actual: 0,
          stock_minimo: 0,
          unidad_medida: '',
          estado: true,
          foto_principal: undefined,
          control_stock: 1
        }}
        hasFile
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            {/* Categoría */}
            <TextField
              select
              label="Categoría"
              name="categoria_id"
              value={formValues.categoria_id}
              onChange={handleChange}
              error={Boolean(errors?.categoria_id)}
              helperText={errors?.categoria_id || ''}
              fullWidth
              margin="normal"
            >
              <MenuItem value={0} disabled>
                Seleccione categoría
              </MenuItem>
              {categorias.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.nombre}
                </MenuItem>
              ))}
            </TextField>

            {/* Marca */}
            <TextField
              select
              label="Marca"
              name="marca_id"
              value={formValues.marca_id ?? ''}
              error={Boolean(errors?.marca_id)}
              helperText={errors?.marca_id || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              <MenuItem value="">Sin marca</MenuItem>
              {marcas.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.nombre}
                </MenuItem>
              ))}
            </TextField>

            {/* Nombre */}
            <TextField
              label="Nombre"
              name="nombre"
              value={formValues.nombre}
              onChange={handleChange}
              error={Boolean(errors?.nombre)}
              helperText={errors?.nombre || ''}
              fullWidth
              margin="normal"
            />

            {/* Descripción */}
            <TextField
              label="Descripción"
              name="descripcion"
              value={formValues.descripcion}
              onChange={handleChange}
              error={Boolean(errors?.descripcion)}
              helperText={errors?.descripcion || ''}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />

            <TextField
              label="Código"
              name="codigo"
              value={formValues.codigo}
              onChange={handleChange}
              error={Boolean(errors?.codigo)}
              helperText={errors?.codigo || ''}
              fullWidth
              margin="normal"
            />

            {/* Precio compra */}
            <TextField
              label="Precio Compra"
              name="precio_compra"
              type="number"
              inputProps={{ step: 0.01 }}
              value={formValues.precio_compra}
              onChange={handleChange}
              error={Boolean(errors?.precio_compra)}
              helperText={errors?.precio_compra || ''}
              fullWidth
              margin="normal"
            />

            {/* Precio venta */}
            <TextField
              label="Precio Venta"
              name="precio_venta"
              type="number"
              inputProps={{ step: 0.01 }}
              value={formValues.precio_venta}
              onChange={handleChange}
              error={Boolean(errors?.precio_venta)}
              helperText={errors?.precio_venta || ''}
              fullWidth
              margin="normal"
            />

            {/* Stock actual */}
            <TextField
              label="Stock Actual"
              name="stock_actual"
              type="number"
              inputProps={{ step: 1 }}
              value={formValues.stock_actual}
              onChange={handleChange}
              error={Boolean(errors?.stock_actual)}
              helperText={errors?.stock_actual || ''}
              fullWidth
              margin="normal"
            />

            {/* Stock mínimo */}
            <TextField
              label="Stock Mínimo"
              name="stock_minimo"
              type="number"
              inputProps={{ step: 1 }}
              value={formValues.stock_minimo}
              error={Boolean(errors?.stock_minimo)}
              helperText={errors?.stock_minimo || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />

            {/* Unidad de medida */}
            <TextField
              label="Unidad de medida"
              name="unidad_medida"
              value={formValues.unidad_medida}
              onChange={handleChange}
              error={Boolean(errors?.unidad_medida)}
              helperText={errors?.unidad_medida || ''}
              fullWidth
              margin="normal"
            />

            {/* Estado */}
            <TextField
              select
              label="Estado"
              name="estado"
              value={formValues.estado ? 'true' : 'false'}
              error={Boolean(errors?.estado)}
              helperText={errors?.estado || ''}
              onChange={(e) =>
                setFormValues({
                  ...formValues,
                  estado: e.target.value === 'true'
                })
              }
              fullWidth
              margin="normal"
            >
              <MenuItem value="true">Activo</MenuItem>
              <MenuItem value="false">Inactivo</MenuItem>
            </TextField>
            <TextField
              label="Control de Stock"
              name="control_stock"
              select
              value={formValues.control_stock}
              onChange={handleChange}
              fullWidth
              error={Boolean(errors?.control_stock)}
              helperText={errors?.control_stock || ''}
              margin="normal"
            >
              <MenuItem value={1}>Controlar Stock</MenuItem>
              <MenuItem value={0}>No Controlar Stock</MenuItem>
            </TextField>

            {/* Foto principal */}
            <Box mt={2}>
              <Typography variant="subtitle1">Foto Principal</Typography>
              <input
                type="file"
                name="foto_principal"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  console.log('Archivo seleccionado:', file);
                  console.log('e.target.files:', e.target.files);
                  if (file) {
                    setFormValues({
                      ...formValues,
                      foto_principal: file
                    });
                    console.log('Foto seleccionada:', file.name);
                    setTimeout(() => {
                      console.log('formValues.foto_principal:', formValues.foto_principal);
                    }, 1000);
                  }
                }}
              />
              {formValues.foto_principal && formValues.foto_principal instanceof File && (
                <Box mt={1}>
                  <img
                    src={URL.createObjectURL(formValues.foto_principal)}
                    alt="Foto producto"
                    style={{ maxWidth: 150, maxHeight: 100, objectFit: 'contain' }}
                  />
                </Box>
              )}
            </Box>
          </>
        )}
        showDetails
        onShowDetails={(row) => {
          setDetails(row);
          setModalOpen(true);
        }}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="modal-kardex-title"
        aria-describedby="modal-kardex-description"
      >
        <Box
          sx={{
            position: 'absolute' as const,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 900 },
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          <Button
            variant="contained"
            sx={{ mb: 2 }}
            onClick={() => {
              // Lógica para generar PDF
              window.open(
                `${import.meta.env.VITE_APP_API_URL}/inv//productos_plancha_serie/pdf/${details?.id}`,
                '_blank'
              );
            }}
          >
            Generar PDF series
          </Button>
          <Typography id="modal-kardex-title" variant="h6" mb={2}>
            Kardex de producto: {details?.nombre}
          </Typography>

          {!modalData ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : modalData.length === 0 ? (
            <Typography>No hay movimientos para este producto.</Typography>
          ) : (
            <Box component="table" width="100%" sx={{ borderCollapse: 'collapse' }}>
              {/*   <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Fecha</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Tipo</th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '8px' }}>Cantidad</th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '8px' }}>Precio Unitario</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Descripción</th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '8px' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {modalData.map((mov, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{mov.fecha}</td>
                    <td style={{ padding: '8px' }}>{mov.tipo}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{mov.cantidad}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{mov.precio_unitario?.toFixed(2) ?? '-'}</td>
                    <td style={{ padding: '8px' }}>{mov.descripcion ?? '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{mov.saldo}</td>
                  </tr>
                ))}
              </tbody> */}
              <DataGrid
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 }
                  }
                }}
                sortingMode="client"
                getRowId={(row) => row.id}
                key={12121}
                rows={modalData ? modalData : []}
                columns={[
                  { field: 'id', headerName: 'ID', flex: 1 },
                  { field: 'fecha', headerName: 'Fecha', flex: 1 },
                  { field: 'tipo', headerName: 'Tipo', flex: 1 },
                  { field: 'cantidad', headerName: 'Cantidad', flex: 1, type: 'number' },
                  {
                    field: 'precio_unitario',
                    headerName: 'Precio Unitario',
                    flex: 1,
                    type: 'number'
                  },
                  { field: 'descripcion', headerName: 'Descripción', flex: 1 },
                  { field: 'saldo', headerName: 'Saldo', flex: 1, type: 'number' }
                ]}
                autoHeight
                disableSelectionOnClick
              />
            </Box>
          )}

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button variant="contained" onClick={() => setModalOpen(false)}>
              Cerrar
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
}
