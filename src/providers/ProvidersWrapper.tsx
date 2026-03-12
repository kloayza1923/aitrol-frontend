import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { AuthProvider } from '@/auth/providers/JWTProvider';
import {
  LayoutProvider,
  LoadersProvider,
  MenusProvider,
  SettingsProvider,
  SnackbarProvider,
  TranslationProvider,
  CompanyProvider
} from '@/providers';
import { HelmetProvider } from 'react-helmet-async';
import GlobalErrorHandler from '@/components/GlobalErrorHandler';

const queryClient = new QueryClient();

const ProvidersWrapper = ({ children }: PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <TranslationProvider>
            <HelmetProvider>
              <CompanyProvider>
                <LayoutProvider>
                  <LoadersProvider>
                    <MenusProvider>
                      <GlobalErrorHandler />
                      {children}
                    </MenusProvider>
                  </LoadersProvider>
                </LayoutProvider>
              </CompanyProvider>
            </HelmetProvider>
          </TranslationProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export { ProvidersWrapper };
