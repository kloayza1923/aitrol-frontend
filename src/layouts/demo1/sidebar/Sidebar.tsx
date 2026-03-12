/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { useResponsive, useViewport } from '@/hooks';
import { useDemo1Layout } from '../';
import { SidebarContent, SidebarHeader } from './';
import clsx from 'clsx';
import { getHeight } from '@/utils';
import { usePathname } from '@/providers';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSidebarThemeClass } from '@/hooks/useSidebarThemeClass';

export const Sidebar = () => {
  const theme = useTheme();
  const sidebarThemeClass = useSidebarThemeClass();
  const selfRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState<number>(0);
  const scrollableOffset = 40;
  const [viewportHeight] = useViewport();
  const { pathname, prevPathname } = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen, layout } = useDemo1Layout();

  useEffect(() => {
    if (headerRef.current) {
      const headerHeight = getHeight(headerRef.current);
      const availableHeight = viewportHeight - headerHeight - scrollableOffset;
      setScrollableHeight(availableHeight);
    } else {
      setScrollableHeight(viewportHeight);
    }
  }, [viewportHeight]);

  const desktopMode = useResponsive('up', 'lg');

  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  const renderContent = () => {
    const sidebarWidth = layout?.options?.sidebar?.collapse ? '70px' : '270px';

    return (
      <Box
        ref={selfRef}
        sx={{
          position: 'relative',
          width: sidebarWidth,
          backgroundColor: 'background.paper',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 12px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)'
              : '0 12px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
          backdropFilter: 'blur(14px) saturate(160%)',
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
              : `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          transition: 'width 300ms ease, box-shadow 300ms ease, transform 300ms ease',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '1px',
            height: '100%',
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, transparent, rgba(116, 165, 255, 0.35), rgba(155, 135, 245, 0.35), transparent)'
                : 'linear-gradient(180deg, transparent, rgba(116, 165, 255, 0.3), rgba(155, 135, 245, 0.3), transparent)'
          },
          '&:hover': {
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 18px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)'
                : '0 18px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)'
          }
        }}
        className={clsx(
          'sidebar lg:fixed lg:top-0 lg:bottom-0 lg:z-20 lg:flex flex-col items-stretch shrink-0 transition-all duration-300',
          sidebarThemeClass
        )}
      >
        {desktopMode && <SidebarHeader ref={headerRef} />}
        <SidebarContent {...(desktopMode && { height: scrollableHeight })} />
      </Box>
    );
  };

  useEffect(() => {
    // Ocultar el drawer al cambiar de ruta (solo móvil)
    if (!desktopMode && prevPathname !== pathname) {
      handleMobileSidebarClose();
    }
  }, [desktopMode, pathname, prevPathname]);

  if (desktopMode) {
    return renderContent();
  } else {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          className="border-0 p-0 w-[--tw-sidebar-width] scrollable-y-auto"
          style={{
            backgroundColor: theme.palette.background.paper,
            borderRight: 'none',
            backdropFilter: 'blur(16px) saturate(160%)',
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
                : '0 25px 50px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
            background:
              theme.palette.mode === 'dark'
                ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
                : `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
          }}
          forceMount={true}
          side="left"
          close={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Mobile Menu</SheetTitle>
            <SheetDescription></SheetDescription>
          </SheetHeader>
          {renderContent()}
        </SheetContent>
      </Sheet>
    );
  }
};
