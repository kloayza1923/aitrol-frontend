import clsx from 'clsx';
import { type ReactNode } from 'react';
import { Container as Cont } from '@mui/material';
import { useSettings } from '../../providers/SettingsProvider';

import { TSettingsContainer } from '@/config';
import { PageNavbar } from '@/pages/account';

export interface TPageContainerProps {
  children?: ReactNode;
  width?: TSettingsContainer;
  className?: string;
}

const Container = ({ children, width, className = '' }: TPageContainerProps) => {
  const { settings } = useSettings();
  const { container } = settings;
  const widthMode = width ?? container;

  // Responsive and modern spacing
  return (
    <Cont
      sx={{ flexGrow: 1 }}
      className={clsx(
        className,
        'w-full mx-auto',
        'px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24', // More horizontal space on larger screens
        'py-3 sm:py-3 md:py-5 lg:py-3 xl:py-3', // More vertical space
        {
          'max-w-full': widthMode === 'fluid',
          'max-w-screen-xl': widthMode === 'fixed' || widthMode === 'default'
        }
      )}
      maxWidth={widthMode === 'fluid' ? false : 'xl'}
      disableGutters={widthMode === 'fluid'}
    >
      {/* <PageNavbar /> */}
      {children}
    </Cont>
  );
};

export { Container };
