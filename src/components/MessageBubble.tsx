import React, { useState, useRef, useEffect } from 'react';
import type { Message, User, ColorTheme, TextSize } from '../types/chat';
import { ThiingsStickerDisplay } from './ThiingsStickerDisplay';
import { StickerDisplay } from './StickerDisplay';
import { CURATED_THIINGS_STICKERS } from '../data/thiingsStickers';
import { CheckCheck, Pin, Copy, Smile, CheckCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  sender?: User;
  isPinned: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  searchQuery?: string;
}

const QUICK_REACTIONS = ['🙌', '❤️', '👍', '🔥', '🎉', '😂'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  sender,
  isPinned,
  onToggleReaction,
  onTogglePin,
  searchQuery = '',
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openUpward, setOpenUpward] = useState(true);
  const actionToolbarRef = useRef<HTMLDivElement>(null);

  const handleToggleReactionPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showReactionPicker && actionToolbarRef.current) {
      const rect = actionToolbarRef.current.getBoundingClientRect();
      // If there's insufficient headroom (< 110px from top of viewport), open downward; otherwise upward
      setOpenUpward(rect.top >= 110);
    }
    setShowReactionPicker((prev) => !prev);
  };

  useEffect(() => {
    if (!showReactionPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (actionToolbarRef.current && !actionToolbarRef.current.contains(e.target as Node)) {
        setShowReactionPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReactionPicker]);

  // Map color themes
  const textColorClasses: Record<ColorTheme, string> = {
    black: 'text-[#111827]',
    orange: 'text-[#EA580C]',
    blue: 'text-[#0284C7]',
    pink: 'text-[#DB2777]',
  };

  // Map font sizes to exact specifications (S: 13px, M: 15px, L: 18px, XL: 24px)
  const textSizeClasses: Record<TextSize, string> = {
    S: 'text-[13px] leading-relaxed',
    M: 'text-[15px] leading-relaxed',
    L: 'text-[18px] font-medium leading-relaxed',
    XL: 'text-[24px] font-bold leading-snug',
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.type === 'text') {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to highlight search query in text
  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-slate-900 rounded px-0.5 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Reactions calculations
  const reactionsEntries = Object.entries(message.reactions || {}).filter(([_, users]) => users.length > 0);

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex flex-col mb-3 transition-all ${
        isMe ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender name for contact or You */}
      <div
        className={`text-[11px] font-semibold text-slate-500 mb-1 px-1 select-none flex items-center gap-1.5 ${
          isMe ? 'flex-row-reverse' : ''
        }`}
      >
        <span>{isMe ? 'You' : sender?.name || 'Contact'}</span>
        <span className="text-[10px] text-slate-400 font-normal tabular-nums">
          {message.timestamp}
        </span>
      </div>

      {/* Main Bubble Container with Hover Actions / Mobile Tap Actions */}
      <div className="relative max-w-[88%] sm:max-w-[75%] md:max-w-[70%]">
        {/* Action Bar (hover on desktop OR tap on mobile) */}
        <div
          ref={actionToolbarRef}
          className={`absolute bottom-full mb-1 z-20 ${
            showMobileActions ? 'flex' : 'hidden group-hover:flex'
          } items-center gap-0.5 bg-white border border-[#E5E7EB] shadow-popover rounded-full p-0.5 transition-all ${
            isMe ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Reaction Picker Button */}
          <button
            type="button"
            onClick={handleToggleReactionPicker}
            title="Add Reaction"
            className="p-1.5 sm:p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {/* Pin Button */}
          <button
            type="button"
            onClick={() => {
              onTogglePin(message.id);
              setShowMobileActions(false);
            }}
            title={isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดข้อความ (Pin)'}
            className={`p-1.5 sm:p-1 rounded-full transition-colors cursor-pointer ${
              isPinned
                ? 'text-[#F97316] bg-orange-50 hover:bg-orange-100'
                : 'text-slate-500 hover:text-[#F97316] hover:bg-slate-100'
            }`}
          >
            <Pin className="w-3.5 h-3.5" fill={isPinned ? '#F97316' : 'none'} />
          </button>

          {/* Copy Button */}
          {message.type === 'text' && (
            <button
              type="button"
              onClick={handleCopy}
              title="คัดลอกข้อความ (Copy)"
              className="p-1.5 sm:p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {copied ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Quick Reactions Popover (Direction-aware: flips inward based on side) */}
          {showReactionPicker && (
            <div
              className={`absolute ${
                openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
              } ${
                isMe ? 'right-0' : 'left-0'
              } bg-white border border-[#E5E7EB] shadow-popover rounded-full px-2 py-1 flex items-center gap-1 sm:gap-1.5 z-30 animate-scaleIn whitespace-nowrap max-w-[calc(100vw-2rem)] select-none`}
              onMouseLeave={() => setShowReactionPicker(false)}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onToggleReaction(message.id, emoji);
                    setShowReactionPicker(false);
                    setShowMobileActions(false);
                  }}
                  className="hover:scale-125 transition-transform text-sm sm:text-base p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Bubble Card */}
        <div
          onClick={() => setShowMobileActions(!showMobileActions)}
          className={`rounded-2xl border transition-all cursor-pointer sm:cursor-default ${
            isMe
              ? 'bg-[#FFFFFF] border-[#E2E8F0] shadow-xs rounded-br-xs'
              : 'bg-white border-[#E5E7EB] shadow-subtle rounded-bl-xs'
          } ${isPinned ? 'ring-2 ring-[#F97316]/30 border-[#FED7AA]' : ''}`}
        >
          {/* Pinned pill inside card */}
          {isPinned && (
            <div className="flex items-center gap-1 px-3 pt-2 text-[10px] font-bold text-[#EA580C]">
              <Pin className="w-2.5 h-2.5 text-[#F97316]" fill="#F97316" />
              <span>PINNED MESSAGE</span>
            </div>
          )}

          {/* Scheduled Dispatch pill inside card */}
          {message.isScheduledDispatch && (
            <div className="flex items-center gap-1.5 px-3 pt-2 text-[10px] font-bold text-[#0284C7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-pulse"></span>
              <span>📅 SCHEDULED REMINDER</span>
            </div>
          )}

          {/* Content: Thiings 3D Sticker vs Vector Sticker vs Text */}
          <div className="p-3">
            {message.type === 'sticker' ? (
              <div className="my-1 flex items-center justify-center">
                {message.stickerFileId || (message.stickerId && CURATED_THIINGS_STICKERS.some((s) => s.id === message.stickerId)) ? (
                  <ThiingsStickerDisplay
                    fileId={
                      message.stickerFileId ||
                      CURATED_THIINGS_STICKERS.find((s) => s.id === message.stickerId)?.fileId ||
                      ''
                    }
                    name={
                      message.stickerName ||
                      CURATED_THIINGS_STICKERS.find((s) => s.id === message.stickerId)?.name
                    }
                    size="md"
                    interactive
                  />
                ) : message.stickerId ? (
                  <StickerDisplay stickerId={message.stickerId} size="md" />
                ) : null}
              </div>
            ) : (
              <p
                className={`whitespace-pre-wrap break-words tabular-nums ${
                  textColorClasses[message.textColor || 'black']
                } ${textSizeClasses[message.textSize || 'M']}`}
              >
                {renderHighlightedText(message.text)}
              </p>
            )}

            {/* Time & Read Receipts */}
            <div className="flex items-center justify-end gap-1 mt-1.5 select-none">
              <span className="text-[10px] text-slate-400 tabular-nums">
                {message.timestamp}
              </span>

              {isMe && (
                <span title={message.status === 'read' ? 'อ่านแล้ว (Read)' : 'ส่งแล้ว (Sent)'}>
                  {message.status === 'read' ? (
                    // Sky Blue checkmarks
                    <CheckCheck className="w-3.5 h-3.5 text-[#0EA5E9]" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reaction Badges Below Bubble */}
        {reactionsEntries.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-1 ${
              isMe ? 'justify-end' : 'justify-start'
            }`}
          >
            {reactionsEntries.map(([emoji, users]) => {
              const count = users.length;
              return (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReaction(message.id, emoji);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                    // Highlight in Pink #EC4899 when reacted
                    users.length > 0
                      ? 'bg-pink-50 border-[#FBCFE8] text-[#DB2777] shadow-xs hover:bg-pink-100'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title={`${users.join(', ')} reacted`}
                >
                  <span>{emoji}</span>
                  <span className="text-[11px] tabular-nums font-bold">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
