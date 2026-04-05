import { Menu } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const activeProject = useProjectStore((s) => s.activeProject);
  const user = useAuthStore((s) => s.user);

  const initials = user?.displayName
    ? user.displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        {activeProject && (
          <h2 className="text-sm font-semibold text-slate-800">
            {activeProject.name}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <span className="hidden sm:block text-sm text-slate-600">
            {user.displayName}
          </span>
        )}
        <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
