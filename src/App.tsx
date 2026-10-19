import { useState, useEffect, useMemo, useCallback } from 'react';
import type { User, ColorTheme, TextSize } from './types/chat';
import { storageService } from './services/storageService';
import { getConversationId, MOCK_USERS } from './data/mockData';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { PinnedMessageBanner } from './components/PinnedMessageBanner';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { Check } from 'lucide-react';

// Web Audio API micro-sound generator for premium tactile feedback
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
    }
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
};

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = storageService.getCurrentUserId();
    return storageService.getUserById(savedId) || MOCK_USERS[0];
  });

  const [activeContact, setActiveContact] = useState<User>(() => {
    const currentId = storageService.getCurrentUserId();
    const other = MOCK_USERS.find((u) => u.id !== currentId) || MOCK_USERS[1];
    return other;
  });

  // Responsive state:
  // Mobile (< 768px): single pane drill-down navigation ('contacts' or 'chat')
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('chat');
  // Tablet (768px - 1023px): sidebar toggle state
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [jumpTargetId, setJumpTargetId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Force re-render key for storage synchronization
  const [version, setVersion] = useState(0);
  const triggerUpdate = () => setVersion((v) => v + 1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Current conversation ID
  const conversationId = useMemo(() => {
    if (!currentUser) return '';
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

  // Mark as read whenever activeContact changes or messages update
  useEffect(() => {
    if (currentUser && conversationId) {
      storageService.markConversationAsRead(conversationId, currentUser.id);
      triggerUpdate();
    }
  }, [currentUser, conversationId, activeContact.id]);

  const handleLogin = (user: User) => {
    storageService.setCurrentUserId(user.id);
    setCurrentUser(user);
    // Select first other contact
    const defaultOther = MOCK_USERS.find((u) => u.id !== user.id) || MOCK_USERS[0];
    setActiveContact(defaultOther);
    setMobileView('chat');
    showToast(`เข้าสู่ระบบในชื่อ ${user.name}`);
    triggerUpdate();
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleQuickSwitchUser = (targetUser: User) => {
    if (!currentUser) return;
    const previousUser = currentUser;
    storageService.setCurrentUserId(targetUser.id);
    setCurrentUser(targetUser);

    // Make previous user active contact so you can test two-way chat immediately
    setActiveContact(previousUser);
    setMobileView('chat');
    showToast(`สลับบัญชีเป็น ${targetUser.name}`);
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
    if (!currentUser) return;

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
    if (!currentUser) return;

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

  const handleSimulateReply = () => {
    if (!currentUser) return;
    storageService.simulateContactReply(conversationId, activeContact.id, currentUser.id);
    playHapticSound('receive');
    showToast(`${activeContact.name} ตอบกลับข้อความแล้ว`);
    triggerUpdate();
  };

  const handleResetData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูล Mockup ทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      storageService.resetDemoData();
      const defaultUser = MOCK_USERS[0];
      setCurrentUser(defaultUser);
      setActiveContact(MOCK_USERS[1]);
      setMobileView('chat');
      showToast('รีเซ็ตข้อมูลทดสอบสำเร็จ');
      triggerUpdate();
    }
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

  // Total unread count across all contacts (for mobile back button badge)
  const totalUnreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return MOCK_USERS.filter((u) => u.id !== currentUser.id).reduce(
      (sum, u) => sum + getUnreadCount(u.id),
      0
    );
  }, [currentUser, getUnreadCount, version]);

  // If not logged in, render Login Page
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] overflow-hidden select-text">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-popover flex items-center gap-2 border border-slate-700 animate-slideDown">
          <Check className="w-4 h-4 text-[#0EA5E9]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Left Sidebar (Adaptive single-pane on mobile, responsive split-view on iPad/Desktop) */}
      <Sidebar
        currentUser={currentUser}
        allUsers={MOCK_USERS}
        activeContact={activeContact}
        onSelectContact={handleSelectContact}
        onQuickSwitchUser={handleQuickSwitchUser}
        onLogout={handleLogout}
        onResetData={handleResetData}
        pinnedMessage={pinnedMessage}
        getUnreadCount={getUnreadCount}
        getLastMessage={getLastMessage}
        className={`
          ${mobileView === 'contacts' ? 'flex w-full' : 'hidden'}
          ${tabletSidebarOpen ? 'md:flex md:w-72 lg:w-80' : 'md:hidden lg:flex lg:w-80'}
        `}
      />

      {/* 2. Main Chat Area */}
      <main
        className={`flex-1 flex-col h-full bg-[#F8FAFC] overflow-hidden relative ${
          mobileView === 'chat' ? 'flex w-full' : 'hidden md:flex'
        }`}
      >
        {/* Header */}
        <ChatHeader
          contact={activeContact}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSimulateReply={handleSimulateReply}
          totalMessagesCount={conversationMessages.length}
          filteredMessagesCount={conversationMessages.length}
          onBackToContacts={() => setMobileView('contacts')}
          totalUnreadCount={totalUnreadCount}
          onToggleSidebar={() => setTabletSidebarOpen(!tabletSidebarOpen)}
          isSidebarOpen={tabletSidebarOpen}
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

        {/* Message List */}
        <MessageList
          messages={conversationMessages}
          currentUser={currentUser}
          contact={activeContact}
          pinnedMessageId={pinnedMessageId}
          onToggleReaction={handleToggleReaction}
          onTogglePin={handleTogglePin}
          searchQuery={searchQuery}
          jumpTargetId={jumpTargetId}
        />

        {/* Bottom Composer & Thiings.co 3D Sticker Picker */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendThiingsSticker={handleSendThiingsSticker}
        />
      </main>
    </div>
  );
}

export default App;
