import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../features/auth'
import { LoginForm } from '../../components/forms/LoginForm'
import { TitleBar } from '../../components/layout/TitleBar'
import { ROUTES } from '../../../lib/shared/constants'

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
      <div className="flex flex-1 items-center justify-center overflow-auto">
        <div className="w-full max-w-md space-y-8 px-4 py-8">
          {/* Logo & Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground">
              LinVNix Admin
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Đăng nhập vào trang quản trị
            </p>
          </div>

          {/* Login Form */}
          <div className="rounded-xl bg-card p-8 border border-border">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            © 2024 LinVNix. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
