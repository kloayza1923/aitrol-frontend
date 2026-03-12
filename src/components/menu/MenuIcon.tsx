import clsx from 'clsx';

import { IMenuIconProps } from './';

const MenuIcon = ({ className, children }: IMenuIconProps) => {
  return (
    <div
      className={clsx(
        'menu-icon flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:bg-gray-200 hover:text-blue-600',
        className
      )}
      style={{ padding: '0.6rem' }}
    >
      {children}
    </div>
  );
};

export { MenuIcon };
