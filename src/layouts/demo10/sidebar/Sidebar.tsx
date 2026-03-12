/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { useResponsive, useViewport } from '@/hooks';
import { useDemo10Layout } from '..';
import { SidebarHeader, SidebarMenu, SidebarFooter } from '.';
import { getHeight } from '@/utils';
import { usePathname } from '@/providers';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

const Sidebar = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const desktopMode = useResponsive('up', 'lg');
  const { pathname, prevPathname } = usePathname();
  const [viewportHeight] = useViewport();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useDemo10Layout();
  const [scrollableHeight, setScrollableHeight] = useState<number>(0);
  const scrollableOffset = 50;

  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  const renderContent = () => {
    return (
      <div
        className="
        flex-col fixed top-0 bottom-0 z-20 lg:flex items-stretch shrink-0 
        w-[--tw-sidebar-width]
        bg-gradient-to-b
        from-[#E3F2FD]/80 to-[#E8F5E9]/80
        dark:from-[#1A1C1E]/70 dark:to-[#2C2F33]/70
        backdrop-blur-md
        border-r border-white/20 dark:border-white/10
      "
      >
        <SidebarHeader ref={headerRef} />
        <SidebarMenu height={scrollableHeight} />
        <SidebarFooter ref={footerRef} />
      </div>
    );
  };

  useEffect(() => {
    if (headerRef.current && footerRef.current) {
      const headerHeight = getHeight(headerRef.current);
      const footerHeight = getHeight(footerRef.current);
      const availableHeight = viewportHeight - headerHeight - footerHeight - scrollableOffset;
      setScrollableHeight(availableHeight);
    } else {
      setScrollableHeight(viewportHeight);
    }
  }, [viewportHeight]);

  useEffect(() => {
    if (!desktopMode && prevPathname !== pathname) {
      handleMobileSidebarClose();
    }
  }, [desktopMode, pathname, prevPathname]);

  if (desktopMode) {
    return renderContent();
  } else {
    return (
      <SheetContent
        className="
    border-0 p-0 w-[--tw-sidebar-width]
    bg-gradient-to-b 
    from-[#E3F2FD]/80 to-[#E8F5E9]/80
    dark:from-[#1A1C1E]/70 dark:to-[#2C2F33]/70
    backdrop-blur-md
    border-r border-white/20 dark:border-white/10
  "
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
    );
  }
};

export { Sidebar };
