import React from 'react';
import type { User, Message } from '../types/chat';
import { SoundWaveLogo } from './SoundWaveLogo';
import { Avatar } from './Avatar';
import { Pin, Settings, LogOut, RotateCcw, ShieldAlert, UserPlus, Users } from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  allUsers: User[];
  activeContact?: User;
  onSelectContact: (contact: User) => void;
  onLogout: () => void;
  onResetData: () => void;
  onOpenProfileSettings: () => void;
  onOpenVersionModal: () => void;
  onOpenAdminConsole?: () => void;
  onOpenAddFriend?: () => void;
  pinnedMessage?: Message | null;
  getUnreadCount: (contactId: string) => number;
  getLastMessage: (contactId: string) => Message | undefined;
  getDisplayName: (contact: User) => string;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  allUsers,
  activeContact,
  onSelectContact,
  onLogout,
  onResetData,
  onOpenProfileSettings,
  onOpenVersionModal,
  onOpenAdminConsole,
  onOpenAddFriend,
  pinnedMessage,
  getUnreadCount,
  getLastMessage,
  getDisplayName,
  className = '',
}) => {
  const canManageUsers =
    currentUser.accountType === 'SYSTEM_ADMIN' ||
    currentUser.accountType === 'OWNER_ADMIN' ||
    currentUser.accessLevel === 'FULL_ACCESS';

  const otherContacts = activeContact
    ? allUsers.filter(u => u.id !== currentUser.id && u.id !== activeContact.id)
    : allUsers.filter(u => u.id !== currentUser.id);

  const activeDisplayName = activeContact ? getDisplayName(activeContact) : '';

  return (
    <aside className={`h-full bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 select-none transition-all ${className}`}>
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header with clickable version badge */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <SoundWaveLogo
            size="md"
            versionBadge="v2.0.0-rc.1"
            onVersionClick={onOpenVersionModal}
          />
        </div>

        {/* Quick Admin Actions & Add Friend Bar */}
        <div className="p-3 bg-slate-50 border-b border-[#E5E7EB] space-y-2">
          {canManageUsers && onOpenAdminConsole && (
            <button
              type="button"
              onClick={onOpenAdminConsole}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#111827] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#0EA5E9]" />
                <span>Manage Users / Admin</span>
              </div>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-white/20 text-white">
                RBAC
              </span>
            </button>
          )}

          {onOpenAddFriend && (
            <button
              type="button"
              onClick={onOpenAddFriend}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-[#0EA5E9] border border-[#E5E7EB] hover:border-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span>+ Add Friend by Username</span>
            </button>
          )}
        </div>

        {/* Scrollable contacts section */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {/* Active Contact Card */}
          {activeContact && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                กำลังสนทนา (Active Chat)
              </div>
              <div
                onClick={() => onSelectContact(activeContact)}
                className="bg-[#F8FAFC] border-2 border-[#111827] rounded-2xl p-3.5 shadow-subtle hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    initials={activeContact.initials}
                    avatarUrl={activeContact.avatarUrl}
                    color={activeContact.avatarColor}
                    size="md"
                    status={activeContact.status}
                    showStatus
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#111827] truncate">
                        {activeDisplayName}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{activeContact.status === 'online' ? 'Online' : 'Active'}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {activeDisplayName !== activeContact.name
                        ? `${activeContact.name} • @${activeContact.username}`
                        : `@${activeContact.username} • ${activeContact.role || 'Member'}`}
                    </p>
                  </div>
                </div>

                {/* Pinned preview in active card */}
                {pinnedMessage ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-start gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-[#F97316] shrink-0 mt-0.5" fill="#F97316" />
                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-[#F97316]">ปักหมุด: </span>
                      {pinnedMessage.type === 'sticker' ? '3D สติกเกอร์' : pinnedMessage.text}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-slate-400">
                    <Pin className="w-3 h-3 text-slate-300" />
                    <span className="text-[11px]">ยังไม่มีข้อความปักหมุด</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OTHER CONTACTS Section */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
              <span>รายชื่อผู้ติดต่อ ({allUsers.length})</span>
              {currentUser.accessLevel === 'USER' && (
                <span className="text-[10px] text-sky-600 font-semibold normal-case">
                  เพื่อนที่เพิ่มไว้
                </span>
              )}
            </div>

            {otherContacts.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 space-y-1.5">
                <Users className="w-6 h-6 text-slate-300 mx-auto" />
                <p>ยังไม่มีเพื่อนในรายชื่อ</p>
                <button
                  type="button"
                  onClick={onOpenAddFriend}
                  className="text-[#0EA5E9] font-bold hover:underline text-[11px] cursor-pointer"
                >
                  + กดเพื่อเพิ่มเพื่อนด้วย Username
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {otherContacts.map((contact) => {
                  const unread = getUnreadCount(contact.id);
                  const lastMsg = getLastMessage(contact.id);
                  const contactDisplayName = getDisplayName(contact);

                  return (
                    <button
                      key={contact.id}
                      onClick={() => onSelectContact(contact)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          initials={contact.initials}
                          avatarUrl={contact.avatarUrl}
                          color={contact.avatarColor}
                          size="md"
                          status={contact.status}
                          showStatus
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[#111827] group-hover:text-[#0EA5E9] transition-colors truncate">
                            {contactDisplayName}
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            {lastMsg
                              ? lastMsg.type === 'sticker'
                                ? '🎨 ส่ง 3D สติกเกอร์'
                                : lastMsg.text
                              : `@${contact.username} • ${contact.role || 'Member'}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        {lastMsg && (
                          <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                            {lastMsg.timestamp}
                          </span>
                        )}

                        {/* Unread badge: Orange #F97316 */}
                        {unread > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-extrabold text-white bg-[#F97316] rounded-full shadow-sm tabular-nums animate-pulse">
                            {unread}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Area: Unified Account Owner Profile Bar with Settings Gear & Logout */}
      <div className="p-3.5 border-t border-[#E5E7EB] bg-[#F8FAFC]">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              initials={currentUser.initials}
              avatarUrl={currentUser.avatarUrl}
              color={currentUser.avatarColor}
              size="sm"
              status="online"
              showStatus
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#111827] truncate flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                {currentUser.accountType === 'OWNER_ADMIN' && (
                  <span className="text-[9px] font-extrabold px-1 rounded bg-sky-100 text-[#0284C7]">
                    OWNER
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#0EA5E9] font-medium truncate">
                @{currentUser.username} • {currentUser.accessLevel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Gear Icon: Edit Profile */}
            <button
              type="button"
              onClick={onOpenProfileSettings}
              title="แก้ไขโปรไฟล์ส่วนตัว (Profile Settings ⚙️)"
              className="p-1.5 text-slate-500 hover:text-[#0EA5E9] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              title="ออกจากระบบ (Sign Out)"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Neon Database Sync button */}
        <button
          onClick={onResetData}
          className="w-full mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-sky-600 py-1 transition-colors cursor-pointer"
          title="ซิงค์ข้อมูลล่าสุดกับ Neon Serverless PostgreSQL"
        >
          <RotateCcw className="w-3 h-3 text-sky-500" />
          <span>ซิงค์ฐานข้อมูล (Sync Neon DB)</span>
        </button>
      </div>
    </aside>
  );
};
