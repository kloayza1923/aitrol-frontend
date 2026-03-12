import clsx from 'clsx';
import { Container } from '@/components/container';
import { MegaMenu } from '../mega-menu';
import { HeaderLogo, HeaderTopbar } from './';
import { Breadcrumbs, useDemo1Layout } from '../';
import { useLocation } from 'react-router';

const Header = () => {
  const { headerSticky } = useDemo1Layout();
  const { pathname } = useLocation();

  return (
    <>
      <header
        className={clsx(
          'header fixed top-0 z-10 start-0 end-0 flex items-stretch shrink-0 flex-col',
          'bg-white dark:bg-zinc-800 backdrop-blur-md',
          'border-b border-gray-200 dark:border-gray-800',
          headerSticky && 'shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50'
        )}
      >
        <div className="flex items-stretch flex-1">
          <Container className="flex justify-between items-stretch lg:gap-4 py-2 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <HeaderLogo />
              {!pathname.includes('/account') && <MegaMenu />}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {pathname.includes('/account') && <Breadcrumbs />}
              <HeaderTopbar />
            </div>
          </Container>
        </div>
      </header>
    </>
  );
};

export { Header };
