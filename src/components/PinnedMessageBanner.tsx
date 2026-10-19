import React from 'react';
import type { Message, User } from '../types/chat';
import { Pin, X, ArrowUpRight } from 'lucide-react';

interface PinnedMessageBannerProps {
  pinnedMessage: Message;
  sender?: User;
  onJumpToMessage: (id: string) => void;
  onUnpin: () => void;
}

export const PinnedMessageBanner: React.FC<PinnedMessageBannerProps> = ({
  pinnedMessage,
  sender,
  onJumpToMessage,
  onUnpin,
}) => {
  return (
    <div className="bg-[#FFF7ED] border-b border-[#FED7AA] px-5 py-2.5 flex items-center justify-between gap-3 text-xs text-[#9A3412] shrink-0 animate-fadeIn">
      {/* Pinned content button */}
      <button
        onClick={() => onJumpToMessage(pinnedMessage.id)}
        className="flex items-center gap-2.5 min-w-0 text-left hover:underline group"
      >
        <div className="w-6 h-6 rounded-lg bg-[#FFEDD5] border border-[#FDBA74] flex items-center justify-center shrink-0">
          <Pin className="w-3.5 h-3.5 text-[#F97316]" fill="#F97316" />
        </div>

        <div className="min-w-0 truncate">
          <span className="font-bold text-[#EA580C] mr-1.5">ข้อความปักหมุด</span>
          {sender && (
            <span className="text-slate-500 font-medium mr-1.5">({sender.name}):</span>
          )}
          <span className="text-slate-800 font-medium truncate">
            {pinnedMessage.type === 'sticker' ? '🎨 สติกเกอร์กราฟิก' : pinnedMessage.text}
          </span>
        </div>

        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#EA580C] shrink-0" />
      </button>

      {/* Unpin action */}
      <button
        onClick={onUnpin}
        title="ยกเลิกการปักหมุด (Unpin)"
        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-[#FFEDD5] transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
