import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Tabs as MUITabs,
  Tab,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  closeTab,
  setActiveTab,
  closeOtherTabs,
  closeRightTabs,
  closeAllTabs,
  refreshTab,
  TABS_CONFIG
} from '@/store/slices/tabsSlice';
import { type RootState } from '@/store';
import './TabsBar.css';

interface TabsBarProps {
  onTabChange?: (tabId: string) => void;
  inline?: boolean;
}

export const TabsBar: React.FC<TabsBarProps> = ({ onTabChange, inline = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
    tabId: string;
  } | null>(null);

  const handleTabClick = useCallback(
    (tabId: string, path: string) => {
      dispatch(setActiveTab(tabId));
      navigate(path);
      onTabChange?.(tabId);
    },
    [dispatch, navigate, onTabChange]
  );

  const handleCloseTab = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      dispatch(closeTab(tabId));
    },
    [dispatch]
  );

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      tabId
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleCloseOtherTabs = () => {
    if (contextMenu) {
      dispatch(closeOtherTabs(contextMenu.tabId));
      handleCloseContextMenu();
    }
  };

  const handleCloseRightTabs = () => {
    if (contextMenu) {
      dispatch(closeRightTabs(contextMenu.tabId));
      handleCloseContextMenu();
    }
  };

  const handleCloseAllTabs = () => {
    dispatch(closeAllTabs());
    handleCloseContextMenu();
  };

  const handleRefreshTab = useCallback(() => {
    if (activeTabId) {
      dispatch(refreshTab(activeTabId));
      // Recargar la página actual
      window.location.reload();
    }
  }, [activeTabId, dispatch]);

  return (
    <>
      <Box
        className={`tabs-bar-wrapper ${inline ? 'tabs-inline' : ''}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          minHeight: inline ? '36px' : '48px',
          width: '100%',
          borderBottom: inline ? 'none' : '1px solid',
          borderColor: inline ? 'transparent' : 'divider',
          backgroundColor: inline ? 'transparent' : 'background.paper',
          position: 'relative',
          zIndex: 100,
          px: inline ? 0 : 2
        }}
      >
        {tabs.length > 0 && (
          <MUITabs
            value={activeTabId || ''}
            onChange={(_, value) => {
              const tab = tabs.find((t) => t.id === value);
              if (tab) {
                handleTabClick(value as string, tab.path);
              }
            }}
            variant="scrollable"
            scrollButtons="auto"
            className="tabs-container"
            sx={{
              width: '100%',
              flex: 1,
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3
                }
              },
              '& .MuiTabs-flexContainer': {
                height: inline ? '36px' : '48px'
              }
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                label={
                  <Box
                    className="tab-label"
                    onContextMenu={(e) => handleContextMenu(e, tab.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: inline ? 0.5 : 1,
                      maxWidth: inline ? '150px' : '200px',
                      width: '100%',
                      '& .tab-title': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        fontSize: inline ? '0.8rem' : '0.875rem'
                      }
                    }}
                  >
                    <span className="tab-title">{tab.title}</span>
                    {tab.closable !== false && (
                      <span
                        className="tab-close-icon"
                        onClick={(e) => handleCloseTab(e, tab.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        role="button"
                        tabIndex={-1}
                      >
                        <CloseIcon sx={{ fontSize: inline ? '0.75rem' : '1rem' }} />
                      </span>
                    )}
                  </Box>
                }
                sx={{
                  minWidth: inline ? '80px' : '120px',
                  height: inline ? '36px' : '48px',
                  padding: inline ? '4px 8px' : '8px 12px',
                  textTransform: 'none',
                  fontSize: inline ? '0.8rem' : '0.875rem',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    backgroundColor: inline ? 'transparent' : 'action.selected'
                  }
                }}
              />
            ))}
          </MUITabs>
        )}

        {/* Botón de refresh para la pestaña activa */}
        {tabs.length > 0 && activeTabId && (
          <Tooltip title="Actualizar pestaña (Ctrl+R)">
            <IconButton
              size="small"
              onClick={handleRefreshTab}
              sx={{
                ml: 'auto',
                mr: inline ? 1 : 2,
                p: inline ? 0.5 : 1
              }}
              className="tab-refresh-btn"
            >
              <RefreshIcon sx={{ fontSize: inline ? '1rem' : '1.25rem' }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Contador de pestañas */}
        {TABS_CONFIG.ENABLE_LIMIT && tabs.length > 0 && (
          <Tooltip title={`${tabs.length} de ${TABS_CONFIG.MAX_TABS} pestañas`}>
            <Chip
              label={`${tabs.length}/${TABS_CONFIG.MAX_TABS}`}
              size="small"
              variant={tabs.length >= TABS_CONFIG.MAX_TABS - 1 ? 'filled' : 'outlined'}
              color={tabs.length >= TABS_CONFIG.MAX_TABS - 1 ? 'warning' : 'default'}
              sx={{
                mr: inline ? 1 : 2,
                fontWeight: 500,
                fontSize: inline ? '0.7rem' : '0.75rem'
              }}
            />
          </Tooltip>
        )}
      </Box>

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        <MenuItem onClick={handleCloseOtherTabs}>Cerrar otras pestañas</MenuItem>
        <MenuItem onClick={handleCloseRightTabs}>Cerrar pestañas a la derecha</MenuItem>
        <MenuItem onClick={handleCloseAllTabs}>Cerrar todas las pestañas</MenuItem>
      </Menu>
    </>
  );
};
