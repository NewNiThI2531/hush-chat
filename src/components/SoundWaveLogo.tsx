import React from 'react';

interface SoundWaveLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const SoundWaveLogo: React.FC<SoundWaveLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Black Soundwave Icon */}
      <div className={`${iconSizes[size]} bg-[#111827] text-white rounded-xl flex items-center justify-center p-1.5 shadow-sm transition-transform hover:scale-105`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          {/* Audio wave bars */}
          <line x1="4" y1="10" x2="4" y2="14" />
          <line x1="8" y1="6" x2="8" y2="18" />
          <line x1="12" y1="3" x2="12" y2="21" />
          <line x1="16" y1="7" x2="16" y2="17" />
          <line x1="20" y1="10" x2="20" y2="14" />
        </svg>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className={`font-extrabold tracking-tight text-[#111827] ${textSizes[size]}`}>
          HusH
        </span>
        {showSubtitle && (
          <span className="text-xs font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Chat
          </span>
        )}
      </div>
    </div>
  );
};
