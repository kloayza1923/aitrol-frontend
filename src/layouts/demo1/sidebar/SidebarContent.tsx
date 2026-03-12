import { SidebarMenu } from './';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface Props {
  height?: number;
}

const SidebarContent = ({ height = 0 }: Props) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
            : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.95) 100%)`
      }}
      className="sidebar-content"
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 2,
          py: 3,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: '4px',
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))'
                : 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.08))'
          }
        }}
        style={{
          ...(height > 0 && { height: `${height}px` })
        }}
      >
        <SidebarMenu />
      </Box>
    </Box>
  );
};

export { SidebarContent };
