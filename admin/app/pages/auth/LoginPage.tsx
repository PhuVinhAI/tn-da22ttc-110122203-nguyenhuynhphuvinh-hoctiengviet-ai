import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../features/auth'
import { LoginForm } from '../../components/forms/LoginForm'
import { TitleBar } from '../../components/layout/TitleBar'
import { ROUTES } from '../../../lib/shared/constants'
import { LogIn } from 'lucide-react'

/**
 * Login Page - Admin authentication
 * Container Component (Smart)
 */
export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  // Redirect nếu đã login
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleLoginSuccess = () => {
    navigate(ROUTES.DASHBOARD, { replace: true })
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* TitleBar - Only in Electron */}
      <TitleBar />

      {/* Login Content */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-8">
        <div className="w-full max-w-lg space-y-8">
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <LogIn className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl font-bold text-foreground">
              LinVNix Admin
            </h1>
            <p className="text-xl text-muted-foreground">
              Đăng nhập vào trang quản trị
            </p>
          </div>

          {/* Login Form */}
          <div className="rounded-2xl bg-card p-10 border-2 border-border">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>

          {/* Footer */}
          <p className="text-center text-base text-muted-foreground">
            © 2024 LinVNix. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
