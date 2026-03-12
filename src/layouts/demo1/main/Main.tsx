import { Fragment, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { useMenuCurrentItem } from '@/components/menu';
import { useResponsive } from '@/hooks';
import { Footer, Header, Sidebar, useDemo1Layout } from '../';
import { useMenus } from '@/providers';
import { RootState } from '@/store';

const Main = () => {
  const { layout } = useDemo1Layout();
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const { tabs } = useSelector((state: RootState) => state.tabs);
  const desktopMode = useResponsive('up', 'lg');

  // Decide when to hide the sidebar. Only hide on the standalone quick-access page.
  const hideSidebar = pathname === '/';

  useEffect(() => {
    const bodyClass = document.body.classList;

    // Add a class to the body element
    bodyClass.add('demo1');

    if (layout.options.sidebar.fixed) bodyClass.add('sidebar-fixed');
    if (layout.options.sidebar.collapse) bodyClass.add('sidebar-collapse');
    if (layout.options.header.fixed) bodyClass.add('header-fixed');
    // If current route requests no sidebar, add a body class to remove sidebar spacing
    if (hideSidebar) bodyClass.add('no-sidebar');

    // Aplicar el ancho dinámico del sidebar según el estado collapsed y el modo escritorio
    const sidebarWidth = (layout.options.sidebar.collapse && desktopMode) ? '70px' : (desktopMode ? '270px' : '280px');
    document.body.style.setProperty('--tw-sidebar-width', sidebarWidth);

    // Las tabs ahora están integradas en el header, así que no agregan altura adicional
    document.body.style.setProperty('--tw-tabs-height', '0px');

    // Remove the class when the component is unmounted
    return () => {
      bodyClass.remove('demo1');
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      bodyClass.remove('header-fixed');
      bodyClass.remove('no-sidebar');
    };
  }, [layout, hideSidebar, tabs.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      document.body.classList.add('layout-initialized');
    }, 1000); // 1000 milliseconds

    // Remove the class when the component is unmounted
    return () => {
      document.body.classList.remove('layout-initialized');
      clearTimeout(timer);
    };
  }, []);

  return (
    <Fragment>
      <Helmet>
        <title>{menuItem?.title}</title>
      </Helmet>

      {(!hideSidebar || !desktopMode) && <Sidebar />}

      <div className="wrapper flex grow">
        <Header />

        <main className="grow content pt-0" role="content">
          <Outlet />
        </main>

        <Footer />
      </div>
    </Fragment>
  );
};

export { Main };
