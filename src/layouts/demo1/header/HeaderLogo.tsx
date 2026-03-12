import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { toAbsoluteUrl } from '@/utils';
import { useCompany } from '@/providers';

import { useDemo1Layout } from '../';

const HeaderLogo = () => {
  const { setMobileSidebarOpen, setMobileMegaMenuOpen, megaMenuEnabled } = useDemo1Layout();
  const { company } = useCompany();

  const handleSidebarOpen = () => {
    setMobileSidebarOpen(true);
  };

  const handleMegaMenuOpen = () => {
    setMobileMegaMenuOpen(true);
  };

  // Obtener logo desde la empresa o usar fallback
  const logoUrl = company?.logo
    ? company.logo.startsWith('http')
      ? company.logo
      : toAbsoluteUrl(company.logo)
    : toAbsoluteUrl('/media/app/logo.jpg');

  return (
    <div className="flex gap-2 lg:hidden items-center -ms-1">
      <Link to="/" className="shrink-0 transition-transform hover:scale-105 active:scale-95">
        <img src={logoUrl} className="max-h-[32px] w-auto rounded-lg shadow-sm" alt="mini-logo" />
      </Link>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn btn-icon btn-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-0 transition-all duration-200"
          onClick={handleSidebarOpen}
        >
          <KeenIcon icon="menu" />
        </button>

        {megaMenuEnabled && (
          <button
            type="button"
            className="btn btn-icon btn-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-0 transition-all duration-200"
            onClick={handleMegaMenuOpen}
          >
            <KeenIcon icon="burger-menu-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export { HeaderLogo };
