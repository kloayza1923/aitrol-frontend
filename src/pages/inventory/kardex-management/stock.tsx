import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import {
  TextField,
  MenuItem,
  Button,
  Box,
  Grid,
  Select,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { FetchData } from '@/utils/FetchData';

type StockActualItem = {
  producto_id: number | null;
  percha_nombre: string | null;
  producto_nombre: string | null;
  almacen_id: number | null;
  almacen_nombre: string | null;
  percha_id: number | null;
  stock_actual: number | null;
  codigo_barra?: string | null;
  foto?: string | null;
  id?: number;
};

export default function StockActualList() {
  const [almacenes, setAlmacenes] = useState<{ id: number; nombre: string }[]>([]);
  const [almacenId, setAlmacenId] = useState<number | ''>('');
  const [baseEndpoint, setBaseEndpoint] = useState('/inv/stock_actual');
  const [params, setParams] = useState<Record<string, any>>({});
  const [tab, setTab] = useState(0);
  const [stockItems, setStockItems] = useState<StockActualItem[]>([]);

  // Fetch almacenes para filtro
  const getAlmacenes = async () => {
    const data = await FetchData('/inv/almacenes');
    setAlmacenes(data);
  };

  useEffect(() => {
    getAlmacenes();
  }, []);

  // Fetch stock items for the product view; reload when params change
  const fetchStockItems = async () => {
    try {
      const searchParams = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => searchParams.append(k, String(v)));
      const url = searchParams.toString()
        ? `${baseEndpoint}?${searchParams.toString()}`
        : baseEndpoint;
      const data = await FetchData(url);
      console.log('Fetched stock items', data);
      setStockItems(data || []);
    } catch (err) {
      console.error('Error fetching stock items', err);
      setStockItems([]);
    }
  };

  useEffect(() => {
    // load stock items whenever filters change
    fetchStockItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const columns: GridColDef[] = [
    { field: 'producto_nombre', headerName: 'Producto', flex: 2, minWidth: 200 },
    { field: 'almacen_nombre', headerName: 'Almacén', flex: 2, minWidth: 150 },
    { field: 'percha_nombre', headerName: 'Nombre Percha', flex: 2, minWidth: 150 },
    { field: 'stock_actual', headerName: 'Stock Actual', flex: 1, minWidth: 120 }
  ];

  const filterParams = () => {
    const searchParams = new URLSearchParams();
    if (almacenId) searchParams.append('almacen_id', String(almacenId));
    setParams(Object.fromEntries(searchParams));
  };

  return (
    <Container>
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Almacén</InputLabel>
              <Select value={almacenId} onChange={(e) => setAlmacenId(e.target.value as number)}>
                <MenuItem value="">Todos</MenuItem>
                {almacenes.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ height: '100%' }}
              onClick={filterParams}
            >
              Filtrar
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              aria-label="vista stock tabs"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Tabla" />
              <Tab label="Por Producto" />
            </Tabs>
          </Grid>
        </Grid>
      </Box>

      {tab === 0 && (
        <CrudDataGrid<StockActualItem>
          title="Stock Actual"
          endpoint={baseEndpoint}
          params={params}
          mode="table"
          numericFields={[
            {
              field: 'stock_actual',
              type: 'column'
            }
          ]}
          columns={columns}
          exportToExcel
        />
      )}

      {tab === 1 && (
        <Box>
          <List>
            {stockItems.map((it) => (
              <div key={it.id ?? `${it.producto_id}-${it.percha_id}`}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar src={`${it.foto ?? undefined}`} variant="rounded">
                      {it.producto_nombre ? it.producto_nombre.charAt(0) : '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 600 }}>{it.producto_nombre}</Typography>}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          Percha: {it.percha_nombre ?? '-'}
                        </Typography>
                        {' — '}
                        <Typography component="span" variant="body2" color="text.primary">
                          Almacén: {it.almacen_nombre ?? '-'}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          Código: {it.codigo_barra ?? '-'}
                        </Typography>
                      </>
                    }
                  />

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      minWidth: 100
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>{it.stock_actual ?? 0}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stock
                    </Typography>
                  </Box>
                </ListItem>
                <Divider variant="inset" component="li" />
              </div>
            ))}
          </List>
        </Box>
      )}
    </Container>
  );
}
