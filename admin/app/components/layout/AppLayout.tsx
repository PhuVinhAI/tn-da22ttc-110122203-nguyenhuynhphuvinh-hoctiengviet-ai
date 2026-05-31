import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';

/**
 * App Layout - Main layout với sidebar
 */
export function AppLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* TitleBar - Electron custom titlebar */}
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
