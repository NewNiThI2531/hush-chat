import React, { useState } from 'react';
import { getThiingsUrl } from '../data/thiingsStickers';
import { Sparkles } from 'lucide-react';

interface ThiingsStickerDisplayProps {
  fileId: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const ThiingsStickerDisplay: React.FC<ThiingsStickerDisplayProps> = ({
  fileId,
  name,
  size = 'md',
  className = '',
  onClick,
  interactive = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const imgUrl = getThiingsUrl(fileId);

  // Size specifications:
  // sm (picker preview): 56x56px
  // md (mobile chat stream): 112x112px, desktop: 128x128px
  // lg (featured modal): 140x140px
  const sizeClasses = {
    sm: 'w-14 h-14 min-w-[56px] min-h-[56px]',
    md: 'w-28 h-28 md:w-32 md:h-32 min-w-[112px] min-h-[112px]',
    lg: 'w-36 h-36 min-w-[144px] min-h-[144px]',
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center justify-center select-none ${
        interactive || onClick
          ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200 ease-out'
          : ''
      } ${className}`}
      title={name}
    >
      {/* Background soft glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-400/0 via-pink-400/0 to-orange-400/0 group-hover:from-sky-400/10 group-hover:to-pink-400/10 transition-colors pointer-events-none" />

      {/* Loading placeholder skeleton */}
      {!loaded && !error && (
        <div
          className={`${sizeClasses[size]} rounded-2xl bg-slate-100/80 animate-pulse flex items-center justify-center`}
        >
          <Sparkles className="w-5 h-5 text-slate-300 animate-spin" />
        </div>
      )}

      {/* 3D Sticker Image */}
      {!error ? (
        <img
          src={imgUrl}
          alt={name || '3D Sticker'}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`${sizeClasses[size]} object-contain drop-shadow-md transition-all duration-300 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{
            filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.08))',
          }}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-2 text-slate-400`}
        >
          <Sparkles className="w-6 h-6 text-slate-300 mb-1" />
          <span className="text-[10px] font-medium leading-tight">
            {name || '3D Thing'}
          </span>
        </div>
      )}

      {/* Name label for picker previews */}
      {size === 'sm' && name && (
        <span className="text-[10px] text-slate-600 font-medium truncate max-w-[64px] mt-1 text-center">
          {name}
        </span>
      )}
    </div>
  );
};
