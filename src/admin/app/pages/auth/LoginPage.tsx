import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../features/auth'
import { LoginForm } from '../../components/forms/LoginForm'
import { TitleBar } from '../../components/layout/TitleBar'
import { ROUTES } from '../../../lib/shared/constants'
import appIcon from '../../assets/app-icon.png'

/**
 * Login Page - Admin authentication
 * Container Component (Smart)
 */
export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleLoginSuccess = () => {
    navigate(ROUTES.DASHBOARD, { replace: true })
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <TitleBar />

      <div className="flex flex-1 items-center justify-center overflow-auto p-6">
        <div className="w-full max-w-[420px]">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <img
              src={appIcon}
              alt="LinVNix"
              className="h-16 w-16 rounded-2xl mb-4 select-none"
              draggable={false}
            />
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              LinVNix
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Admin Panel
            </span>
          </div>

          {/* Card with form */}
          <div className="rounded-2xl border-2 border-border bg-card p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Chào mừng trở lại
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Đăng nhập với tài khoản quản trị viên
              </p>
            </div>

            <LoginForm onSuccess={handleLoginSuccess} />
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2026 LinVNix · Hệ thống quản trị nội bộ
          </p>
        </div>
      </div>
    </div>
  )
}
