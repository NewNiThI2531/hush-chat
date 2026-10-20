import React, { useState } from 'react';
import type { User } from '../types/chat';
import { Avatar } from './Avatar';
import { Search, X, Shield, Bot, ChevronLeft, PanelLeft, PanelRight } from 'lucide-react';

interface ChatHeaderProps {
  contact: User;
  displayedName?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSimulateReply: () => void;
  totalMessagesCount: number;
  filteredMessagesCount: number;
  onBackToContacts?: () => void;
  totalUnreadCount?: number;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  isRightSidebarOpen?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  contact,
  displayedName,
  searchQuery,
  onSearchChange,
  onSimulateReply,
  totalMessagesCount,
  filteredMessagesCount,
  onBackToContacts,
  totalUnreadCount = 0,
  onToggleSidebar,
  onToggleRightSidebar,
  isRightSidebarOpen,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="h-16 px-3 sm:px-5 bg-white border-b border-[#E5E7EB] flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 select-none">
      {/* Mobile Search Overlay when expanded */}
      {mobileSearchOpen ? (
        <div className="flex items-center gap-2 w-full animate-fadeIn sm:hidden">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาข้อความ..."
              className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setMobileSearchOpen(false);
              onSearchChange('');
            }}
            className="text-xs font-semibold text-slate-600 px-2 py-1.5"
          >
            ยกเลิก
          </button>
        </div>
      ) : (
        <>
          {/* Left: Mobile Back Button + Tablet Sidebar Toggle + Contact Info */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {/* Mobile Back Button (< 768px) with unread badge */}
            {onBackToContacts && (
              <button
                onClick={onBackToContacts}
                className="flex items-center gap-0.5 p-1.5 -ml-1 text-slate-700 hover:text-[#0EA5E9] hover:bg-slate-100 rounded-xl transition-colors md:hidden"
                title="กลับไปหน้ารายชื่อผู้ติดต่อ (Contacts)"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
                {totalUnreadCount > 0 && (
                  <span className="min-w-[18px] h-4 px-1 text-[10px] font-bold text-white bg-[#F97316] rounded-full flex items-center justify-center tabular-nums">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Tablet Sidebar Toggle (768px - 1023px) */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden md:flex lg:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="ย่อ/ขยายแถบรายชื่อผู้ติดต่อ"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* Contact Avatar & Status */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                initials={contact.initials}
                avatarUrl={contact.avatarUrl}
                color={contact.avatarColor}
                size="md"
                status={contact.status}
                showStatus
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-[#111827] truncate">
                    {displayedName || contact.name}
                  </h2>
                  {displayedName && displayedName !== contact.name && (
                    <span className="text-[11px] text-slate-400 font-normal truncate hidden sm:inline">
                      ({contact.name})
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hidden xl:inline-block">
                    {contact.role}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="hidden sm:inline">
                      {contact.status === 'online'
                        ? 'Online'
                        : contact.status === 'away'
                        ? 'Away'
                        : 'Offline'}
                    </span>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="tabular-nums truncate text-[11px] sm:text-xs">
                    {searchQuery
                      ? `พบ ${filteredMessagesCount} จาก ${totalMessagesCount} ข้อความ`
                      : `${totalMessagesCount} ข้อความ`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center / Right: Search & Auto-clear Policy Badge & Right Sidebar Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Desktop / Tablet Search Input */}
            <div className="relative hidden sm:block w-40 md:w-56 lg:w-60">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ค้นหาข้อความในแชท..."
                className="w-full pl-8 pr-7 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#111827] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Search Icon Trigger */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 sm:hidden"
              title="ค้นหาข้อความ"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* 90-day retention notice pill (Desktop / Laptop) */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>Auto-clears after 3 months</span>
            </div>

            {/* Simulate contact reply button */}
            <button
              onClick={onSimulateReply}
              title="จำลองให้คู่สนทนาตอบกลับทันที (สำหรับทดสอบ)"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#0EA5E9] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-xl transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate</span>
            </button>

            {/* Right Contact Detail Sidebar Toggle Button */}
            {onToggleRightSidebar && (
              <button
                type="button"
                onClick={onToggleRightSidebar}
                title={isRightSidebarOpen ? 'ปิดแถบข้อมูลคู่สนทนา' : 'เปิดแถบข้อมูลคู่สนทนา & ตั้งค่าสีแชท'}
                className={`p-2 rounded-xl border transition-all ${
                  isRightSidebarOpen
                    ? 'bg-[#111827] text-white border-[#111827]'
                    : 'bg-white text-slate-600 border-[#E5E7EB] hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <PanelRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      )}
    </header>
  );
};
