import type { User, Message, ColorTheme, TextSize, ContactPreference } from '../types/chat';
import { MOCK_USERS, INITIAL_MESSAGES, INITIAL_PINNED, INITIAL_CONTACT_PREFERENCES } from '../data/mockData';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'hush_current_user_id',
  USERS: 'hush_users_v1',
  CONTACT_PREFERENCES: 'hush_contact_prefs_v1',
  MESSAGES: 'hush_messages_v1',
  PINNED: 'hush_pinned_v1',
  LAST_READ: 'hush_last_read_v1',
};

export const storageService = {
  getCurrentUserId(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || 'alex';
  },

  setCurrentUserId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  getAllUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
      return MOCK_USERS;
    }
    try {
      const parsed: User[] = JSON.parse(raw);
      // Migrate any existing users missing firstName/lastName
      let needsSave = false;
      const migrated = parsed.map(u => {
        if (!u.firstName || !u.lastName) {
          needsSave = true;
          const parts = (u.name || '').trim().split(' ');
          const first = parts[0] || u.id;
          const last = parts.slice(1).join(' ') || '';
          return {
            ...u,
            firstName: u.firstName || first,
            lastName: u.lastName || last,
            name: `${u.firstName || first} ${u.lastName || last}`.trim(),
            jobTitle: u.jobTitle || u.role,
          };
        }
        return u;
      });
      if (needsSave) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(migrated));
      }
      return migrated;
    } catch {
      return MOCK_USERS;
    }
  },

  getUserById(id: string): User | undefined {
    const users = this.getAllUsers();
    return users.find(u => u.id === id);
  },

  updateUserProfile(userId: string, updates: Partial<User>): User {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      throw new Error(`User ${userId} not found`);
    }

    const current = users[index];
    const firstName = updates.firstName !== undefined ? updates.firstName.trim() : current.firstName;
    const lastName = updates.lastName !== undefined ? updates.lastName.trim() : current.lastName;
    const fullName = `${firstName} ${lastName}`.trim();
    const jobTitle = updates.jobTitle !== undefined ? updates.jobTitle.trim() || undefined : current.jobTitle;

    const updatedUser: User = {
      ...current,
      ...updates,
      firstName,
      lastName,
      name: fullName,
      jobTitle,
      role: jobTitle || undefined,
      initials: (firstName[0] || '' + (lastName[0] || '')).toUpperCase() || current.initials,
    };

    users[index] = updatedUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return updatedUser;
  },

  // Contact preferences (Custom nickname and chat background per conversation)
  getAllContactPreferences(): Record<string, ContactPreference> {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACT_PREFERENCES);
    if (!raw) {
      const initialMap: Record<string, ContactPreference> = {};
      Object.entries(INITIAL_CONTACT_PREFERENCES).forEach(([key, val]) => {
        const [owner, target] = key.split('_');
        initialMap[key] = {
          ownerUserId: owner,
          targetUserId: target,
          customNickname: val.customNickname,
          chatBgColor: val.chatBgColor || '#FFFFFF',
          updatedAt: Date.now(),
        };
      });
      localStorage.setItem(STORAGE_KEYS.CONTACT_PREFERENCES, JSON.stringify(initialMap));
      return initialMap;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  getContactPreference(ownerUserId: string, targetUserId: string): ContactPreference {
    const all = this.getAllContactPreferences();
    const key = `${ownerUserId}_${targetUserId}`;
    return all[key] || {
      ownerUserId,
      targetUserId,
      customNickname: undefined,
      chatBgColor: '#FFFFFF',
    };
  },

  setContactNickname(ownerUserId: string, targetUserId: string, customNickname: string): ContactPreference {
    const all = this.getAllContactPreferences();
    const key = `${ownerUserId}_${targetUserId}`;
    const trimmed = customNickname.trim();
    const existing = all[key] || {
      ownerUserId,
      targetUserId,
      chatBgColor: '#FFFFFF',
    };

    const updated: ContactPreference = {
      ...existing,
      customNickname: trimmed.length > 0 ? trimmed : undefined,
      updatedAt: Date.now(),
    };

    all[key] = updated;
    localStorage.setItem(STORAGE_KEYS.CONTACT_PREFERENCES, JSON.stringify(all));
    return updated;
  },

  setChatBackground(ownerUserId: string, targetUserId: string, chatBgColor: string): ContactPreference {
    const all = this.getAllContactPreferences();
    const key = `${ownerUserId}_${targetUserId}`;
    const existing = all[key] || {
      ownerUserId,
      targetUserId,
      customNickname: undefined,
    };

    const updated: ContactPreference = {
      ...existing,
      chatBgColor: chatBgColor || '#FFFFFF',
      updatedAt: Date.now(),
    };

    all[key] = updated;
    localStorage.setItem(STORAGE_KEYS.CONTACT_PREFERENCES, JSON.stringify(all));
    return updated;
  },

  getDisplayName(ownerUserId: string, contact: User): string {
    const pref = this.getContactPreference(ownerUserId, contact.id);
    return pref.customNickname?.trim() ? pref.customNickname : contact.name;
  },

  getChatBackground(ownerUserId: string, contactId: string): string {
    const pref = this.getContactPreference(ownerUserId, contactId);
    return pref.chatBgColor || '#FFFFFF';
  },

  getAllMessages(): Message[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MESSAGES;
    }
  },

  getConversationMessages(conversationId: string): Message[] {
    const all = this.getAllMessages();
    return all.filter(m => m.conversationId === conversationId);
  },

  sendMessage(params: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    type: 'text' | 'sticker';
    text: string;
    stickerId?: string;
    stickerFileId?: string;
    stickerName?: string;
    textColor: ColorTheme;
    textSize: TextSize;
  }): Message {
    const all = this.getAllMessages();
    const now = new Date();
    const newMessage: Message = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      conversationId: params.conversationId,
      senderId: params.senderId,
      receiverId: params.receiverId,
      type: params.type,
      text: params.text,
      stickerId: params.stickerId,
      stickerFileId: params.stickerFileId,
      stickerName: params.stickerName,
      textColor: params.textColor,
      textSize: params.textSize,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now.getTime(),
      status: 'sent',
      reactions: {},
    };

    all.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    return newMessage;
  },

  toggleReaction(messageId: string, emoji: string, userId: string): Message[] {
    const all = this.getAllMessages();
    const target = all.find(m => m.id === messageId);
    if (!target) return all;

    if (!target.reactions) {
      target.reactions = {};
    }

    const currentUsers = target.reactions[emoji] || [];
    if (currentUsers.includes(userId)) {
      target.reactions[emoji] = currentUsers.filter(id => id !== userId);
      if (target.reactions[emoji].length === 0) {
        delete target.reactions[emoji];
      }
    } else {
      target.reactions[emoji] = [...currentUsers, userId];
    }

    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    return all;
  },

  getPinnedMessageId(conversationId: string): string | null {
    const raw = localStorage.getItem(STORAGE_KEYS.PINNED);
    if (!raw) {
      return INITIAL_PINNED[conversationId] || null;
    }
    try {
      const parsed = JSON.parse(raw);
      return parsed[conversationId] ?? (INITIAL_PINNED[conversationId] || null);
    } catch {
      return INITIAL_PINNED[conversationId] || null;
    }
  },

  setPinnedMessageId(conversationId: string, messageId: string | null): void {
    const raw = localStorage.getItem(STORAGE_KEYS.PINNED);
    let map: Record<string, string | null> = { ...INITIAL_PINNED };
    if (raw) {
      try {
        map = { ...map, ...JSON.parse(raw) };
      } catch {
        // ignore
      }
    }

    if (messageId) {
      map[conversationId] = messageId;
    } else {
      delete map[conversationId];
    }

    localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify(map));
  },

  getUnreadCount(conversationId: string, currentUserId: string): number {
    const msgs = this.getConversationMessages(conversationId);
    return msgs.filter(m => m.receiverId === currentUserId && m.status !== 'read').length;
  },

  markConversationAsRead(conversationId: string, currentUserId: string): void {
    const all = this.getAllMessages();
    let changed = false;
    all.forEach(m => {
      if (m.conversationId === conversationId && m.receiverId === currentUserId && m.status !== 'read') {
        m.status = 'read';
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    }
  },

  simulateContactReply(conversationId: string, contactId: string, currentUserId: string): Message {
    const sampleReplies = [
      { text: 'รับทราบครับ! กำลังตรวจสอบข้อมูลชุดนี้ให้อยู่ครับ', color: 'blue' as ColorTheme, size: 'M' as TextSize },
      { text: 'เห็นด้วยเลยครับ ตัวเลขตรงตามเป้าหมาย 100% เลย 🚀', color: 'black' as ColorTheme, size: 'M' as TextSize },
      { text: 'เรียบร้อยครับ! เดี๋ยวผมจัดการส่วนถัดไปให้ทันทีครับ', color: 'orange' as ColorTheme, size: 'M' as TextSize },
      { text: '📌 มีอะไรเพิ่มเติมแจ้งในนี้ได้ตลอดเลยนะครับ', color: 'pink' as ColorTheme, size: 'M' as TextSize },
      { text: 'ยอดเยี่ยมมากครับ! ระบบ HusH เสถียรและเร็วมากจริงๆ', color: 'black' as ColorTheme, size: 'L' as TextSize },
    ];
    const picked = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];

    return this.sendMessage({
      conversationId,
      senderId: contactId,
      receiverId: currentUserId,
      type: 'text',
      text: picked.text,
      textColor: picked.color,
      textSize: picked.size,
    });
  },

  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.PINNED);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CONTACT_PREFERENCES);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify(INITIAL_PINNED));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'alex');
  }
};
