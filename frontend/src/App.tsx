import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import ProjectsPage from '@/pages/projects/ProjectsPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import TestCasesPage from '@/pages/testcases/TestCasesPage';
import CreateTestCasePage from '@/pages/testcases/CreateTestCasePage';
import EditTestCasePage from '@/pages/testcases/EditTestCasePage';
import TestCaseDetailPage from '@/pages/testcases/TestCaseDetailPage';
import ExecutionsPage from '@/pages/execution/ExecutionsPage';
import IntegrationPage from '@/pages/integration/IntegrationPage';
import SettingsPage from '@/pages/settings/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId/dashboard" element={<DashboardPage />} />
        <Route path="projects/:projectId/test-cases" element={<TestCasesPage />} />
        <Route path="projects/:projectId/test-cases/new" element={<CreateTestCasePage />} />
        <Route path="projects/:projectId/test-cases/:testCaseId/edit" element={<EditTestCasePage />} />
        <Route path="projects/:projectId/test-cases/:testCaseId" element={<TestCaseDetailPage />} />
        <Route path="projects/:projectId/executions" element={<ExecutionsPage />} />
        <Route path="projects/:projectId/integrations" element={<IntegrationPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
