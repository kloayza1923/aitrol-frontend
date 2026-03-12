import clsx from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Paper,
  Tooltip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Collapse
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IMenuItemConfig, TMenuConfig } from '@/components/menu';
import { useMenus } from '@/providers';
import { useLocation } from 'react-router-dom';
import * as MuiIcons from '@mui/icons-material';
import { useDemo1Layout } from '../Demo1LayoutProvider';
import { useTabNavigate } from '@/hooks/useTabNavigate';
import { useResponsive } from '@/hooks';
import { Skeleton } from '@mui/material';

// eslint-disable-next-line no-unused-vars -- param required by callback signature
type IsActiveFn = (path?: string) => boolean;

/** Comprueba si el item o algún descendiente está activo */
const hasActiveInSubtree = (item: IMenuItemConfig, isActive: IsActiveFn): boolean => {
  if (item.path && isActive(item.path)) return true;
  if (item.children) return item.children.some((c) => hasActiveInSubtree(c, isActive));
  return false;
};

/** Devuelve los keys de acordeón que deben estar expandidos (path al item activo) */
const getExpandedKeysForActivePath = (
  items: TMenuConfig,
  isActive: IsActiveFn,
  prefix = ''
): Set<string> => {
  const expanded = new Set<string>();
  items.forEach((item, idx) => {
    if (item.heading || item.disabled) return;
    const key = prefix ? `${prefix}-${idx}` : `${idx}`;
    const hasChildren = item.children && item.children.length > 0;
    if (hasChildren && hasActiveInSubtree(item, isActive)) {
      expanded.add(key);
      const childKeys = getExpandedKeysForActivePath(item.children!, isActive, key);
      childKeys.forEach((k) => expanded.add(k));
    }
  });
  return expanded;
};

const SidebarMenu = () => {
  const { navigateToTab } = useTabNavigate();
  const location = useLocation();
  const [openFlyout, setOpenFlyout] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [, forceUpdate] = useState({});

  const handleItemClick = (
    item: IMenuItemConfig,
    index: number,
    event: React.MouseEvent<HTMLElement>
  ) => {
    if (item.children && item.children.length > 0) {
      // Tiene hijos - abrir flyout
      setAnchorEl(event.currentTarget);
      setOpenFlyout(index);
    } else if (item.path) {
      // No tiene hijos - soportar apertura en nueva pestaña y click derecho
      const openInNew = event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1;
      const targetEl = event.currentTarget as HTMLElement;
      const isAnchor = targetEl.tagName === 'A' || !!targetEl.getAttribute?.('href');

      if (openInNew) {
        // If this ListItemButton is rendered as an anchor let the browser handle it (right-click/context menu)
        if (isAnchor) return;
        window.open(item.path, '_blank');
        return; // keep panel state
      }

      // Regular navigation: prevent native anchor navigation and use router
      if (isAnchor) event.preventDefault();
      navigateToTab(item.path, { enableTabs: true, customTitle: item.title });
      setOpenFlyout(null);
    }
  };

  const handleCloseFlyout = () => {
    setOpenFlyout(null);
    setAnchorEl(null);
  };

  const toggleAccordion = (key: string) => {
    setExpandedAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubItemClick = (
    path?: string,
    event?: React.MouseEvent<HTMLElement>,
    itemTitle?: string
  ) => {
    if (!path) return;
    const openInNew = event
      ? event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1
      : false;
    const targetEl = event?.currentTarget as HTMLElement | undefined;
    const isAnchor = !!targetEl && (targetEl.tagName === 'A' || !!targetEl.getAttribute?.('href'));

    if (openInNew) {
      if (isAnchor) return; // let browser open via context/default
      window.open(path, '_blank');
      return; // leave panel open
    }

    if (isAnchor) event?.preventDefault();
    navigateToTab(path, { enableTabs: true, customTitle: itemTitle });
    handleCloseFlyout();
  };

  const renderMuiIcon = (iconName?: string) => {
    if (!iconName) return <MuiIcons.Circle fontSize="small" />;
    const IconComponent = (MuiIcons as any)[iconName];
    if (!IconComponent) return <MuiIcons.Circle fontSize="small" />;
    return <IconComponent fontSize="small" />;
  };

  const isActive = useCallback(
    (path?: string) => {
      if (!path) return false;
      return location.pathname === path || location.pathname.startsWith(path + '/');
    },
    [location.pathname]
  );

  const hasActiveChild = (item: IMenuItemConfig): boolean => {
    if (item.path && isActive(item.path)) return true;
    if (item.children) {
      return item.children.some((child) => hasActiveChild(child));
    }
    return false;
  };

  const renderSubmenuItems = (
    items: TMenuConfig,
    level: number = 0,
    parentKey = ''
  ): React.ReactNode => {
    return items.map((item, idx) => {
      const active = isActive(item.path);
      const hasChildren = item.children && item.children.length > 0;
      const accordionKey = parentKey ? `${parentKey}-${idx}` : `${idx}`;
      const isExpanded = expandedAccordions.has(accordionKey);

      if (item.heading && level === 0) {
        return (
          <div key={idx} className="px-4 pt-4 pb-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {item.heading}
            </div>
          </div>
        );
      }

      if (item.disabled) {
        return (
          <ListItemButton key={idx} disabled sx={{ pl: 2 + level * 2 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>{renderMuiIcon(item.icon)}</ListItemIcon>
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                variant: 'body2',
                fontSize: '0.80rem',
                sx: { fontWeight: level === 0 ? 500 : 400 }
              }}
            />
            <span className="text-xs text-gray-400 ml-2">Próximamente</span>
          </ListItemButton>
        );
      }

      if (hasChildren) {
        const childActive = hasActiveChild(item);
        return (
          <div key={idx} className={clsx(level > 0 && 'ml-2')}>
            <ListItemButton
              onClick={() => toggleAccordion(accordionKey)}
              sx={{
                pl: 2 + level * 2,
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                py: 0.75,
                '&:hover': { backgroundColor: 'action.hover' },
                ...(childActive && {
                  backgroundColor: 'action.selected',
                  '&:hover': { backgroundColor: 'action.hover' }
                })
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: childActive ? 'primary.main' : 'text.secondary'
                }}
              >
                {renderMuiIcon(item.icon)}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontSize: '0.80rem',
                  sx: { fontWeight: level === 0 ? 500 : 400 }
                }}
              />
              <MuiIcons.ExpandMore
                sx={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: 'text.secondary'
                }}
              />
            </ListItemButton>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              {item.children && renderSubmenuItems(item.children, level + 1, accordionKey)}
            </Collapse>
          </div>
        );
      }

      return (
        <ListItemButton
          key={idx}
          {...(item.path ? { component: 'a', href: item.path } : {})}
          onClick={(e) => handleSubItemClick(item.path, e, item.title)}
          onAuxClick={(e) => handleSubItemClick(item.path, e, item.title)}
          selected={active}
          sx={{
            pl: 2 + level * 2,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateX(4px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            },
            '&:active': {
              transform: 'translateX(2px) scale(0.98)'
            },
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              transform: 'translateX(4px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'translateX(6px)'
              },
              '& .MuiListItemIcon-root': {
                color: 'primary.contrastText',
                transform: 'scale(1.1)'
              }
            },
            '& .MuiListItemIcon-root': {
              transition: 'transform 0.2s ease'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: active ? 'inherit' : 'text.secondary' }}>
            {renderMuiIcon(item.icon)}
          </ListItemIcon>
          <ListItemText
            primary={item.title}
            primaryTypographyProps={{
              variant: 'body2',
              fontSize: '0.80rem',
              sx: { fontWeight: level === 0 ? 500 : 400 }
            }}
          />
        </ListItemButton>
      );
    });
  };

  const { getMenuConfig, version } = useMenus();
  const { menuLoading, layout } = useDemo1Layout();
  const desktopMode = useResponsive('up', 'lg');
  const collapsed = desktopMode ? !!layout?.options?.sidebar?.collapse : false;
  const theme = useTheme();

  // Force re-render when menu version changes (when menu is registered)
  useEffect(() => {
    forceUpdate({});
  }, [version]);

  const menuConfig = getMenuConfig('primary');

  // Inicializar acordeones expandidos al abrir el flyout (path al item activo)
  useEffect(() => {
    if (openFlyout === null || !menuConfig?.[openFlyout]?.children) return;
    const children = menuConfig[openFlyout].children!;
    setExpandedAccordions(getExpandedKeysForActivePath(children, isActive));
  }, [openFlyout, menuConfig, location.pathname, isActive]);

  // Close panel when clicking outside (but ignore clicks on the sidebar button that opened it)
  useEffect(() => {
    if (openFlyout === null) return;
    const onDocMouse = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && panelRef.current.contains(target)) return;
      if (anchorEl && anchorEl.contains(target)) return;
      handleCloseFlyout();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseFlyout();
    };
    // use capture phase to avoid immediate close from the opening click
    document.addEventListener('mousedown', onDocMouse, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouse, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [openFlyout, anchorEl]);

  // Show skeleton while loading
  if (menuLoading || !menuConfig) {
    return (
      <div className="flex flex-col h-full">
        <nav className="flex flex-col">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-20 flex items-center justify-center">
              <Skeleton variant="circular" width={40} height={40} animation="wave" />
            </div>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <nav className="flex flex-col">
        {/* Collapsed (icon-only) */}
        {collapsed ? (
          <List sx={{ py: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {menuConfig.map((item, index) => {
              if (item.heading) return null;
              const active = hasActiveChild(item);
              const hasChildrenTop = item.children && item.children.length > 0;

              return (
                <Tooltip key={index} title={item.title || ''} placement="right" arrow>
                  <ListItemButton
                    {...(item.path && !hasChildrenTop ? { component: 'a', href: item.path } : {})}
                    onClick={(e) => handleItemClick(item, index, e)}
                    onAuxClick={(e) => handleItemClick(item, index, e)}
                    selected={active}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      px: 0.5,
                      py: 1,
                      minHeight: 72,
                      width: '72px',
                      mx: '6px',
                      mb: 1.5,
                      borderRadius: 2,
                      transition: 'transform 0.12s ease, background-color 0.12s ease',
                      '&:hover': { transform: 'translateX(4px)' }
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 0.75,
                        boxShadow: active ? '0 6px 18px rgba(255,140,44,0.12)' : 'none',
                        background: active
                          ? 'linear-gradient(180deg, rgba(255,140,44,0.06), rgba(255,140,44,0.02))'
                          : 'transparent',
                        border: active ? '1px solid' : '1px solid transparent',
                        borderColor: active ? 'primary.main' : 'transparent'
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 'auto',
                          color: active ? 'primary.main' : 'text.secondary',
                          '& > *': { fontSize: 22 }
                        }}
                      >
                        {renderMuiIcon(item.icon)}
                      </ListItemIcon>
                    </Box>
                    <Box
                      sx={{
                        fontSize: 12,
                        color: active ? 'text.primary' : 'inherit',
                        textAlign: 'center'
                      }}
                    >
                      {item.title}
                    </Box>
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        ) : (
          <List sx={{ py: 1 }}>
            {menuConfig.map((item, index) => {
              if (item.heading) {
                return (
                  <div key={index} className="px-4 pt-6 pb-2">
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {item.heading}
                    </div>
                  </div>
                );
              }

              const active = hasActiveChild(item);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <ListItemButton
                  key={index}
                  {...(item.path && !hasChildren ? { component: 'a', href: item.path } : {})}
                  onClick={(e) => handleItemClick(item, index, e)}
                  onAuxClick={(e) => handleItemClick(item, index, e)}
                  selected={active}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    transition: 'all 0.18s ease',
                    justifyContent: 'flex-start',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { backgroundColor: 'primary.dark' }
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: active ? 'inherit' : 'text.secondary',
                      '& > *': { fontSize: 22 }
                    }}
                  >
                    {renderMuiIcon(item.icon)}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: {
                        fontWeight: 500,

                        fontSize: '0.80rem'
                      }
                    }}
                  />
                  {hasChildren && (
                    <MuiIcons.ChevronRight
                      sx={{
                        color: active ? 'inherit' : 'text.secondary',
                        transform: openFlyout === index ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.18s ease'
                      }}
                    />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        )}
      </nav>

      {/* Inline Panel Submenu (non-modal) */}
      {openFlyout !== null && menuConfig[openFlyout] && (
        <Paper
          ref={(el) => (panelRef.current = el)}
          elevation={8}
          sx={{
            position: 'fixed',
            top: 'calc(var(--tw-header-height) + 2px)',
            left: { xs: 0, sm: 'calc(var(--tw-sidebar-width) + 1px)' },
            width: { xs: '85%', sm: 360 },
            maxWidth: 420,
            height: '100%',
            background:
              theme.palette.mode === 'dark'
                ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
                : `linear-gradient(145deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.95) 100%)`,
            backdropFilter: 'blur(12px) saturate(150%)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            overflow: 'auto',
            transition: 'transform 200ms cubic-bezier(0.2,0,0,1)',
            zIndex: 41,
            pointerEvents: 'auto'
          }}
        >
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 animate-fadeIn">
            <div className="flex items-center gap-3">
              <Box
                sx={{ color: 'primary.main', fontSize: '1.5rem' }}
                className="animate-pulse-subtle"
              >
                {renderMuiIcon(menuConfig[openFlyout].icon)}
              </Box>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                {menuConfig[openFlyout].title}
              </h3>
            </div>
          </div>
          <List sx={{ py: 1 }}>
            {menuConfig[openFlyout].children &&
              renderSubmenuItems(menuConfig[openFlyout].children!)}
          </List>
        </Paper>
      )}
    </div>
  );
};

export { SidebarMenu };
