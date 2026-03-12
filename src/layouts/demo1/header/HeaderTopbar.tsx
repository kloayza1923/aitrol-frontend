import React, { useContext, useState, useEffect, useCallback, ChangeEvent } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import { AuthContext } from '@/auth/providers/JWTProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { FetchData } from '@/utils/FetchData';
import { toAbsoluteUrl } from '@/utils';
import * as MuiIcons from '@mui/icons-material';
import { useGetNotificationQuery, useGetUnreadCountQuery } from '@/store/api/notificationSlice';
import { ThemeSelector } from '@/components/theme-selector';
import { useNotification } from '@/hooks';

const HeaderTopbar = () => {
  const authContext = useContext(AuthContext);
  const notification = useNotification();
  const currentUser = authContext?.currentUser;
  const logout = authContext?.logout;
  const { settings, storeSettings } = useSettings();

  // -------------------- STATE --------------------
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<string>(
    localStorage.getItem('sucursal') || ''
  );
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Flags para evitar múltiples requests
  const [sucursalesFetched, setSucursalesFetched] = useState(false);

  // -------------------- FETCH DATA --------------------
  const getSucursales = useCallback(async () => {
    if (sucursalesFetched) return;
    // 1) Preferir sucursales desde currentUser
    try {
      const fromUser = (currentUser as any)?.sucursales;
      if (fromUser && Array.isArray(fromUser) && fromUser.length > 0) {
        setSucursales(fromUser);
        try {
          localStorage.setItem('sucursales', JSON.stringify(fromUser));
        } catch {
          // ignore
        }
        setSucursalesFetched(true);
        return;
      }
    } catch {
      // ignore
    }

    // 2) Intentar caché en localStorage
    try {
      const cached = localStorage.getItem('sucursales');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSucursales(parsed);
          setSucursalesFetched(true);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }

    // 3) Fallback: pedir al API (si todo lo anterior falla)
    try {
      const resp = await FetchData('/sis/sucursal', 'GET', {}, undefined, 1000);
      if (resp) {
        setSucursales(resp);
        try {
          localStorage.setItem('sucursales', JSON.stringify(resp));
        } catch {
          // ignore
        }
        setSucursalesFetched(true);
      }
    } catch {
      // ignore
    }
  }, [currentUser, sucursalesFetched]);

  const { data: notifications = [], refetch: refetchNotifications } = useGetNotificationQuery();

  const { data: unreadData, refetch: fetchUnreadCount } = useGetUnreadCountQuery(
    {
      user_id: currentUser?.id || (currentUser as any)?.user_id
    },
    { skip: !currentUser }
  );

  // -------------------- EFFECTS --------------------
  useEffect(() => {
    getSucursales();
  }, [getSucursales]);

  // Detectar configuración del usuario
  useEffect(() => {
    if ((currentUser as any)?.themeMode) {
      storeSettings({ themeMode: (currentUser as any).themeMode }); // 'dark' o 'light'
    }
  }, [currentUser, storeSettings]);

  // -------------------- HANDLERS --------------------
  const handleSucursalChange = (event: any) => {
    const value = event.target.value;
    setSelectedSucursal(value);
    localStorage.setItem('sucursal', value);
    notification.success('Sucursal cambiada correctamente');
  };

  const handleNotifOpen = (e: any) => {
    setNotifAnchor(e.currentTarget);
    refetchNotifications?.();
    fetchUnreadCount();
  };
  const handleNotifClose = () => setNotifAnchor(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) =>
    setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleConfigDialogOpen = () => {
    setConfigDialogOpen(true);
  };
  const handleConfigDialogClose = () => setConfigDialogOpen(false);

  const handleThemeMode = (event: ChangeEvent<HTMLInputElement>) => {
    const newThemeMode = event.target.checked ? 'dark' : 'light';
    storeSettings({ themeMode: newThemeMode });
  };
  return (
    <div className="flex items-center gap-2">
      {/* Notificaciones */}
      <IconButton
        onClick={handleNotifOpen}
        size="small"
        sx={{
          padding: '8px',
          borderRadius: '10px',
          backgroundColor: 'action.hover',
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: 'action.selected',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }
        }}
        title="Notificaciones"
      >
        <Badge
          badgeContent={unreadData?.unreadCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.65rem',
              height: '18px',
              minWidth: '18px',
              fontWeight: 700
            }
          }}
        >
          <MuiIcons.Notifications sx={{ color: 'text.primary', fontSize: '1.3rem' }} />
        </Badge>
      </IconButton>

      {/* Configuración */}
      <IconButton
        onClick={handleConfigDialogOpen}
        size="small"
        sx={{
          padding: '8px',
          borderRadius: '10px',
          backgroundColor: 'action.hover',
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: 'action.selected',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }
        }}
        title="Configuración"
      >
        <MuiIcons.Settings sx={{ color: 'text.primary', fontSize: '1.3rem' }} />
      </IconButton>

      <Dialog
        open={configDialogOpen}
        onClose={handleConfigDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'config-dialog',
          sx: {
            borderRadius: 4,
            backgroundImage: 'none',
            background: settings.themeMode === 'dark' ? '#121212' : '#ffffff',
            boxShadow:
              settings.themeMode === 'dark'
                ? '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 25px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)'
          }
        }}
      >
        <DialogTitle
          sx={{
            py: 3,
            px: 4,
            borderBottom: `1px solid ${settings.themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2.5
          }}
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
            <MuiIcons.Settings sx={{ fontSize: '1.75rem', color: 'primary.main' }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white m-0 tracking-tight">
              Preferencias del Sistema
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium m-0 mt-1">
              Personaliza tu espacio de trabajo
            </p>
          </div>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 4, backgroundColor: settings.themeMode === 'dark' ? '#121212' : '#fafafa' }}>
          <div className="flex flex-col gap-6">

            {/* Card Sucursal */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <MuiIcons.Storefront sx={{ fontSize: '1.25rem' }} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 m-0 text-[15px]">Sucursal Activa</h4>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 m-0 mt-0.5">Establecimiento para operaciones</p>
                </div>
              </div>
              <Select
                value={selectedSucursal}
                onChange={handleSucursalChange}
                displayEmpty
                fullWidth
                size="medium"
                sx={{
                  backgroundColor: settings.themeMode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                  borderRadius: 2.5,
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid',
                    borderColor: settings.themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  },
                  '& .MuiSelect-select': {
                    py: 1.5
                  }
                }}
              >
                <MenuItem value="" disabled>Seleccione una sucursal</MenuItem>
                {sucursales.map((s) => {
                  const id = s.id || s.id_sucursal;
                  return (
                    <MenuItem key={id} value={id} sx={{ py: 1.5, borderRadius: 1, mx: 1 }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <MuiIcons.Business sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        </div>
                        <span className="font-medium text-sm">{s.codigo} - {s.direccion}</span>
                      </div>
                    </MenuItem>
                  );
                })}
              </Select>
            </div>

            {/* Card Apariencia */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                  <MuiIcons.Palette sx={{ fontSize: '1.25rem' }} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 m-0 text-[15px]">Apariencia Visual</h4>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 m-0 mt-0.5">Adapta la interfaz a tu gusto</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#121212] rounded-xl border border-gray-100 dark:border-white/5 mb-4 group hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1a1a] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5">
                    {settings.themeMode === 'dark' ? (
                      <MuiIcons.DarkMode sx={{ fontSize: '1.1rem', color: '#818cf8' }} />
                    ) : (
                      <MuiIcons.LightMode sx={{ fontSize: '1.1rem', color: '#fbbf24' }} />
                    )}
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 m-0 text-sm">Modo {settings.themeMode === 'dark' ? 'Oscuro' : 'Claro'}</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 m-0 mt-0.5">Reduce la fatiga visual</p>
                  </div>
                </div>
                <Switch
                  checked={settings.themeMode === 'dark'}
                  onChange={handleThemeMode}
                  color="primary"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'primary.main' }
                  }}
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-[#121212] rounded-xl border border-gray-100 dark:border-white/5 group hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1a1a] flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5">
                    <MuiIcons.FormatColorFill sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 m-0 text-sm">Color de Acento</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 m-0 mt-0.5">Selecciona el color principal</p>
                  </div>
                </div>
                <div className="mt-2 pl-1">
                  <ThemeSelector />
                </div>
              </div>
            </div>

          </div>
        </DialogContent>
        <DialogActions
          sx={{
            px: 4,
            py: 2.5,
            borderTop: `1px solid ${settings.themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            backgroundColor: settings.themeMode === 'dark' ? '#121212' : '#ffffff'
          }}
        >
          <Button
            onClick={handleConfigDialogClose}
            variant="contained"
            disableElevation
            sx={{
              borderRadius: 2.5,
              px: 4,
              py: 1.25,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)',
              '&:hover': {
                boxShadow: '0 6px 16px 0 rgba(0,0,0,0.1)'
              }
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Avatar del Usuario */}
      <IconButton
        onClick={handleUserMenuOpen}
        sx={{
          padding: '2px',
          borderRadius: '50%',
          border: '3px solid',
          borderColor: 'divider',
          transition: 'all 0.3s',
          '&:hover': {
            borderColor: 'primary.main',
            transform: 'scale(1.05)',
            boxShadow: 3
          }
        }}
      >
        <img
          className="rounded-full"
          src={currentUser?.foto || toAbsoluteUrl('/media/users/300_25.jpg')}
          alt="Usuario"
          style={{
            width: 40,
            height: 40,
            objectFit: 'cover'
          }}
        />
      </IconButton>

      {/* Popover de Notificaciones */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={handleNotifClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 400,
            maxWidth: '90vw',
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            mt: 1
          }
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100">Notificaciones</div>
            <Button
              size="small"
              onClick={() => {
                refetchNotifications?.();
                fetchUnreadCount();
              }}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontSize: '0.75rem'
              }}
              startIcon={<MuiIcons.Refresh fontSize="small" />}
            >
              Actualizar
            </Button>
          </div>
          <Divider />
          <div className="max-h-96 overflow-auto mt-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <List sx={{ p: 0 }}>
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 20).map((n: any) => {
                  const isRead = readIds.includes(n.id) || (n as any).leida;
                  return (
                    <div key={n.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          backgroundColor: isRead ? 'transparent' : 'rgba(128, 128, 128, 0.08)',
                          borderRadius: 2,
                          mb: 0.5,
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: isRead
                              ? 'rgba(0, 0, 0, 0.02)'
                              : 'rgba(128, 128, 128, 0.12)'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center shadow-md">
                            <MuiIcons.Notifications sx={{ color: 'white', fontSize: '1.5rem' }} />
                          </div>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 flex-1">
                                {n.titulo}
                              </div>
                              <div className="text-xs text-gray-400 whitespace-nowrap">
                                {new Date(n.fecha_creacion).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </div>
                            </div>
                          }
                          secondary={
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                              {n.mensaje}
                            </div>
                          }
                        />
                        <div className="flex flex-col items-center ml-2">
                          {!isRead && (
                            <IconButton
                              size="small"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const userId = currentUser?.id || (currentUser as any)?.user_id;
                                if (!userId) return notification.error('Usuario no identificado');
                                try {
                                  await FetchData(
                                    `/notificaciones/${n.id}/leer?user_id=${userId}`,
                                    'POST'
                                  );
                                  setReadIds((prev) => [...prev, n.id]);
                                } catch (error) {
                                  notification.error('Error marcando como leída');
                                }
                              }}
                              sx={{
                                backgroundColor: 'primary.main',
                                color: 'white',
                                width: 28,
                                height: 28,
                                '&:hover': {
                                  backgroundColor: 'primary.dark'
                                }
                              }}
                            >
                              <MuiIcons.CheckOutlined sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          )}
                        </div>
                      </ListItem>
                      <Divider component="li" sx={{ my: 0.5 }} />
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <MuiIcons.NotificationsNone sx={{ fontSize: '3rem', color: 'gray', mb: 2 }} />
                  <div className="text-sm text-gray-500">No hay notificaciones</div>
                </div>
              )}
            </List>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-center">
            <Button
              size="small"
              onClick={() => {
                handleNotifClose();
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 600
              }}
              fullWidth
              variant="outlined"
            >
              Ver todas las notificaciones
            </Button>
          </div>
        </div>
      </Popover>

      {/* Menú de Usuario */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            mt: 1
          }
        }}
      >
        <MenuItem
          onClick={() => {
            handleUserMenuClose();
            logout?.();
          }}
          sx={{
            py: 1.5,
            px: 2,
            borderRadius: 1.5,
            mx: 1,
            '&:hover': {
              backgroundColor: 'error.light',
              color: 'white'
            }
          }}
        >
          <MuiIcons.Logout sx={{ mr: 1.5, fontSize: '1.2rem' }} />
          Cerrar sesión
        </MenuItem>
      </Menu>
    </div>
  );
};

export { HeaderTopbar };
