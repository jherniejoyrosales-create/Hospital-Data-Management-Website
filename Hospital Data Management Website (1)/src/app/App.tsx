import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router';
import { AuthProvider } from './lib/auth';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';
import { suppressRechartsWarnings } from './lib/suppressWarnings';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import ICDCodesPage from './pages/ICDCodesPage';
import RVSCodesPage from './pages/RVSCodesPage';
import ZBenefitsPage from './pages/ZBenefitsPage';
import KonsultaPackagesPage from './pages/KonsultaPackagesPage';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

// Root component provides AuthProvider context to all routes
function Root() {
  useEffect(() => {
    suppressRechartsWarnings();
  }, []);

  return (
    <AuthProvider>
      <Outlet />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

// Create router configuration with Root as the wrapper
const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'patients',
            element: <Patients />,
          },
          {
            path: 'patients/:id',
            element: <PatientDetail />,
          },
          {
            path: 'icd-codes',
            element: <ICDCodesPage />,
          },
          {
            path: 'rvs-codes',
            element: <RVSCodesPage />,
          },
          {
            path: 'z-benefits',
            element: <ZBenefitsPage />,
          },
          {
            path: 'konsulta-packages',
            element: <KonsultaPackagesPage />,
          },
          {
            path: 'audit',
            element: <AuditLogs />,
          },
          {
            path: 'settings',
            element: <Settings />,
          },
        ],
      },
      {
        path: '*',
        element: (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900">404</h1>
              <p className="text-xl text-gray-600 mt-2">Page not found</p>
              <a href="/dashboard" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
                Go to Dashboard
              </a>
            </div>
          </div>
        ),
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}