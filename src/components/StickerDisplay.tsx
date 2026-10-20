import React from 'react';
import { SYSTEM_STICKERS } from '../data/stickers';
import { CheckCircle2, Heart, Clock, Sparkles, BarChart3, Flame, ShieldCheck, Target } from 'lucide-react';

interface StickerDisplayProps {
  stickerId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const StickerDisplay: React.FC<StickerDisplayProps> = ({
  stickerId,
  size = 'md',
  className = '',
  onClick,
}) => {
  const sticker = SYSTEM_STICKERS.find(s => s.id === stickerId) || SYSTEM_STICKERS[0];

  const renderIcon = (type: string, iconClass: string) => {
    switch (type) {
      case 'check':
        return <CheckCircle2 className={iconClass} />;
      case 'heart':
        return <Heart className={iconClass} />;
      case 'clock':
        return <Clock className={iconClass} />;
      case 'sparkles':
        return <Sparkles className={iconClass} />;
      case 'chart':
        return <BarChart3 className={iconClass} />;
      case 'flame':
        return <Flame className={iconClass} />;
      case 'shield':
        return <ShieldCheck className={iconClass} />;
      case 'target':
        return <Target className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  const containerSizes = {
    sm: 'p-2.5 min-w-[130px] rounded-xl text-xs',
    md: 'p-3.5 min-w-[170px] max-w-[210px] rounded-2xl text-sm shadow-sm',
    lg: 'p-4 min-w-[200px] max-w-[240px] rounded-2xl text-base shadow',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: sticker.bgColor,
        borderColor: sticker.borderColor,
      }}
      className={`border flex flex-col items-center justify-center text-center select-none transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:scale-105 hover:shadow-md' : ''
      } ${containerSizes[size]} ${className}`}
    >
      <div
        className="rounded-full p-2 mb-1.5 flex items-center justify-center"
        style={{
          color: sticker.accentColor,
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        }}
      >
        {renderIcon(sticker.iconType, iconSizes[size])}
      </div>

      <div className="font-bold text-[#111827] tracking-tight leading-tight">
        {sticker.title}
      </div>

      {size !== 'sm' && sticker.subTitle && (
        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
          {sticker.subTitle}
        </div>
      )}
    </div>
  );
};
