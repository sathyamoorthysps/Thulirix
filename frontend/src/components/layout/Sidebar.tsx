import { NavLink, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  LayoutDashboard,
  FlaskConical,
  PlayCircle,
  Plug2,
  Settings,
  LogOut,
  TestTubes,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/utils/helpers';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-600 text-white'
      : 'text-slate-300 hover:bg-slate-700 hover:text-white',
  );

// Role hierarchy: SYSTEM_ADMIN > TEST_LEAD > TESTER (default)
function useNavPermissions() {
  const { roles } = useRole();
  const isAdmin = roles.includes('SYSTEM_ADMIN');
  const isLead  = roles.includes('TEST_LEAD');

  return {
    showDashboard:    true,                   // all roles
    showTestCases:    true,                   // all roles
    showExecutions:   isAdmin || isLead,      // admin + lead
    showIntegrations: isAdmin,                // admin only
    showSettings:     isAdmin || isLead,      // admin + lead
  };
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const activeProject = useProjectStore((s) => s.activeProject);
  const clearActiveProject = useProjectStore((s) => s.clearActiveProject);
  const nav = useNavPermissions();

  const handleLogout = () => {
    logout();
    clearActiveProject();
    navigate('/login');
  };

  const handleClick = () => onClose?.();

  return (
    <aside className="flex flex-col h-full bg-slate-900 text-white">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-700">
        <TestTubes className="h-7 w-7 text-brand-400" />
        <span className="text-lg font-bold tracking-tight">Thulirix</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/projects" end className={linkClass} onClick={handleClick}>
          <FolderKanban className="h-4 w-4" />
          Projects
        </NavLink>

        {activeProject && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {activeProject.name}
              </p>
            </div>

            {nav.showDashboard && (
              <NavLink
                to={`/projects/${activeProject.id}/dashboard`}
                className={linkClass}
                onClick={handleClick}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </NavLink>
            )}

            {nav.showTestCases && (
              <NavLink
                to={`/projects/${activeProject.id}/test-cases`}
                className={linkClass}
                onClick={handleClick}
              >
                <FlaskConical className="h-4 w-4" />
                Test Cases
              </NavLink>
            )}

            {nav.showExecutions && (
              <NavLink
                to={`/projects/${activeProject.id}/executions`}
                className={linkClass}
                onClick={handleClick}
              >
                <PlayCircle className="h-4 w-4" />
                Executions
              </NavLink>
            )}

            {nav.showIntegrations && (
              <NavLink
                to={`/projects/${activeProject.id}/integrations`}
                className={linkClass}
                onClick={handleClick}
              >
                <Plug2 className="h-4 w-4" />
                Integrations
              </NavLink>
            )}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-700 space-y-1">
        {nav.showSettings && (
          <NavLink to="/settings" className={linkClass} onClick={handleClick}>
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
