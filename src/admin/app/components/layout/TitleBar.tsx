import { useEffect, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { isElectron } from '../../../lib/platform';
import appIcon from '../../assets/app-icon.png';

type WinPlatform = 'darwin' | 'win32' | 'linux' | 'other';

export function TitleBar() {
  const [platform, setPlatform] = useState<WinPlatform>('other');

  useEffect(() => {
    if (!isElectron()) return;
    window.conveyor?.window
      .windowInit()
      .then((info: any) => {
        const p = info?.platform as string | undefined;
        if (p === 'darwin' || p === 'win32' || p === 'linux') setPlatform(p);
      })
      .catch(() => {});
  }, []);

  if (!isElectron()) return null;

  const isMac = platform === 'darwin';

  const handleMinimize = () => window.conveyor?.window.windowMinimize();
  const handleMaximize = () => window.conveyor?.window.windowMaximizeToggle();
  const handleClose = () => window.conveyor?.window.windowClose();

  return (
    <div
      className="flex h-10 shrink-0 items-center border-b border-border bg-card select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-2 px-3"
        style={{ paddingLeft: isMac ? 84 : 12 }}
      >
        <img src={appIcon} alt="" className="h-4 w-4 rounded-[3px]" draggable={false} />
        <span className="text-[13px] font-medium tracking-tight text-foreground/80">
          LinVNix Admin
        </span>
      </div>

      <div className="flex-1" />

      {!isMac && (
        <div
          className="flex h-full"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <TitleButton onClick={handleMinimize} ariaLabel="Thu nhỏ">
            <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
          </TitleButton>
          <TitleButton onClick={handleMaximize} ariaLabel="Phóng to">
            <Square className="h-3 w-3" strokeWidth={1.75} />
          </TitleButton>
          <TitleButton onClick={handleClose} ariaLabel="Đóng" variant="close">
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </TitleButton>
        </div>
      )}
    </div>
  );
}

interface TitleButtonProps {
  onClick: () => void;
  ariaLabel: string;
  variant?: 'default' | 'close';
  children: React.ReactNode;
}

function TitleButton({ onClick, ariaLabel, variant = 'default', children }: TitleButtonProps) {
  const hoverClass =
    variant === 'close'
      ? 'hover:bg-destructive hover:text-destructive-foreground'
      : 'hover:bg-muted';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex h-full w-11 items-center justify-center text-foreground/70 transition-colors ${hoverClass}`}
    >
      {children}
    </button>
  );
}
