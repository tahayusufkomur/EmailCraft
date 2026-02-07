import { Navigate, Route, Routes } from 'react-router-dom';

import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { SiteLayout } from './components/layout/SiteLayout';
import { DashboardBillingPage } from './pages/DashboardBillingPage';
import { DashboardOrganizationsPage } from './pages/DashboardOrganizationsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DashboardWidgetBuilderPage } from './pages/DashboardWidgetBuilderPage';
import { FaqPage } from './pages/FaqPage';
import { ImpressumPage } from './pages/ImpressumPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PricingPage } from './pages/PricingPage';
import { RegisterPage } from './pages/RegisterPage';

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="impressum" element={<ImpressumPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="templates" element={<Navigate to="/dashboard/organizations" replace />} />
        <Route path="organizations" element={<DashboardOrganizationsPage />} />
        <Route path="widget-builder" element={<DashboardWidgetBuilderPage />} />
        <Route path="billing" element={<DashboardBillingPage />} />
      </Route>

      <Route path="builder" element={<Navigate to="/builder/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
