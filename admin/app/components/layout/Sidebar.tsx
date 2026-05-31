import { NavLink } from 'react-router'
import { ROUTES } from '../../../lib/shared/constants'
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
}

interface NavigationGroup {
  title: string
  items: NavigationItem[]
}

const navigationGroups: NavigationGroup[] = [
  {
    title: 'Tổng quan',
    items: [
      { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    title: 'Học liệu',
    items: [
      { name: 'Khóa học', href: ROUTES.COURSES, icon: BookOpen },
    ],
  },
  {
    title: 'Hội thoại mô phỏng',
    items: [
      { name: 'Danh mục tình huống', href: ROUTES.SCENARIO_CATEGORIES, icon: MessageSquare },
    ],
  },
  {
    title: 'Người dùng',
    items: [
      { name: 'Học viên', href: ROUTES.LEARNERS, icon: Users },
    ],
  },
  {
    title: 'Cài đặt',
    items: [
      { name: 'Cài đặt', href: ROUTES.SETTINGS, icon: Settings },
    ],
  },
]

/**
 * Sidebar Component
 */
export function Sidebar() {
  return (
    <aside className="w-[280px] border-r-2 border-border bg-card">
      {/* Logo */}
      <div className="flex h-20 items-center border-b-2 border-border px-8">
        <h1 className="text-2xl font-bold text-card-foreground">
          LinVNix Admin
        </h1>
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <nav className="space-y-8 p-6">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 px-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-4 rounded-xl px-4 py-3 text-base font-semibold transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`
                    }
                  >
                    <item.icon className="h-6 w-6" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}
