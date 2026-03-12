import { useEffect, useState } from 'react';
import { useResponsive } from '@/hooks';
import { KeenIcon } from '@/components';
import { MenuItem, MenuLink, MenuTitle, MenuArrow, Menu } from '@/components/menu';
import { useDemo1Layout } from '../Demo1LayoutProvider';
import { useLanguage } from '@/i18n';
import { FetchData } from '@/utils/FetchData';

interface MegaMenuInnerProps {
  usuarioId: number;
}

const MegaMenuInner = ({ usuarioId }: MegaMenuInnerProps) => {
  const desktopMode = useResponsive('up', 'lg');
  const { isRTL } = useLanguage();
  const [disabled, setDisabled] = useState(true);
  const { layout, sidebarMouseLeave, setMegaMenuEnabled } = useDemo1Layout();

  const [menuItems, setMenuItems] = useState<any[]>([]);

  // Cargar menú (localStorage + API)

  // Control de deshabilitado para animación inicial
  useEffect(() => {
    setDisabled(true);
    const timer = setTimeout(() => setDisabled(false), 1000);
    return () => clearTimeout(timer);
  }, [layout.options.sidebar.collapse, sidebarMouseLeave]);

  // Activar mega menú en layout
  useEffect(() => {
    setMegaMenuEnabled(true);
  }, [setMegaMenuEnabled]);

  const buildArrow = () => (
    <MenuArrow className="flex lg:hidden text-gray-400">
      <KeenIcon icon="plus" className="text-2xs menu-item-show:hidden" />
      <KeenIcon icon="minus" className="text-2xs hidden menu-item-show:inline-flex" />
    </MenuArrow>
  );

  const linkClass =
    'menu-link text-sm text-gray-700 font-medium menu-link-hover:text-primary menu-item-active:text-gray-900 menu-item-show:text-primary menu-item-here:text-gray-900';
  const titleClass = 'text-nowrap';

  const build = (items: any[]) => {
    return items.map((item, idx) => (
      <MenuItem
        key={idx}
        {...(item.children
          ? {
              toggle: desktopMode ? 'dropdown' : 'accordion',
              trigger: desktopMode ? 'hover' : 'click',
              dropdownProps: { placement: isRTL() ? 'bottom-end' : 'bottom-start' }
            }
          : {})}
      >
        <MenuLink path={item.path || '#'} className={linkClass}>
          {item.icon && <KeenIcon icon={item.icon} className="mr-2" />}
          <MenuTitle className={titleClass}>{item.title}</MenuTitle>
          {item.children && buildArrow()}
        </MenuLink>

        {item.children && Array.isArray(item.children) && item.children.length > 0 && (
          <Menu>{build(item.children)}</Menu>
        )}
      </MenuItem>
    ));
  };

  return (
    <Menu
      multipleExpand={true}
      highlight={true}
      className="flex-col lg:flex-row gap-5 lg:gap-7.5 p-5 lg:p-0"
    >
      {/* {build(menuItems)} */}
    </Menu>
  );
};

export { MegaMenuInner };
