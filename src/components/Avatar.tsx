import React from 'react';
import type { ColorTheme } from '../types/chat';

interface AvatarProps {
  initials: string;
  name?: string;
  avatarUrl?: string;
  color?: ColorTheme;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'away';
  showStatus?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  initials,
  name,
  avatarUrl,
  color = 'blue',
  size = 'md',
  status,
  showStatus = false,
  className = '',
}) => {
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-14 h-14 text-lg font-bold',
    '2xl': 'w-20 h-20 text-2xl font-bold',
  };

  const statusDotSizes = {
    xs: 'w-2 h-2 ring-1',
    sm: 'w-2.5 h-2.5 ring-1.5',
    md: 'w-3 h-3 ring-2',
    lg: 'w-3.5 h-3.5 ring-2',
    xl: 'w-4 h-4 ring-2',
    '2xl': 'w-5 h-5 ring-2',
  };

  const colorStyles: Record<ColorTheme, { bg: string; text: string; ring: string }> = {
    blue: {
      bg: 'bg-sky-100',
      text: 'text-sky-700',
      ring: 'border-sky-200',
    },
    pink: {
      bg: 'bg-pink-100',
      text: 'text-pink-700',
      ring: 'border-pink-200',
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      ring: 'border-orange-200',
    },
    black: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      ring: 'border-slate-300',
    },
  };

  const currentTheme = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} ${currentTheme.bg} ${currentTheme.text} border ${currentTheme.ring} rounded-full flex items-center justify-center select-none shadow-sm transition-all overflow-hidden`}
        title={name}
      >
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={name || initials}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover p-0.5"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showStatus && status && (
        <span
          className={`absolute bottom-0 right-0 ${statusDotSizes[size]} rounded-full ring-white ${
            status === 'online'
              ? 'bg-emerald-500'
              : status === 'away'
              ? 'bg-amber-400'
              : 'bg-slate-400'
          }`}
          title={status === 'online' ? 'Online' : status === 'away' ? 'Away' : 'Offline'}
        />
      )}
    </div>
  );
};
