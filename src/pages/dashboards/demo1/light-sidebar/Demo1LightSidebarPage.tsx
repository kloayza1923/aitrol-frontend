import { useEffect, useState, useMemo, useContext } from 'react';
import {
  Card,
  CircularProgress,
  TextField,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as MuiIcons from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/auth/providers/JWTProvider';
import { useGetUserMenuQuery } from '@/store/api/menuSlice';
import { HorizonAiChat } from '@/components/ai/HorizonAiChat';

type QuickModule = {
  id: string;
  title: string;
  path?: string;
  icon?: string;
};

const FAVORITES_KEY = 'quick_favorites_v1';

const Demo1LightSidebarPage = () => {
  const MENU_KEY = 'app_menu_v1';
  const auth = useContext(AuthContext);
  const { currentUser } = auth || {};
  const userId = auth?.currentUser?.id || (auth?.currentUser as any)?.user_id;
  const { data: apiMenu } = useGetUserMenuQuery(userId as number, { skip: !userId });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      void err;
      return [];
    }
  });

  useEffect(() => {
    // slight UX delay if needed
    setLoading(false);
  }, [apiMenu]);

  // Build flat list and sections (grouped by top-level menu) from menu config.
  // Expected shape in localStorage/API: array of menu items possibly with `children`.
  const menuData = useMemo(() => {
    type Section = { id: string; title: string; modules: QuickModule[] };
    const defaultModules: QuickModule[] = [
      { id: '/clientes', title: 'Clientes', path: '/clientes', icon: 'People' },
      { id: '/materiales', title: 'Materiales', path: '/materiales', icon: 'Inventory2' },
      { id: '/ventas', title: 'Ventas', path: '/ventas', icon: 'PointOfSale' },
      { id: '/empleados', title: 'Empleados', path: '/empleados', icon: 'Badge' },
      { id: '/reportes', title: 'Reportes', path: '/reportes', icon: 'Assessment' },
      { id: '/config', title: 'Configuración', path: '/config', icon: 'Settings' }
    ];

    try {
      const flat: QuickModule[] = [];
      const sectionsMap = new Map<string, Section>();

      const pushItem = (p: any, idxPath: string, topTitle?: string) => {
        const title = p.title || p.name || p.label || p.heading || p.title_menu || 'Sin título';
        const id = (p.path || p.id || title + '::' + idxPath || '').toString();
        const item: QuickModule = { id, title, path: p.path || p.url, icon: p.icon };
        flat.push(item);
        const key = topTitle || title || 'General';
        if (!sectionsMap.has(key)) {
          sectionsMap.set(key, { id: key, title: key, modules: [] });
        }
        sectionsMap.get(key)!.modules.push(item);
      };

      const walk = (items: any[], prefix = '', topTitle?: string) => {
        if (!Array.isArray(items)) return;
        items.forEach((it, i) => {
          const currentTop = topTitle || (it.children ? it.title || it.name : topTitle);
          // include the item itself (even if it has no path)
          pushItem(it, `${prefix}${i}`, currentTop);
          // recurse children; pass down topTitle if not set
          if (it.children && Array.isArray(it.children) && it.children.length > 0) {
            walk(it.children, `${prefix}${i}-`, currentTop || it.title || it.name);
          }
        });
      };

      // 1) prefer API menu (walk recursively)
      if (apiMenu && Array.isArray(apiMenu) && apiMenu.length > 0) {
        walk(apiMenu);
        const sections = Array.from(sectionsMap.values());
        return { flat, sections };
      }

      // 2) fallback to localStorage (walk parsed entries)
      const raw = localStorage.getItem(MENU_KEY);
      if (!raw)
        return {
          flat: defaultModules,
          sections: [{ id: 'General', title: 'General', modules: defaultModules }]
        };
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed))
        return {
          flat: defaultModules,
          sections: [{ id: 'General', title: 'General', modules: defaultModules }]
        };
      walk(parsed);
      const sections = Array.from(sectionsMap.values());
      return {
        flat: flat.length > 0 ? flat : defaultModules,
        sections:
          sections.length > 0
            ? sections
            : [{ id: 'General', title: 'General', modules: defaultModules }]
      };
    } catch (err) {
      void err;
      return {
        flat: defaultModules,
        sections: [{ id: 'General', title: 'General', modules: defaultModules }]
      };
    }
  }, [apiMenu]);

  const modules: QuickModule[] = menuData.flat;
  const sections = menuData.sections;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) => m.title.toLowerCase().includes(q) || (m.path || '').toLowerCase().includes(q)
    );
  }, [modules, search]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [id, ...prev].slice(0, 12);
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch (err) {
        void err;
      }
      return next;
    });
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogModule, setDialogModule] = useState<QuickModule | null>(null);
  const navigate = useNavigate();

  const openModuleDialog = (m: QuickModule) => {
    setDialogModule(m);
    setDialogOpen(true);
  };

  const closeModuleDialog = () => {
    setDialogOpen(false);
    setDialogModule(null);
  };

  const copyTitle = async () => {
    if (!dialogModule) return;
    try {
      await navigator.clipboard.writeText(dialogModule.title);
    } catch {
      // fallback: do nothing
    }
  };

  const relatedModules = (m: QuickModule) => {
    const q = m.title.toLowerCase();
    return modules.filter((x) => x.path && x.title.toLowerCase().includes(q));
  };

  const goToFirstRelated = (m: QuickModule) => {
    const rel = relatedModules(m);
    if (rel.length > 0 && rel[0].path) {
      navigate(rel[0].path as string);
      closeModuleDialog();
    }
  };

  const renderModuleCard = (m: QuickModule) => {
    const IconComp =
      m.icon && (MuiIcons as any)[m.icon]
        ? (MuiIcons as any)[m.icon]
        : (MuiIcons as any).HelpOutline;
    const isFav = favorites.includes(m.id);

    const cardContent = (
      <Card className="h-full p-4 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-lg rounded-xl transition-all duration-200 hover:scale-105 cursor-pointer bg-white/90 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500">
        <div className="relative">
          <div className="text-4xl text-blue-600 dark:text-blue-300">
            <IconComp fontSize="large" />
          </div>
          <IconButton
            size="small"
            className="absolute -top-2 -right-2 bg-white dark:bg-zinc-700 shadow-md hover:shadow-lg"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(m.id);
            }}
          >
            {isFav ? (
              <MuiIcons.Star fontSize="small" className="text-yellow-500" />
            ) : (
              <MuiIcons.StarBorder fontSize="small" className="text-gray-400" />
            )}
          </IconButton>
        </div>
        <div className="text-sm font-medium text-center text-gray-900 dark:text-white line-clamp-2">
          {m.title}
        </div>
      </Card>
    );

    return (
      <div key={m.id} className="h-full">
        {m.path ? (
          <Link to={m.path} className="no-underline h-full block">
            {cardContent}
          </Link>
        ) : (
          <div onClick={() => openModuleDialog(m)} className="h-full">
            {cardContent}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-800">
      {/* Header Section */}
      <div className="bg-white dark:bg-zinc-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            Bienvenido/a{' '}
            {currentUser
              ? `, ${currentUser.nombre_usuario || currentUser.first_name || 'Usuario'}`
              : ''}
            !
          </h1>
          <p className="text-gray-500 dark:text-white text-sm">
            Gestiona todos tus módulos desde aquí
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 pb-20">
        {/* Search & AI Chat Section */}
        <div className="mb-12 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 dark:invert-0">
              <TextField
                placeholder="Buscar módulos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff',
                    color: '#000000'
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: '#9ca3af',
                    opacity: 1
                  },
                  '& input:-webkit-autofill': {
                    WebkitBoxShadow: '0 0 0 1000px white inset',
                    WebkitTextFillColor: '#000000'
                  }
                }}
              />
            </div>
            <div className="md:w-64">
              <HorizonAiChat modules={modules} />
            </div>
          </div>
        </div>

        {/* Favorites Section */}
        {!loading && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MuiIcons.Star className="text-yellow-500" fontSize="small" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tus Favoritos</h2>
              </div>
              {favorites.length > 0 && (
                <span className="text-xs text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-700 px-3 py-1 rounded-full font-medium">
                  {favorites.length} {favorites.length === 1 ? 'favorito' : 'favoritos'}
                </span>
              )}
            </div>

            {favorites.length > 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 overflow-x-auto">
                <div className="flex gap-3 pb-2 min-w-max md:min-w-0 md:flex-wrap dark:text-white">
                  {favorites
                    .map((id) => modules.find((m) => m.id === id))
                    .filter(Boolean)
                    .map((m) => {
                      const IconComp =
                        m!.icon && (MuiIcons as any)[m!.icon]
                          ? (MuiIcons as any)[m!.icon]
                          : (MuiIcons as any).Link;

                      const content = (
                        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg transition-all duration-200 hover:shadow-md whitespace-nowrap md:whitespace-normal">
                          <div className="text-blue-600 dark:text-blue-300 flex-shrink-0">
                            <IconComp fontSize="small" />
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            {m!.title}
                          </span>
                        </div>
                      );

                      return (
                        <div key={m!.id}>
                          {m!.path ? (
                            <Link to={m!.path || '#'} className="no-underline">
                              {content}
                            </Link>
                          ) : (
                            <div
                              role="button"
                              onClick={() => openModuleDialog(m!)}
                              className="cursor-pointer"
                            >
                              {content}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                <MuiIcons.StarBorder className="text-gray-400 dark:text-white text-4xl mx-auto mb-2" />
                <p className="text-gray-700 dark:text-white font-medium">No tienes favoritos aún</p>
                <p className="text-xs text-gray-500 dark:text-white">
                  Haz click en la estrella para agregar módulos
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modules Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <CircularProgress />
          </div>
        ) : (
          <div className="space-y-10">
            {sections.map((section) => {
              const sectionItems =
                search.trim().length > 0
                  ? filtered.filter((f) => section.modules.some((s) => s.id === f.id))
                  : section.modules;
              if (!sectionItems || sectionItems.length === 0) return null;

              return (
                <div key={section.id} className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center gap-3">
                    <div className="h-1 w-8 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {section.title}
                    </h3>
                    <span className="text-xs text-gray-600 dark:text-white bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded-full font-medium">
                      {sectionItems.length}
                    </span>
                  </div>

                  {/* Section Grid */}
                  <Grid container spacing={3}>
                    {sectionItems.map((m) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={m.id}>
                        {renderModuleCard(m)}
                      </Grid>
                    ))}
                  </Grid>
                </div>
              );
            })}
          </div>
        )}

        {/* No Results Message */}
        {!loading && filtered.length === 0 && search.trim().length > 0 && (
          <div className="text-center py-12">
            <MuiIcons.SearchOff className="text-gray-300 dark:text-gray-400 text-5xl mx-auto mb-3" />
            <p className="text-gray-700 dark:text-white text-lg font-medium">
              No se encontraron módulos
            </p>
            <p className="text-gray-500 dark:text-white text-sm">
              Intenta con otro término de búsqueda
            </p>
          </div>
        )}
      </div>

      {/* Dialog for modules without direct path */}
      {dialogModule && (
        <Dialog open={dialogOpen} onClose={closeModuleDialog} fullWidth maxWidth="sm">
          <DialogTitle className="flex items-center gap-2 bg-white dark:bg-zinc-800 border-b dark:border-gray-700">
            <MuiIcons.Info fontSize="small" className="text-blue-600 dark:text-blue-300" />
            <span className="text-gray-900 dark:text-white font-medium">{dialogModule.title}</span>
          </DialogTitle>
          <DialogContent className="pt-6 dark:bg-zinc-900">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  Este módulo no tiene una ruta directa.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Módulos relacionados:
                </p>
                {relatedModules(dialogModule).length === 0 ? (
                  <div className="text-sm text-gray-700 dark:text-white text-center py-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                    No se encontraron módulos relacionados.
                  </div>
                ) : (
                  <List className="space-y-1">
                    {relatedModules(dialogModule).map((r) => (
                      <ListItem key={r.id} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            if (r.path) {
                              navigate(r.path);
                              closeModuleDialog();
                            }
                          }}
                          className="rounded-lg hover:bg-blue-50 dark:hover:bg-zinc-800"
                        >
                          <ListItemText
                            primary={r.title}
                            secondary={r.path}
                            primaryTypographyProps={{
                              className: 'font-medium text-gray-900 dark:text-white'
                            }}
                            secondaryTypographyProps={{
                              className: 'text-gray-600 dark:text-white'
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions className="border-t dark:border-gray-700 p-4 gap-2 dark:bg-zinc-900">
            <Button onClick={copyTitle} variant="outlined" size="small">
              Copiar nombre
            </Button>
            <Button
              onClick={() => goToFirstRelated(dialogModule)}
              disabled={relatedModules(dialogModule).length === 0}
              variant="contained"
              size="small"
              color="primary"
            >
              Ir al primer relacionado
            </Button>
            <Button onClick={closeModuleDialog} variant="text" size="small">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export { Demo1LightSidebarPage };
