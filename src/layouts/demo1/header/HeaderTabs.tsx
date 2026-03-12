import { useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { RootState } from '@/store';
import { TabsBar } from '@/components/tabs';

const HeaderTabs = () => {
  const { tabs } = useSelector((state: RootState) => state.tabs);

  // Solo mostrar si hay tabs
  if (tabs.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 'var(--tw-header-height, 70px)',
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 9,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        height: '48px',
        display: 'flex',
        alignItems: 'stretch'
      }}
    >
      <TabsBar />
    </Box>
  );
};

export { HeaderTabs };
