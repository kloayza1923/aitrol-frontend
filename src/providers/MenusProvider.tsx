/* eslint-disable no-unused-vars */
import { createContext, type PropsWithChildren, useContext, useState } from 'react';
import { IMenuItemConfig, TMenuConfig } from '@/components/menu';

export interface IMenusProps {
  configs: Map<string, TMenuConfig | null>;
  setMenuConfig: (name: string, config: TMenuConfig | null) => void;
  getMenuConfig: (name: string) => TMenuConfig | null;
  setCurrentMenuItem: (config: IMenuItemConfig | null) => void;
  getCurrentMenuItem: () => IMenuItemConfig | null;
  version: number;
}

const initialProps: IMenusProps = {
  configs: new Map(),
  setMenuConfig: () => {},
  getMenuConfig: () => null,
  setCurrentMenuItem: () => {},
  getCurrentMenuItem: () => null,
  version: 0
};

const MenuContext = createContext<IMenusProps>(initialProps);
const useMenus = () => useContext(MenuContext);

const MenusProvider = ({ children }: PropsWithChildren) => {
  const [currentMenuItem, setCurrentMenuItem] = useState<IMenuItemConfig | null>(null);
  const [version, setVersion] = useState(0);
  const configs = initialProps.configs;

  const setMenuConfig = (name: string, config: TMenuConfig | null) => {
    configs.set(name, config);
    setVersion((v) => v + 1); // Increment version to trigger re-renders
  };

  const getCurrentMenuItem = (): IMenuItemConfig | null => {
    return currentMenuItem;
  };

  const getMenuConfig = (name: string): TMenuConfig | null => {
    return configs.get(name) ?? null;
  };

  return (
    <MenuContext.Provider
      value={{
        configs,
        setMenuConfig,
        getMenuConfig,
        setCurrentMenuItem,
        getCurrentMenuItem,
        version
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { MenusProvider, useMenus };
