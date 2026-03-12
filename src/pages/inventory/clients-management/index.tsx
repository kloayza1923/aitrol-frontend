import { useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { Chip, MenuItem, TextField, Tooltip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { clientsSchema } from '@/validations/InventoryValidation';
import { FetchData } from '@/utils/FetchData';
import { useAuthContext } from '@/auth';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Client = {
  id?: number;
  nombre: string;
  identificacion: string;
  direccion: string;
  telefono: string;
  email: string;
  contribuyente_especial?: string;
  obligado_contabilidad?: string;
  tipo_identificacion?: string;
  lista_precio_id?: number | null;
  lista_precio_nombre?: string;
};

interface ListaPrecio {
  id: number;
  nombre: string;
  descuento_global: number;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const tiposIdentificacion = [
  { value: '04', label: 'RUC' },
  { value: '05', label: 'CÉDULA' },
  { value: '06', label: 'PASAPORTE' },
  { value: '07', label: 'VENTA A CONSUMIDOR FINAL' },
  { value: '08', label: 'IDENTIFICACIÓN DEL EXTERIOR' }
];

const opcionesObligado = [
  { value: 'SI', label: 'SI' },
  { value: 'NO', label: 'NO' }
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ClientsList() {
  const [listasPrecios, setListasPrecios] = useState<ListaPrecio[]>([]);
  const { currentUser } = useAuthContext();
  const sucursal = (currentUser as any)?.id_sucursal;

  // Cargar listas de precio al montar (para el selector del formulario)
  useEffect(() => {
    const loadListas = async () => {
      try {
        const data = await FetchData('/inv/listas-precio', 'GET', { id_sucursal: sucursal });
        setListasPrecios(data || []);
      } catch {
        // No bloquea la carga de clientes si falla
      }
    };
    loadListas();
  }, [sucursal]);

  // ── Columnas del grid ──────────────────────────────────────────────────────
  const columns: GridColDef[] = [
    { field: 'nombre',         headerName: 'Nombre',         flex: 1.2, minWidth: 150 },
    { field: 'identificacion', headerName: 'Identificación', flex: 1,   minWidth: 130 },
    { field: 'direccion',      headerName: 'Dirección',      flex: 1.5, minWidth: 180 },
    { field: 'telefono',       headerName: 'Teléfono',       flex: 0.8, minWidth: 110 },
    { field: 'email',          headerName: 'Email',          flex: 1.2, minWidth: 150 },
    {
      field: 'lista_precio_nombre',
      headerName: 'Lista de Precio',
      flex: 1,
      minWidth: 150,
      renderCell: (params) =>
        params.value ? (
          <Tooltip title={`Lista asignada: ${params.value}`}>
            <Chip
              label={params.value}
              size="small"
              color="success"
              variant="outlined"
              sx={{ maxWidth: 140 }}
            />
          </Tooltip>
        ) : (
          <span style={{ color: '#bdbdbd', fontSize: '0.75rem' }}>—</span>
        )
    }
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Container>
      <CrudDataGrid<Client>
        title="Clientes"
        endpoint="/inv/clientes"
        mode="crud"
        columns={columns}
        schema={clientsSchema}
        defaultFormValues={{
          nombre: '',
          identificacion: '',
          direccion: '',
          telefono: '',
          email: '',
          contribuyente_especial: '',
          obligado_contabilidad: '',
          tipo_identificacion: '',
          lista_precio_id: null
        }}
        renderForm={(formValues, handleChange, setFormValues, errors) => (
          <>
            {/* ── Datos principales ─────────────────────────────────────── */}
            <TextField
              label="Nombre *"
              name="nombre"
              value={formValues.nombre}
              onChange={handleChange}
              error={Boolean(errors?.nombre)}
              helperText={errors?.nombre || ''}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Identificación *"
              name="identificacion"
              value={formValues.identificacion}
              onChange={handleChange}
              error={Boolean(errors?.identificacion)}
              helperText={errors?.identificacion || 'RUC / Cédula / Pasaporte'}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Tipo de Identificación"
              name="tipo_identificacion"
              value={formValues.tipo_identificacion || ''}
              onChange={handleChange}
              error={Boolean(errors?.tipo_identificacion)}
              helperText={errors?.tipo_identificacion || ''}
              fullWidth
              margin="normal"
              select
            >
              <MenuItem value="">Seleccione un tipo</MenuItem>
              {tiposIdentificacion.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Dirección *"
              name="direccion"
              value={formValues.direccion}
              onChange={handleChange}
              error={Boolean(errors?.direccion)}
              helperText={errors?.direccion || ''}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Teléfono *"
              name="telefono"
              value={formValues.telefono}
              onChange={handleChange}
              error={Boolean(errors?.telefono)}
              helperText={errors?.telefono || ''}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Email *"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              error={Boolean(errors?.email)}
              helperText={errors?.email || ''}
              fullWidth
              margin="normal"
            />

            {/* ── Datos tributarios ─────────────────────────────────────── */}
            <TextField
              label="Contribuyente Especial"
              name="contribuyente_especial"
              value={formValues.contribuyente_especial || ''}
              onChange={handleChange}
              error={Boolean(errors?.contribuyente_especial)}
              helperText={errors?.contribuyente_especial || 'Número de resolución (opcional)'}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Obligado a llevar Contabilidad"
              name="obligado_contabilidad"
              value={formValues.obligado_contabilidad || ''}
              onChange={handleChange}
              error={Boolean(errors?.obligado_contabilidad)}
              helperText={errors?.obligado_contabilidad || ''}
              fullWidth
              margin="normal"
              select
            >
              <MenuItem value="">Seleccione...</MenuItem>
              {opcionesObligado.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </TextField>

            {/* ── Lista de precio ───────────────────────────────────────── */}
            <TextField
              label="Lista de precio"
              name="lista_precio_id"
              value={formValues.lista_precio_id ?? ''}
              onChange={(e) =>
                setFormValues((prev) => ({
                  ...prev,
                  lista_precio_id: e.target.value === '' ? null : Number(e.target.value)
                }))
              }
              error={Boolean(errors?.lista_precio_id)}
              helperText={
                errors?.lista_precio_id ||
                (listasPrecios.length === 0
                  ? 'Sin listas creadas. Créalas en Inventario → Listas de Precio.'
                  : 'Al facturar se aplican automáticamente los precios de esta lista')
              }
              fullWidth
              margin="normal"
              select
            >
              <MenuItem value="">— Sin lista de precio —</MenuItem>
              {listasPrecios.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.nombre}
                  {l.descuento_global > 0 && (
                    <span style={{ color: '#2e7d32', marginLeft: 8, fontSize: '0.8rem' }}>
                      ({l.descuento_global}% desc. global)
                    </span>
                  )}
                </MenuItem>
              ))}
            </TextField>
          </>
        )}
      />
    </Container>
  );
}
