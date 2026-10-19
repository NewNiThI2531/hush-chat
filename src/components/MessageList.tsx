import React, { useEffect, useRef } from 'react';
import type { Message, User } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { MessageSquareDashed, Lock } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  contact: User;
  pinnedMessageId?: string | null;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  searchQuery?: string;
  jumpTargetId?: string | null;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  contact,
  pinnedMessageId,
  onToggleReaction,
  onTogglePin,
  searchQuery = '',
  jumpTargetId,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (!jumpTargetId && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, contact.id]);

  // Jump to specific message (e.g., from pinned message banner)
  useEffect(() => {
    if (jumpTargetId) {
      const el = document.getElementById(`msg-${jumpTargetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-orange-50/80', 'transition-all');
        const timer = setTimeout(() => {
          el.classList.remove('bg-orange-50/80');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [jumpTargetId]);

  // Filter messages by search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.type === 'text' && m.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-2 bg-[#F8FAFC]"
    >
      {/* End-to-End Encryption Notice at top */}
      <div className="flex flex-col items-center justify-center my-4 select-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-slate-500 text-xs shadow-xs">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>การสนทนาถูกเข้ารหัสแบบส่วนตัวระหว่างคุณและ {contact.name}</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1.5">
          ประวัติการสนทนาจะถูกเคลียร์อัตโนมัติเมื่อครบ 90 วัน
        </div>
      </div>

      {/* Date badge */}
      <div className="flex items-center justify-center my-4 select-none">
        <div className="text-[11px] font-bold tracking-wider text-slate-500 bg-white border border-[#E5E7EB] px-3.5 py-1 rounded-full shadow-xs">
          Today, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Empty Search Results */}
      {filteredMessages.length === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <MessageSquareDashed className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">
            ไม่พบข้อความที่ตรงกับ "{searchQuery}"
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ลองค้นหาด้วยคำอื่น หรือคลิกเครื่องหมายกากบาทเพื่อล้างการค้นหา
          </p>
        </div>
      )}

      {/* Message List */}
      {filteredMessages.map((message) => {
        const isMe = message.senderId === currentUser.id;
        const sender = isMe ? currentUser : contact;
        const isPinned = message.id === pinnedMessageId;

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isMe={isMe}
            sender={sender}
            isPinned={isPinned}
            onToggleReaction={onToggleReaction}
            onTogglePin={onTogglePin}
            searchQuery={searchQuery}
          />
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
};
