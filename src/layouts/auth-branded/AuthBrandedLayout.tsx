import { Link, Outlet } from 'react-router-dom';
import { Fragment } from 'react';
import { toAbsoluteUrl } from '@/utils';
import useBodyClasses from '@/hooks/useBodyClasses';
import { AuthBrandedLayoutProvider } from './AuthBrandedLayoutProvider';

const Layout = () => {
  useBodyClasses('bg-gray-100 dark:bg-coal-500');

  return (
    <Fragment>
      {/*   <div className="grid lg:grid-cols-2 min-h-screen w-full">
        <div className="hidden lg:flex flex-col justify-center p-16 bg-blue-600 text-white rounded-r-xl relative">
          <Link to="/">
            <img
              src={toAbsoluteUrl('/media/app/logo.png')}
              alt="Logo"
              className="h-10 mb-8"
            />
          </Link>

          <h1 className="text-4xl font-bold mb-4">Welcome back!</h1>
          <p className="text-lg mb-8">
            Please sign in to your account and manage your data securely.
          </p>

          <div className="bg-white text-black p-4 rounded-lg shadow-md w-full max-w-xs">
            <div className="text-sm font-medium mb-2">Sales Report</div>
            <div className="h-24 bg-gray-200 flex items-end justify-between p-1">
              <div className="w-4 bg-blue-600 h-16"></div>
              <div className="w-4 bg-blue-600 h-20"></div>
              <div className="w-4 bg-blue-600 h-12"></div>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center p-8 lg:p-16 bg-gray-100 dark:bg-coal-500">
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
            <Outlet />
          </div>
        </div>
      </div> */}
      <div className="min-h-screen flex items-center justify-center p-6 w-full">
        <Outlet />
      </div>
    </Fragment>
  );
};

const AuthBrandedLayout = () => (
  <AuthBrandedLayoutProvider>
    <Layout />
  </AuthBrandedLayoutProvider>
);

export { AuthBrandedLayout };
