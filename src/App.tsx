import { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, ColorTheme, TextSize, Schedule } from './types/chat';
import { storageService } from './services/storageService';
import { getConversationId } from './data/mockData';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { PinnedMessageBanner } from './components/PinnedMessageBanner';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { RightContactDetailSidebar } from './components/RightContactDetailSidebar';
import { SelfProfileModal } from './components/SelfProfileModal';
import { VersionHandoffModal } from './components/VersionHandoffModal';
import { AdminConsoleModal } from './components/AdminConsoleModal';
import { AddFriendModal } from './components/AddFriendModal';
import { ScheduleModal } from './components/ScheduleModal';
import { ScheduleDueAlertModal } from './components/ScheduleDueAlertModal';
import { Check, UserPlus, Users } from 'lucide-react';

// Web Audio API micro-sound generator for tactile acoustic feedback
const playHapticSound = (type: 'send' | 'receive' | 'pop') => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'send') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'receive') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1050, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
};

export function App() {
  // Force re-render key for storage synchronization
  const [version, setVersion] = useState(0);
  const triggerUpdate = () => setVersion((v) => v + 1);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = storageService.getCurrentUserId();
    if (!savedId) return null;
    const users = storageService.getAllUsers();
    return users.find((u) => u.id === savedId) || null;
  });

  // Initial sync & Background Neon polling for multi-client real-time sync
  useEffect(() => {
    storageService.init().then(() => {
      triggerUpdate();
    });

    const pollInterval = setInterval(() => {
      storageService.syncWithNeon().then(() => {
        triggerUpdate();
      });
    }, 2500);

    return () => clearInterval(pollInterval);
  }, []);

  // Visible contacts based on RBAC
  const visibleContacts = useMemo(() => {
    if (!currentUser) return [];
    return storageService.getVisibleContactsForUser(currentUser);
  }, [currentUser, version]);

  const [activeContact, setActiveContact] = useState<User | undefined>(() => {
    if (!currentUser) return undefined;
    const initialContacts = storageService.getVisibleContactsForUser(currentUser);
    return initialContacts[0];
  });

  // Ensure activeContact is kept in sync when switching user or adding friends
  useEffect(() => {
    if (!currentUser) {
      setActiveContact(undefined);
      return;
    }
    if (currentUser.accountType === 'SYSTEM_ADMIN' || !currentUser.canChat) {
      setActiveContact(undefined);
      return;
    }
    if (!activeContact || !visibleContacts.some((c) => c.id === activeContact.id)) {
      setActiveContact(visibleContacts[0]);
    }
  }, [currentUser, visibleContacts, activeContact]);

  // Responsive layout state:
  // Mobile (< 768px): single pane drill-down navigation ('contacts' or 'chat')
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('chat');
  // Tablet (768px - 1023px): sidebar toggle state
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(true);
  // Right contact detail sidebar toggle (open by default on desktop xl >= 1280px)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1280 : true;
  });

  // Modal dialog states
  const [isSelfProfileOpen, setIsSelfProfileOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [dueAlertSchedule, setDueAlertSchedule] = useState<Schedule | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [jumpTargetId, setJumpTargetId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Real-time schedule checking dispatcher (runs every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      const dueList = storageService.checkAndTriggerDueSchedules();
      if (dueList.length > 0) {
        playHapticSound('pop');
        setDueAlertSchedule(dueList[0]);
        triggerUpdate();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Current conversation ID
  const conversationId = useMemo(() => {
    if (!currentUser || !activeContact) return '';
    return getConversationId(currentUser.id, activeContact.id);
  }, [currentUser, activeContact]);

  // Current conversation messages
  const conversationMessages = useMemo(() => {
    if (!conversationId) return [];
    return storageService.getConversationMessages(conversationId);
  }, [conversationId, version]);

  // Pinned message
  const pinnedMessageId = useMemo(() => {
    if (!conversationId) return null;
    return storageService.getPinnedMessageId(conversationId);
  }, [conversationId, version]);

  const pinnedMessage = useMemo(() => {
    if (!pinnedMessageId) return null;
    return conversationMessages.find((m) => m.id === pinnedMessageId) || null;
  }, [pinnedMessageId, conversationMessages]);

  // Contact preferences: custom nickname & chat background color
  const contactPref = useMemo(() => {
    if (!currentUser || !activeContact) return { customNickname: undefined, chatBgColor: '#FFFFFF' };
    return storageService.getContactPreference(currentUser.id, activeContact.id);
  }, [currentUser, activeContact, version]);

  const chatBgColor = contactPref.chatBgColor || '#FFFFFF';
  const customNickname = contactPref.customNickname || '';

  const getDisplayName = useCallback(
    (contact: User) => {
      if (!currentUser) return contact.name;
      return storageService.getDisplayName(currentUser.id, contact);
    },
    [currentUser, version]
  );

  const activeContactDisplayName = useMemo(() => {
    if (!activeContact) return '';
    return getDisplayName(activeContact);
  }, [getDisplayName, activeContact]);

  // Mark as read whenever activeContact changes or messages update
  useEffect(() => {
    if (currentUser && conversationId) {
      storageService.markConversationAsRead(conversationId, currentUser.id);
      triggerUpdate();
    }
  }, [currentUser, conversationId, activeContact?.id]);

  const handleLogin = (user: User) => {
    storageService.setCurrentUserId(user.id);
    setCurrentUser(user);
    const contacts = storageService.getVisibleContactsForUser(user);
    setActiveContact(contacts[0]);
    setMobileView('chat');
    showToast(`เข้าสู่ระบบในชื่อ ${user.name}`);
    triggerUpdate();
  };

  const handleLogout = () => {
    storageService.setCurrentUserId('');
    setCurrentUser(null);
    setActiveContact(undefined);
    triggerUpdate();
  };

  const handleSelectContact = (contact: User) => {
    setActiveContact(contact);
    setSearchQuery('');
    setJumpTargetId(null);
    setMobileView('chat');
    if (currentUser) {
      const cId = getConversationId(currentUser.id, contact.id);
      storageService.markConversationAsRead(cId, currentUser.id);
      triggerUpdate();
    }
  };

  const handleSendMessage = (text: string, color: ColorTheme, size: TextSize) => {
    if (!currentUser || !activeContact) return;

    storageService.sendMessage({
      conversationId,
      senderId: currentUser.id,
      receiverId: activeContact.id,
      type: 'text',
      text,
      textColor: color,
      textSize: size,
    });

    playHapticSound('send');
    triggerUpdate();
  };

  const handleSendThiingsSticker = (stickerId: string, fileId: string, name: string) => {
    if (!currentUser || !activeContact) return;

    storageService.sendMessage({
      conversationId,
      senderId: currentUser.id,
      receiverId: activeContact.id,
      type: 'sticker',
      text: '',
      stickerId,
      stickerFileId: fileId,
      stickerName: name,
      textColor: 'black',
      textSize: 'M',
    });

    playHapticSound('send');
    showToast(`ส่ง 3D สติกเกอร์: ${name}`);
    triggerUpdate();
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    storageService.toggleReaction(messageId, emoji, currentUser.id);
    playHapticSound('pop');
    triggerUpdate();
  };

  const handleTogglePin = (messageId: string) => {
    if (pinnedMessageId === messageId) {
      storageService.setPinnedMessageId(conversationId, null);
      showToast('ยกเลิกการปักหมุดข้อความ');
    } else {
      storageService.setPinnedMessageId(conversationId, messageId);
      showToast('ปักหมุดข้อความเรียบร้อย');
    }
    triggerUpdate();
  };

  const handleUnpin = () => {
    storageService.setPinnedMessageId(conversationId, null);
    showToast('ยกเลิกการปักหมุดข้อความ');
    triggerUpdate();
  };

  const handleJumpToMessage = (messageId: string) => {
    setJumpTargetId(messageId);
  };

  const handleSyncDatabase = async () => {
    showToast('กำลังซิงค์ข้อมูลกับ Neon Database...');
    await storageService.syncWithNeon();
    showToast('ซิงค์ข้อมูลล่าสุดสำเร็จ ✓');
    triggerUpdate();
  };

  const handleUpdateSelfProfile = (updated: User) => {
    try {
      const saved = storageService.updateUserProfile(updated.id, updated);
      setCurrentUser(saved);
      showToast('บันทึกการแก้ไขโปรไฟล์สำเร็จ');
      triggerUpdate();
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึกโปรไฟล์');
    }
  };

  const handleUpdateNickname = (nickname: string) => {
    if (!currentUser || !activeContact) return;
    storageService.setContactNickname(currentUser.id, activeContact.id, nickname);
    showToast(nickname ? `บันทึกชื่อเล่น "${nickname}" เรียบร้อย` : 'รีเซ็ตชื่อเล่นกลับเป็นชื่อจริงแล้ว');
    triggerUpdate();
  };

  const handleUpdateChatBgColor = (colorHex: string) => {
    if (!currentUser || !activeContact) return;
    storageService.setChatBackground(currentUser.id, activeContact.id, colorHex);
    triggerUpdate();
  };

  const handleFriendAdded = (newFriend: User) => {
    setActiveContact(newFriend);
    setMobileView('chat');
    showToast(`เพิ่ม @${newFriend.username} เป็นเพื่อนเรียบร้อย`);
    triggerUpdate();
  };

  const handleJumpToChatFromAlert = (partnerUser: User) => {
    setActiveContact(partnerUser);
    setDueAlertSchedule(null);
    setMobileView('chat');
  };

  const getUnreadCount = useCallback(
    (contactId: string) => {
      if (!currentUser) return 0;
      const cId = getConversationId(currentUser.id, contactId);
      return storageService.getUnreadCount(cId, currentUser.id);
    },
    [currentUser, version]
  );

  const getLastMessage = useCallback(
    (contactId: string) => {
      if (!currentUser) return undefined;
      const cId = getConversationId(currentUser.id, contactId);
      const msgs = storageService.getConversationMessages(cId);
      return msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
    },
    [currentUser, version]
  );

  // Total unread count across visible contacts (for mobile back button badge)
  const totalUnreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return visibleContacts.reduce((sum, u) => sum + getUnreadCount(u.id), 0);
  }, [currentUser, visibleContacts, getUnreadCount, version]);

  // If not logged in, render Login Page
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // If logged in as SYSTEM_ADMIN (canChat === false), route directly to Admin Console View!
  if (currentUser.accountType === 'SYSTEM_ADMIN' || !currentUser.canChat) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC]">
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-popover flex items-center gap-2 border border-slate-700 animate-slideDown">
            <Check className="w-4 h-4 text-[#0EA5E9]" />
            <span>{toastMessage}</span>
          </div>
        )}
        <AdminConsoleModal
          isOpen={true}
          onClose={() => {}}
          currentUser={currentUser}
          onSwitchUser={(user) => handleLogin(user)}
          onUsersUpdated={triggerUpdate}
          isStandalonePage={true}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  const upcomingSchedulesCount = conversationId
    ? storageService.getUpcomingSchedulesCount(conversationId)
    : 0;

  return (
    <div className="flex h-dvh w-full bg-[#F8FAFC] overflow-hidden select-text relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-popover flex items-center gap-2 border border-slate-700 animate-slideDown">
          <Check className="w-4 h-4 text-[#0EA5E9]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Left Sidebar (w-72 / 288px on Desktop lg+, adaptive on mobile/tablet) */}
      <Sidebar
        currentUser={currentUser}
        allUsers={visibleContacts}
        activeContact={activeContact}
        onSelectContact={handleSelectContact}
        onLogout={handleLogout}
        onResetData={handleSyncDatabase}
        onOpenProfileSettings={() => setIsSelfProfileOpen(true)}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        onOpenAdminConsole={() => setIsAdminConsoleOpen(true)}
        onOpenAddFriend={() => setIsAddFriendOpen(true)}
        pinnedMessage={pinnedMessage}
        getUnreadCount={getUnreadCount}
        getLastMessage={getLastMessage}
        getDisplayName={getDisplayName}
        className={`
          ${mobileView === 'contacts' ? 'flex w-full' : 'hidden'}
          ${tabletSidebarOpen ? 'md:flex md:w-72 lg:w-72' : 'md:hidden lg:flex lg:w-72'}
        `}
      />

      {/* 2. Main Chat Area: min-w-0 flex-1 ensures wrapping without horizontal overflow */}
      <main
        className={`min-w-0 flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden relative ${
          mobileView === 'chat' ? 'flex w-full' : 'hidden md:flex'
        }`}
      >
        {activeContact ? (
          <>
            {/* Header */}
            <ChatHeader
              contact={activeContact}
              displayedName={activeContactDisplayName}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenSchedule={() => setIsScheduleModalOpen(true)}
              upcomingSchedulesCount={upcomingSchedulesCount}
              totalMessagesCount={conversationMessages.length}
              filteredMessagesCount={conversationMessages.length}
              onBackToContacts={() => setMobileView('contacts')}
              totalUnreadCount={totalUnreadCount}
              onToggleSidebar={() => setTabletSidebarOpen(!tabletSidebarOpen)}
              isSidebarOpen={tabletSidebarOpen}
              onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              isRightSidebarOpen={isRightSidebarOpen}
            />

            {/* Pinned Message Bar */}
            {pinnedMessage && (
              <PinnedMessageBanner
                pinnedMessage={pinnedMessage}
                sender={pinnedMessage.senderId === currentUser.id ? currentUser : activeContact}
                onJumpToMessage={handleJumpToMessage}
                onUnpin={handleUnpin}
              />
            )}

            {/* Message List with custom background theme */}
            <MessageList
              messages={conversationMessages}
              currentUser={currentUser}
              contact={activeContact}
              pinnedMessageId={pinnedMessageId}
              onToggleReaction={handleToggleReaction}
              onTogglePin={handleTogglePin}
              searchQuery={searchQuery}
              jumpTargetId={jumpTargetId}
              chatBgColor={chatBgColor}
            />

            {/* Bottom Composer & Thiings.co 3D Sticker Picker */}
            <ChatInput
              onSendMessage={handleSendMessage}
              onSendThiingsSticker={handleSendThiingsSticker}
            />
          </>
        ) : (
          /* Empty State when user has no contacts (e.g. USER tier with empty friend list) */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 text-[#0EA5E9] flex items-center justify-center mb-4 border border-sky-100 shadow-sm">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#111827] mb-1">
              ยังไม่มีคู่สนทนาในรายชื่อเพื่อน
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
              บัญชีของคุณอยู่ในสิทธิ์ระดับ <strong>Standard Member (USER)</strong> ซึ่งจะมองเห็นเฉพาะเพื่อนที่คุณได้เพิ่มไว้เท่านั้น
            </p>
            <button
              type="button"
              onClick={() => setIsAddFriendOpen(true)}
              className="px-5 py-2.5 bg-[#111827] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#0EA5E9]" />
              <span>+ เพิ่มเพื่อนด้วย Username</span>
            </button>
          </div>
        )}
      </main>

      {/* 3. Right Sidebar — Contact Profile Detail & Chat Customization Panel */}
      {activeContact && (
        <RightContactDetailSidebar
          contact={activeContact}
          customNickname={customNickname}
          chatBgColor={chatBgColor}
          onUpdateNickname={handleUpdateNickname}
          onUpdateChatBgColor={handleUpdateChatBgColor}
          onClose={() => setIsRightSidebarOpen(false)}
          isOpen={isRightSidebarOpen}
        />
      )}

      {/* Modals */}
      <SelfProfileModal
        currentUser={currentUser}
        isOpen={isSelfProfileOpen}
        onClose={() => setIsSelfProfileOpen(false)}
        onSave={handleUpdateSelfProfile}
      />

      <VersionHandoffModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />

      {/* Admin Console Modal (for OWNER_ADMIN or FULL_ACCESS) */}
      <AdminConsoleModal
        isOpen={isAdminConsoleOpen}
        onClose={() => setIsAdminConsoleOpen(false)}
        currentUser={currentUser}
        onSwitchUser={(user) => handleLogin(user)}
        onUsersUpdated={triggerUpdate}
      />

      {/* Add Friend by Username Modal */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        currentUser={currentUser}
        onFriendAdded={handleFriendAdded}
      />

      {/* 1:1 Schedule & Calendar Modal */}
      {activeContact && (
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          currentUser={currentUser}
          contact={activeContact}
          displayedContactName={activeContactDisplayName}
          conversationId={conversationId}
          onScheduleCreated={triggerUpdate}
          onScheduleDeleted={triggerUpdate}
        />
      )}

      {/* Real-time Schedule Due Pop-up Alert */}
      {dueAlertSchedule && (
        <ScheduleDueAlertModal
          schedule={dueAlertSchedule}
          partnerUser={
            storageService.getAllUsers().find(
              (u) =>
                u.id ===
                (dueAlertSchedule.createdByUserId === currentUser.id
                  ? dueAlertSchedule.targetUserId
                  : dueAlertSchedule.createdByUserId)
            )
          }
          onJumpToChat={handleJumpToChatFromAlert}
          onDismiss={() => setDueAlertSchedule(null)}
        />
      )}
    </div>
  );
}

export default App;
