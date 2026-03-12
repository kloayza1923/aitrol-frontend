import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { restoreTabs, openTab } from '@/store/slices/tabsSlice';
import { RootState } from '@/store';
import { TabsBar } from './TabsBar';
import { v4 as uuidv4 } from 'uuid';

interface TabsContainerProps {
  children: React.ReactNode;
}

export const TabsContainer: React.FC<TabsContainerProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { tabs } = useSelector((state: RootState) => state.tabs);
  const [initialized, setInitialized] = React.useState(false);

  // Restaurar tabs desde localStorage al cargar
  useEffect(() => {
    const savedTabs = localStorage.getItem('activeTabs');
    const savedActiveTabId = localStorage.getItem('activeTabId');

    if (savedTabs) {
      try {
        const parsedTabs = JSON.parse(savedTabs);
        dispatch(
          restoreTabs({
            tabs: parsedTabs,
            activeTabId: savedActiveTabId
          })
        );
        setInitialized(true);
      } catch (error) {
        console.error('Error restoring tabs from localStorage:', error);
      }
    } else {
      // Si no hay tabs guardados, crear uno por defecto
      console.log('No saved tabs, creating default tab');
      dispatch(
        openTab({
          id: uuidv4(),
          title: 'Dashboard',
          path: '/dashboard',
          closable: false
        })
      );
      setInitialized(true);
    }
  }, [dispatch]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%'
      }}
    >
      {/* Always show tabs bar */}
      <Box sx={{ flexShrink: 0 }}>
        <TabsBar />
      </Box>
      {/* Content area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          width: '100%'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
