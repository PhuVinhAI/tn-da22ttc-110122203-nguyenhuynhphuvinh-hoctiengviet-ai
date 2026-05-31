import { NavLink } from 'react-router'
import { ROUTES } from '../../../lib/shared/constants'
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Khóa học', href: ROUTES.COURSES, icon: BookOpen },
  { name: 'Tình huống', href: ROUTES.SCENARIO_CATEGORIES, icon: MessageSquare },
  { name: 'Học viên', href: ROUTES.LEARNERS, icon: Users },
  { name: 'Cài đặt', href: ROUTES.SETTINGS, icon: Settings },
]

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Sidebar Component
 */
export function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <aside className="w-[256px] border-r-2 border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b-2 border-border px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-card-foreground leading-tight tracking-tight">
            LinVNix
          </h1>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t-2 border-border p-3 space-y-2">
        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            {getInitials(user?.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {user?.fullName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="text-xs font-semibold">
              {theme === 'dark' ? 'Sáng' : 'Tối'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted text-destructive hover:bg-destructive/10 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
