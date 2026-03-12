import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { useTabNavigate } from '@/hooks';
import Modal from '@mui/material/Modal';
import { Box, IconButton, Tooltip } from '@mui/material';
import { FetchData } from '@/utils/FetchData';
import { toast } from 'sonner';
import { ShareIcon, Truck } from 'lucide-react';
import { EditNote, ShareOutlined } from '@mui/icons-material';

const OrderManual = () => {
  const navigate = useNavigate();
  const { navigateToTab } = useTabNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareId, setShareId] = useState<number | null>(null);
  const [telefono, setTelefono] = useState('');
  const [validoHasta, setValidoHasta] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  const handleOpenShare = (row: any) => {
    console.log('Compartir orden:', row);
    setShareId(row.id);
    setShareOpen(true);
    setShareUrl('');
    setTelefono('');
    setValidoHasta('');
  };

  const handleCloseShare = () => setShareOpen(false);

  const get_url = async () => {
    if (!telefono) {
      toast.error('Debe ingresar un número de teléfono');
      return;
    }
    if (!validoHasta) {
      toast.error('Debe ingresar una fecha válida');
      return;
    }
    if (!shareId) {
      toast.error('ID de orden inválido');
      return;
    }
    const response = await FetchData('ordenes_compartir/' + shareId, 'POST', {
      id: shareId,
      telefono: telefono,
      valido_hasta: new Date(validoHasta).toISOString()
    });
    if (response) {
      setShareUrl(response.url);
      const message = 'Hola, te comparto esta orden de viaje manual: ' + response.url;
      window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
      toast.success('Enlace generado');
    } else {
      toast.error('Error al obtener el link');
    }
  };

  return (
    <Fragment>
      <Container>
        <CrudDataGrid
          title="Ordenes Manuales"
          columns={[
            { field: 'id', headerName: 'Orden #', width: 120 },
            { field: 'cliente_nombre', headerName: 'Cliente', flex: 1 },
            { field: 'usuario_nombre', headerName: 'Usuario', flex: 1 },
            { field: 'material_nombre', headerName: 'Material', flex: 1 },
            { field: 'puerto_salida_nombre', headerName: 'Puerto Origen', flex: 1 },
            { field: 'puerto_destino_nombre', headerName: 'Puerto Destino', flex: 1 },
            { field: 'total', headerName: 'Total', width: 100 },
            { field: 'peso_total', headerName: 'Peso Total', width: 120 },
            { field: 'vehiculos_totales', headerName: 'Vehículos', width: 100 },
            { field: 'fecha', headerName: 'Fecha', width: 120 },
            { field: 'hora_salida', headerName: 'Hora Salida', width: 120 }
          ]}
          mode="redirect"
          endpoint="/ordenes_manual"
          onEditClick={({ id }) =>
            navigateToTab(`/order-manual-edit/${id}`, { customTitle: 'Editar Orden Manual' })
          }
          onCreateClick={() => navigate('/order-manual-add')}
          buttons={(row) => (
            <>
              <Tooltip title="Gestionar Viajes" arrow>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/order-manual-trips/${row.id}`)}
                  sx={{
                    color: 'success.main',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: 'success.dark',
                      bgcolor: 'success.lighter',
                      transform: 'scale(1.1)',
                      boxShadow: 2
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    }
                  }}
                >
                  <Truck size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Compartir" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleOpenShare(row)}
                  sx={{
                    color: 'secondary.main',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: 'secondary.dark',
                      bgcolor: 'secondary.lighter',
                      transform: 'scale(1.1)',
                      boxShadow: 2
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    }
                  }}
                >
                  <ShareOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Editar orden" arrow>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/order-manual-edit/${row.id}`)}
                  sx={{
                    color: 'warning.main',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: 'warning.dark',
                      bgcolor: 'warning.lighter',
                      transform: 'scale(1.1) rotate(5deg)',
                      boxShadow: 2
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    }
                  }}
                >
                  <EditNote fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          showEdit={true}
        />
        <Modal
          open={shareOpen}
          onClose={handleCloseShare}
          aria-labelledby="modal-compartir-title"
          aria-describedby="modal-compartir-desc"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 480 },
              maxWidth: 500,
              bgcolor: 'background.paper',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <ShareIcon className="w-6 h-6 text-white" />
                </div>
                <h2 id="modal-compartir-title" className="text-xl font-semibold text-white">
                  Compartir Orden Manual #{shareId}
                </h2>
              </div>
              <button
                onClick={handleCloseShare}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+593 999 999 999"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Válido hasta</label>
                <input
                  value={validoHasta}
                  onChange={(e) => setValidoHasta(e.target.value)}
                  type="datetime-local"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {shareUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-green-800 mb-2">
                    ✓ Link generado exitosamente
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm text-gray-700"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        toast.success('Link copiado al portapapeles');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
              <button
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                onClick={handleCloseShare}
              >
                Cancelar
              </button>
              <button
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm flex items-center gap-2"
                onClick={() => get_url()}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Enviar por WhatsApp
              </button>
            </div>
          </Box>
        </Modal>
      </Container>
    </Fragment>
  );
};

export { OrderManual };
