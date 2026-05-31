import { NavLink } from 'react-router'
import { ROUTES } from '../../../lib/shared/constants'
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'
import { Button } from '../ui/button'
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
      <div className="flex h-20 items-center border-b-2 border-border px-8">
        <h1 className="text-2xl font-bold text-card-foreground">
          LinVNix Admin
        </h1>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="space-y-2 p-4">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-base font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom Section - Theme Toggle + User + Logout */}
      <div className="border-t-2 border-border p-3 space-y-1">
        {/* User Info */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground truncate">
            {user?.fullName}
          </span>
        </div>

        <div className="flex gap-1">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="flex-1 justify-center gap-2 h-9"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Sáng' : 'Tối'}
            </span>
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex-1 justify-center gap-2 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Thoát</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
