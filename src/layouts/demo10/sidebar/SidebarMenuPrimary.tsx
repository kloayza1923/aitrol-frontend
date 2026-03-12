import clsx from 'clsx';
import { useContext, useState, useEffect, ChangeEvent } from 'react';
import {
  IconButton,
  Menu as MuiMenu,
  MenuItem as MuiMenuItem,
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
import { KeenIcon } from '@/components/keenicons';
import {
  IMenuItemConfig,
  Menu,
  MenuArrow,
  TMenuConfig,
  MenuIcon,
  MenuItem,
  MenuLink,
  MenuSub,
  MenuTitle
} from '@/components/menu';
import { useMenus } from '@/providers';
import { AuthContext } from '@/auth/providers/JWTProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { FetchData } from '@/utils/FetchData';
import { useGetNotificationQuery } from '@/store/api/notificationSlice';
import { toAbsoluteUrl } from '@/utils';
import { Settings } from '@mui/icons-material';
import { useNotification } from '@/hooks';

const SidebarMenuPrimary = () => {
  const authContext = useContext(AuthContext);
  const notification = useNotification();
  const { settings, storeSettings } = useSettings();

  // Verificar que el contexto existe
  if (!authContext) {
    return null;
  }

  const { currentUser, logout } = authContext;

  // -------------------- STATE --------------------
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [puntosEmision, setPuntosEmision] = useState<any[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<string>(
    localStorage.getItem('sucursal') || ''
  );
  const [selectedPunto, setSelectedPunto] = useState<string>(
    localStorage.getItem('punto_emision') || ''
  );
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [configMenuAnchor, setConfigMenuAnchor] = useState<null | HTMLElement>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [readIds, setReadIds] = useState<number[]>([]);

  // Flags para evitar múltiples requests
  const [sucursalesFetched, setSucursalesFetched] = useState(false);
  const [puntosFetched, setPuntosFetched] = useState(false);

  const newItem = {
    title: 'Overview',
    description: '',
    icon: 'home-3',
    path: '/'
  };

  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');

  // Prepend the new item to the menuConfig
  //const menuConfigWithNewItem = [newItem, ...menuConfig];

  const subIndetion = ['ps-7', 'ps-2.5', 'ps-2.5'];

  // -------------------- FETCH DATA --------------------
  const getSucursales = async () => {
    if (sucursalesFetched) return;
    const resp = await FetchData('/sis/sucursal', 'GET', {}, undefined, 1000);
    if (resp) {
      setSucursales(resp);
      setSucursalesFetched(true);
    }
  };

  const getPuntosEmision = async () => {
    if (puntosFetched) return;
    const resp = await FetchData('/sis/punto_emision', 'GET', {}, undefined, 1000);
    if (resp) {
      setPuntosEmision(resp);
      setPuntosFetched(true);
    }
  };

  // -------------------- EFFECTS --------------------
  useEffect(() => {
    getSucursales();
    getPuntosEmision();
  }, []);

  // Notifications from RTK Query (cached 10min by slice)
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    refetch: refetchNotifications
  } = useGetNotificationQuery();

  // Fetch unread count for badge (calls backend count endpoint)
  const fetchUnreadCount = async () => {
    try {
      const userId = currentUser?.id || (currentUser as any)?.user_id;
      if (!userId) return;
      const res = await FetchData(`/notificaciones/no-leidas/count?user_id=${userId}`);
      if (res && typeof res.unread_count === 'number') setUnreadCount(res.unread_count);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // refresh occasionally when user changes
  }, [currentUser]);

  // Detectar configuración del usuario
  useEffect(() => {
    // Eliminamos esta lógica ya que themeMode no existe en UserModel
    // La configuración del tema se maneja desde el dialog de configuración
  }, [currentUser, storeSettings]);

  // -------------------- HANDLERS --------------------
  const handleSucursalChange = (event: any) => {
    const value = event.target.value;
    setSelectedSucursal(value);
    localStorage.setItem('sucursal', value);
    notification.success('Sucursal cambiada correctamente');
  };

  const handlePuntoChange = (event: any) => {
    const value = event.target.value;
    setSelectedPunto(value);
    localStorage.setItem('punto_emision', value);
    notification.success('Punto de emisión cambiado correctamente');
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleNotifOpen = (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(e.currentTarget);
    // when opening, refetch notifications and unread count
    refetchNotifications?.();
    fetchUnreadCount();
  };
  const handleNotifClose = () => setNotifAnchor(null);

  const handleConfigMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setConfigMenuAnchor(event.currentTarget);
  };
  const handleConfigMenuClose = () => setConfigMenuAnchor(null);

  const handleConfigDialogOpen = () => {
    setConfigDialogOpen(true);
    handleConfigMenuClose();
  };
  const handleConfigDialogClose = () => setConfigDialogOpen(false);

  const handleThemeMode = (event: ChangeEvent<HTMLInputElement>) => {
    const newThemeMode = event.target.checked ? 'dark' : 'light';
    storeSettings({ themeMode: newThemeMode });
  };

  const buildMenu = (items: TMenuConfig) => {
    return items.map((item, index) => {
      if (!item.heading && !item.disabled && item.title !== 'Dashboards') {
        return buildMenuItemRoot(item, index, 0);
      }
      return null; // Ensure a return for the map
    });
  };

  const buildMenuItemRoot = (item: IMenuItemConfig, index: number, level: number) => {
    if (item.children) {
      return (
        <MenuItem key={index} toggle="accordion" trigger="click">
          <MenuLink className="gap-2.5 py-2 px-2.5 rounded-md !menu-item-hover:bg-transparent !menu-item-here:bg-transparent">
            <MenuIcon className="items-start text-gray-400 text-lg menu-item-here:text-gray-900 menu-item-show:text-gray-900 menu-link-hover:text-gray-900">
              {item.icon && <KeenIcon icon={item.icon} />}
            </MenuIcon>
            <MenuTitle className="font-medium text-sm text-gray-700 menu-item-here:text-gray-900 menu-item-show:text-gray-900 menu-link-hover:text-gray-900">
              {item.title}
            </MenuTitle>
            {buildMenuArrow()}
          </MenuLink>
          <MenuSub className={clsx('menu-accordion gap-px', subIndetion[level])}>
            {buildMenuItemChildren(item.children, index, level + 1)}
          </MenuSub>
        </MenuItem>
      );
    } else {
      return (
        <MenuItem key={index}>
          <MenuLink
            path={item.path}
            className={clsx(
              'gap-2.5 py-2 px-2.5 rounded-md menu-item-active:bg-gray-100 menu-link-hover:bg-gray-100 !menu-item-here:bg-transparent',
              subIndetion[level]
            )}
          >
            <MenuIcon className="items-start text-lg text-gray-600 menu-item-active:text-gray-900 menu-item-here:text-gray-900">
              {item.icon && <KeenIcon icon={item.icon} />}
            </MenuIcon>
            <MenuTitle className="text-sm text-gray-800 font-medium menu-item-here:text-gray-900 menu-item-active:text-gray-900 menu-link-hover:text-gray-900">
              {item.title}
            </MenuTitle>
          </MenuLink>
        </MenuItem>
      );
    }
  };

  const buildMenuItemChildren = (items: TMenuConfig, index: number, level: number = 0) => {
    return items.map((item, index) => {
      if (!item.disabled) {
        return buildMenuItemChild(item, index, level);
      }
      return null; // Ensure a return for the map
    });
  };

  const buildMenuItemChild = (item: IMenuItemConfig, index: number, level: number = 0) => {
    if (item.children) {
      return (
        <MenuItem
          key={index}
          toggle="accordion"
          trigger="click"
          className={clsx(item.collapse && 'flex-col-reverse')}
        >
          <MenuLink className="py-2 px-2.5 rounded-md border border-transparent !menu-item-here:bg-transparent">
            {item.collapse ? (
              <MenuTitle className="text-2sm text-gray-600 menu-link-hover:text-gray-900">
                <span className="hidden menu-item-show:!flex">{item.collapseTitle}</span>
                <span className="flex menu-item-show:hidden">{item.expandTitle}</span>
              </MenuTitle>
            ) : (
              <MenuTitle className="text-2sm text-gray-800 menu-item-here:text-gray-900 menu-item-show:text-gray-900 menu-link-hover:text-gray-900">
                {item.title}
              </MenuTitle>
            )}
            {buildMenuArrow()}
          </MenuLink>
          <MenuSub className={clsx('menu-accordion gap-px', !item.collapse && subIndetion[level])}>
            {buildMenuItemChildren(item.children, index, item.collapse ? level : level + 1)}
          </MenuSub>
        </MenuItem>
      );
    } else {
      return (
        <MenuItem key={index}>
          <MenuLink
            path={item.path}
            className="py-2 px-2.5 rounded-md menu-item-active:bg-gray-100 menu-link-hover:bg-gray-100"
          >
            <MenuTitle className="text-2sm text-gray-800 menu-item-active:text-gray-900 menu-link-hover:text-gray-900">
              {item.title}
            </MenuTitle>
          </MenuLink>
        </MenuItem>
      );
    }
  };

  const buildMenuArrow = () => {
    return (
      <MenuArrow className="text-gray-400 menu-item-here:text-gray-400 menu-item-show:text-gray-800 menu-link-hover:text-gray-800">
        <KeenIcon icon="down" className="text-3xs menu-item-show:hidden" />
        <KeenIcon icon="up" className="text-3xs hidden menu-item-show:inline-flex" />
      </MenuArrow>
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="mb-5">
        <h3 className="text-sm text-gray-500 uppercase ps-5 inline-block mb-3">Pages</h3>
        <Menu
          highlight={true}
          multipleExpand={false}
          className="flex flex-col w-full gap-1.5 px-3.5"
        >
          {menuConfig && buildMenu(menuConfig)}
        </Menu>
      </div>

      {/* User Section at the bottom */}
      <div className="user-section mt-auto px-3.5 pb-5">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-3">
            {/* Avatar - Always visible */}
            <div className="relative flex-shrink-0">
              <img
                className="rounded-full border-2 border-success cursor-pointer hover:border-primary transition-colors"
                src={currentUser?.pic || toAbsoluteUrl('/media/users/300_25.jpg')}
                alt="Usuario"
                style={{ width: 40, height: 40 }}
                onClick={handleUserMenuOpen}
                title={`${currentUser?.fullname || currentUser?.first_name || 'Usuario'} - ${currentUser?.email || 'email@example.com'}`}
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* User Info - Can be hidden */}
            <div className="user-info flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentUser?.fullname || currentUser?.first_name || 'Usuario'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentUser?.email || 'email@example.com'}
              </div>
            </div>

            {/* Action Buttons - Can be hidden */}
            <div className="user-actions flex gap-1">
              <IconButton
                onClick={handleNotifOpen}
                size="small"
                className="!p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Notificaciones"
              >
                <Badge badgeContent={unreadCount} color="error">
                  <KeenIcon icon="bell" className="text-gray-600 dark:text-gray-300" />
                </Badge>
              </IconButton>
              <IconButton
                onClick={handleConfigMenuOpen}
                size="small"
                className="!p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Configuración"
              >
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </IconButton>
              <IconButton
                onClick={handleUserMenuOpen}
                size="small"
                className="!p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Cerrar sesión"
              >
                <KeenIcon icon="exit-down" className="text-gray-600 dark:text-gray-300" />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Configuration Menu */}
        <MuiMenu
          anchorEl={configMenuAnchor}
          open={Boolean(configMenuAnchor)}
          onClose={handleConfigMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        >
          <MuiMenuItem onClick={handleConfigDialogOpen}>
            <KeenIcon icon="setting-2" className="mr-2" />
            Configuración
          </MuiMenuItem>
        </MuiMenu>

        {/* User Menu */}
        <MuiMenu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        >
          <MuiMenuItem
            onClick={() => {
              handleUserMenuClose();
              logout();
            }}
          >
            <KeenIcon icon="exit-down" className="mr-2" />
            Cerrar sesión
          </MuiMenuItem>
        </MuiMenu>

        {/* Notifications Popover */}
        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={handleNotifClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          PaperProps={{ className: 'w-96' }}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Notificaciones</div>
              <Button
                size="small"
                onClick={() => {
                  refetchNotifications?.();
                  fetchUnreadCount();
                }}
              >
                Actualizar
              </Button>
            </div>
            <Divider />
            <div className="max-h-80 overflow-auto mt-2">
              <List>
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 20).map((n: any) => {
                    const isRead = readIds.includes(n.id) || (n as any).leida;
                    return (
                      <div key={n.id}>
                        <ListItem
                          alignItems="flex-start"
                          className={isRead ? 'bg-white' : 'bg-blue-50'}
                        >
                          <ListItemAvatar>
                            <img
                              src={toAbsoluteUrl('/media/notifications/default.png')}
                              alt="notif"
                              className="w-10 h-10 rounded-md object-cover"
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium truncate max-w-[220px]">{n.titulo}</div>
                                <div className="text-xs text-gray-400">
                                  {new Date(n.fecha_creacion).toLocaleString()}
                                </div>
                              </div>
                            }
                            secondary={
                              <div className="text-sm text-gray-700 truncate">{n.mensaje}</div>
                            }
                          />
                          <div className="flex flex-col gap-2">
                            {!isRead && (
                              <Button
                                size="small"
                                variant="contained"
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
                                    setUnreadCount((c) => Math.max(0, c - 1));
                                  } catch (err) {
                                    notification.error('Error marcando como leída');
                                  }
                                }}
                              >
                                Marcar
                              </Button>
                            )}
                          </div>
                        </ListItem>
                        <Divider component="li" />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No hay notificaciones</div>
                )}
              </List>
            </div>
            <div className="mt-2 text-right">
              <Button
                size="small"
                onClick={() => {
                  handleNotifClose(); /* navigate to notifications page if exists */
                }}
              >
                Ver todas
              </Button>
            </div>
          </div>
        </Popover>

        {/* Configuration Dialog */}
        <Dialog open={configDialogOpen} onClose={handleConfigDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Configuración del Sistema</DialogTitle>
          <DialogContent dividers>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sucursal
                </label>
                <Select
                  value={selectedSucursal}
                  onChange={handleSucursalChange}
                  displayEmpty
                  fullWidth
                  size="small"
                >
                  <MuiMenuItem value="" disabled>
                    Seleccione Sucursal
                  </MuiMenuItem>
                  {sucursales.map((s) => (
                    <MuiMenuItem key={s.id_sucursal} value={s.id}>
                      {s.codigo} - {s.direccion}
                    </MuiMenuItem>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Punto de Emisión
                </label>
                <Select
                  value={selectedPunto}
                  onChange={handlePuntoChange}
                  displayEmpty
                  fullWidth
                  size="small"
                >
                  <MuiMenuItem value="" disabled>
                    Seleccione Punto de Emisión
                  </MuiMenuItem>
                  {puntosEmision.map((p) => (
                    <MuiMenuItem key={p.id_punto_emision} value={p.id}>
                      {p.codigo} - {p.descripcion}
                    </MuiMenuItem>
                  ))}
                </Select>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.themeMode === 'dark'}
                      onChange={handleThemeMode}
                      color="primary"
                    />
                  }
                  label="Modo oscuro"
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleConfigDialogClose} color="primary">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export { SidebarMenuPrimary };
