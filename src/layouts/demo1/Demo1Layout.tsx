import useBodyClasses from '@/hooks/useBodyClasses';
import { Demo1LayoutProvider, Main } from './';

const Demo1Layout = () => {
  useBodyClasses(`
    demo1 
    sidebar-fixed 
    header-fixed
    [--tw-header-height-mobile:70px]
    [--tw-header-height:70px]
    dark:bg-[#2a2a2a]
  `);

  return (
    <Demo1LayoutProvider>
      <Main />
    </Demo1LayoutProvider>
  );
};

export { Demo1Layout };
