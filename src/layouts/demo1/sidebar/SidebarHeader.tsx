import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/utils';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSettings, useCompany } from '@/providers';

const SidebarHeader = forwardRef<HTMLDivElement, any>((props, ref) => {
  const theme = useTheme();
  const { settings } = useSettings();
  const { company } = useCompany();
  const mode = settings.themeMode === 'system' ? 'dark' : settings.themeMode;

  // Obtener logo desde la empresa o usar fallback
  const logoUrl = company?.logo
    ? company.logo.startsWith('http')
      ? company.logo
      : import.meta.env.VITE_APP_API_URL + company.logo
    : toAbsoluteUrl('/media/app/logo.jpg');

  const brandLogo = () => (
    <Link to="/" className="flex items-center justify-center w-full no-underline group">
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img
          src={logoUrl}
          className="w-full object-contain transition-transform duration-300 group-hover:scale-110"
          alt="Horizon Logo"
        />
      </Box>
    </Link>
  );

  return (
    <Box
      ref={ref}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(0,0,0,0.05) 100%)`
            : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255,255,255,0.8) 100%)`,
        backdropFilter: 'blur(10px)'
      }}
      className="sidebar-header hidden lg:flex items-center relative justify-center px-3 shrink-0 py-4"
    >
      {brandLogo()}
    </Box>
  );
});

export { SidebarHeader };
