import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../../lib/state/stores/auth.store';
import { LoginForm } from '../../components/forms/LoginForm';
import { ROUTES } from '../../../lib/shared/constants';

/**
 * Login Page - Admin authentication
 * Container Component (Smart)
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirect nếu đã login
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSuccess = () => {
    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md space-y-8 px-4">
        {/* Logo & Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            LinVNix Admin
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Đăng nhập vào trang quản trị
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-slate-800">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          © 2024 LinVNix. All rights reserved.
        </p>
      </div>
    </div>
  );
}
