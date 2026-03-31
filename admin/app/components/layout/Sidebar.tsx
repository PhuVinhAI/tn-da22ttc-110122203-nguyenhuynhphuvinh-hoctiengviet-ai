import { NavLink } from 'react-router';
import { ROUTES } from '../../../lib/shared/constants';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BookMarked,
  FileText,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Người dùng', href: ROUTES.USERS, icon: Users },
  { name: 'Khóa học', href: ROUTES.COURSES, icon: BookOpen },
  { name: 'Từ vựng', href: ROUTES.VOCABULARIES, icon: BookMarked },
  { name: 'Bài tập', href: ROUTES.EXERCISES, icon: FileText },
  { name: 'Cài đặt', href: ROUTES.SETTINGS, icon: Settings },
];

/**
 * Sidebar Component
 */
export function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          LinVNix Admin
        </h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
