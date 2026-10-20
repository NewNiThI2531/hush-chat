import type { User, Message, ColorTheme, TextSize, ContactPreference, UserContact, Schedule, AccessLevel } from '../types/chat';
import { MOCK_USERS, INITIAL_MESSAGES, INITIAL_PINNED, INITIAL_CONTACT_PREFERENCES, INITIAL_USER_CONTACTS, INITIAL_SCHEDULES } from '../data/mockData';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'hush_current_user_id',
  USERS: 'hush_users_v1_1',
  CONTACT_PREFERENCES: 'hush_contact_prefs_v1',
  USER_CONTACTS: 'hush_user_contacts_v1',
  MESSAGES: 'hush_messages_v1',
  PINNED: 'hush_pinned_v1',
  SCHEDULES: 'hush_schedules_v1',
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
    let raw = localStorage.getItem(STORAGE_KEYS.USERS);
    // Backward compatibility: migrate from v1 if v1_1 is not initialized
    if (!raw) {
      const v1Raw = localStorage.getItem('hush_users_v1');
      if (v1Raw) {
        raw = v1Raw;
      }
    }

    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
      return MOCK_USERS;
    }

    try {
      const parsed: User[] = JSON.parse(raw);
      let needsSave = false;

      // Ensure system accounts exist
      const hasAdmin = parsed.some(u => u.id === 'admin' || u.accountType === 'SYSTEM_ADMIN');
      const hasAlex = parsed.some(u => u.id === 'alex');
      let combined = [...parsed];

      if (!hasAdmin) {
        const adminUser = MOCK_USERS.find(u => u.id === 'admin');
        if (adminUser) {
          combined.unshift(adminUser);
          needsSave = true;
        }
      }

      if (!hasAlex) {
        const alexUser = MOCK_USERS.find(u => u.id === 'alex');
        if (alexUser) {
          combined.push(alexUser);
          needsSave = true;
        }
      }

      const migrated: User[] = combined.map(u => {
        const parts = (u.name || '').trim().split(' ');
        const first = u.firstName || parts[0] || u.id;
        const last = u.lastName || parts.slice(1).join(' ') || '';

        const accountType = u.accountType || (u.id === 'admin' ? 'SYSTEM_ADMIN' : (u.id === 'alex' ? 'OWNER_ADMIN' : 'MEMBER'));
        const accessLevel = u.accessLevel || (accountType === 'SYSTEM_ADMIN' || accountType === 'OWNER_ADMIN' ? 'FULL_ACCESS' : (u.id === 'marcus' || u.id === 'sophie' ? 'VIEW_ALL' : 'USER'));
        const canChat = u.canChat !== undefined ? u.canChat : accountType !== 'SYSTEM_ADMIN';
        const password = u.password || 'password123';
        const createdAt = u.createdAt || '2026-10-01T00:00:00.000Z';

        if (
          !u.firstName ||
          !u.lastName ||
          !u.accountType ||
          !u.accessLevel ||
          u.canChat === undefined ||
          !u.password ||
          !u.createdAt
        ) {
          needsSave = true;
        }

        return {
          ...u,
          firstName: first,
          lastName: last,
          name: `${first} ${last}`.trim(),
          jobTitle: u.jobTitle || u.role,
          role: u.jobTitle || u.role,
          accountType,
          accessLevel,
          canChat,
          password,
          createdAt,
        };
      });

      if (needsSave) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(migrated));
      }
      return migrated;
    } catch {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
      return MOCK_USERS;
    }
  },

  getUserById(id: string): User | undefined {
    const users = this.getAllUsers();
    return users.find(u => u.id === id);
  },

  getUserByUsername(username: string): User | undefined {
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    const users = this.getAllUsers();
    return users.find(u => u.username.toLowerCase() === clean);
  },

  createUser(params: {
    username: string;
    password?: string;
    firstName: string;
    lastName: string;
    jobTitle?: string;
    bio?: string;
    phone?: string;
    age?: number | string;
    avatarColor?: ColorTheme;
    avatarUrl?: string;
    accessLevel: AccessLevel;
  }): User {
    const cleanUsername = params.username.trim().replace(/^@/, '').toLowerCase();
    if (!cleanUsername) {
      throw new Error('กรุณาระบุ Username');
    }

    const users = this.getAllUsers();
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      throw new Error(`Username @${cleanUsername} ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น`);
    }

    const first = params.firstName.trim();
    const last = params.lastName.trim();
    if (!first || !last) {
      throw new Error('กรุณาระบุทั้งชื่อจริงและนามสกุล');
    }

    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const initials = (first[0] + (last[0] || '')).toUpperCase();
    const newUser: User = {
      id,
      username: cleanUsername,
      password: params.password?.trim() || 'password123',
      firstName: first,
      lastName: last,
      name: `${first} ${last}`.trim(),
      jobTitle: params.jobTitle?.trim() || undefined,
      role: params.jobTitle?.trim() || undefined,
      bio: params.bio?.trim() || undefined,
      details: params.bio?.trim() || undefined,
      phone: params.phone?.trim() || undefined,
      age: params.age || undefined,
      avatarColor: params.avatarColor || 'blue',
      avatarUrl: params.avatarUrl || undefined,
      initials,
      status: 'offline',
      accountType: 'MEMBER',
      accessLevel: params.accessLevel || 'USER',
      canChat: true,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  updateUserProfile(userId: string, updates: Partial<User>): User {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      throw new Error(`User ${userId} not found`);
    }

    const current = users[index];
    
    // Check username uniqueness if changed
    if (updates.username) {
      const cleanNewUsername = updates.username.trim().replace(/^@/, '').toLowerCase();
      if (cleanNewUsername !== current.username.toLowerCase()) {
        const conflict = users.some(u => u.id !== userId && u.username.toLowerCase() === cleanNewUsername);
        if (conflict) {
          throw new Error(`Username @${cleanNewUsername} ถูกใช้งานแล้ว`);
        }
        updates.username = cleanNewUsername;
      }
    }

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
      initials: ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || current.initials,
    };

    users[index] = updatedUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return updatedUser;
  },

  // ----------------------------------------------------
  // User Contacts & Friendships (1:1 Friend Directory)
  // ----------------------------------------------------
  getAllUserContacts(): UserContact[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_CONTACTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USER_CONTACTS, JSON.stringify(INITIAL_USER_CONTACTS));
      return INITIAL_USER_CONTACTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USER_CONTACTS;
    }
  },

  // Returns list of users that currentUser is permitted to see / chat with based on RBAC
  getVisibleContactsForUser(currentUser: User): User[] {
    // 1. SYSTEM_ADMIN cannot chat with anyone
    if (!currentUser.canChat || currentUser.accountType === 'SYSTEM_ADMIN') {
      return [];
    }

    const allUsers = this.getAllUsers();
    // Eligible chat targets (exclude SYSTEM_ADMIN and self)
    const chatEligible = allUsers.filter(u => u.canChat && u.id !== currentUser.id && u.accountType !== 'SYSTEM_ADMIN');

    // 2. OWNER_ADMIN, FULL_ACCESS, or VIEW_ALL see all eligible chat members
    if (
      currentUser.accountType === 'OWNER_ADMIN' ||
      currentUser.accessLevel === 'FULL_ACCESS' ||
      currentUser.accessLevel === 'VIEW_ALL'
    ) {
      return chatEligible;
    }

    // 3. Standard 'USER' tier only sees contacts added as friends or who have active conversations
    const userContacts = this.getAllUserContacts();
    const friendContactIds = new Set(
      userContacts
        .filter(c => c.ownerUserId === currentUser.id)
        .map(c => c.contactUserId)
    );

    // Also include anyone who has sent a message or received a message in 1:1 conversation
    const messages = this.getAllMessages();
    messages.forEach(m => {
      if (m.senderId === currentUser.id) {
        friendContactIds.add(m.receiverId);
      } else if (m.receiverId === currentUser.id) {
        friendContactIds.add(m.senderId);
      }
    });

    return chatEligible.filter(u => friendContactIds.has(u.id));
  },

  addContactByUsername(ownerUserId: string, rawUsername: string): { user: User; contact: UserContact } {
    const clean = rawUsername.trim().replace(/^@/, '').toLowerCase();
    if (!clean) {
      throw new Error('กรุณาระบุชื่อผู้ใช้งาน (@username)');
    }

    const allUsers = this.getAllUsers();
    const targetUser = allUsers.find(u => u.username.toLowerCase() === clean);

    if (!targetUser) {
      throw new Error(`ไม่พบผู้ใช้งาน @${clean} ในระบบ (กรุณาตรวจสอบตัวสะกด)`);
    }

    if (targetUser.id === ownerUserId) {
      throw new Error('ไม่สามารถเพิ่มตนเองเป็นเพื่อนได้');
    }

    if (targetUser.accountType === 'SYSTEM_ADMIN' || !targetUser.canChat) {
      throw new Error('ไม่สามารถเพิ่มบัญชี System Administrator เป็นเพื่อนหรือเริ่มแชทได้');
    }

    const contacts = this.getAllUserContacts();
    const existing = contacts.find(c => c.ownerUserId === ownerUserId && c.contactUserId === targetUser.id);
    if (existing) {
      throw new Error(`@${clean} (${targetUser.name}) อยู่ในรายชื่อผู้ติดต่อของคุณแล้ว`);
    }

    const newContact: UserContact = {
      id: 'uc_' + Date.now(),
      ownerUserId,
      contactUserId: targetUser.id,
      createdAt: new Date().toISOString(),
    };

    contacts.push(newContact);
    localStorage.setItem(STORAGE_KEYS.USER_CONTACTS, JSON.stringify(contacts));

    return { user: targetUser, contact: newContact };
  },

  // ----------------------------------------------------
  // 1:1 Schedules & Calendar Reminders
  // ----------------------------------------------------
  getAllSchedules(): Schedule[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
      return INITIAL_SCHEDULES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SCHEDULES;
    }
  },

  getSchedulesForConversation(conversationId: string): Schedule[] {
    const all = this.getAllSchedules();
    return all
      .filter(s => s.conversationId === conversationId)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  },

  getUpcomingSchedulesCount(conversationId: string): number {
    const schedules = this.getSchedulesForConversation(conversationId);
    return schedules.filter(s => !s.isTriggered && new Date(s.scheduledAt).getTime() > Date.now()).length;
  },

  createSchedule(params: {
    conversationId: string;
    createdByUserId: string;
    targetUserId: string;
    title: string;
    autoMessage: string;
    scheduledAt: string;
  }): Schedule {
    if (!params.title.trim()) {
      throw new Error('กรุณาระบุหัวข้อนัดหมาย');
    }
    if (!params.autoMessage.trim()) {
      throw new Error('กรุณาระบุข้อความที่จะส่งอัตโนมัติ');
    }
    if (!params.scheduledAt) {
      throw new Error('กรุณาระบุวันและเวลา');
    }

    const all = this.getAllSchedules();
    const newSchedule: Schedule = {
      id: 'sch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversationId: params.conversationId,
      createdByUserId: params.createdByUserId,
      targetUserId: params.targetUserId,
      title: params.title.trim(),
      autoMessage: params.autoMessage.trim(),
      scheduledAt: params.scheduledAt,
      isTriggered: false,
      createdAt: new Date().toISOString(),
    };

    all.push(newSchedule);
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(all));
    return newSchedule;
  },

  deleteSchedule(scheduleId: string): void {
    const all = this.getAllSchedules();
    const filtered = all.filter(s => s.id !== scheduleId);
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(filtered));
  },

  // Real-time dispatcher: checks active schedules where scheduledAt <= now and !isTriggered
  checkAndTriggerDueSchedules(): Schedule[] {
    const schedules = this.getAllSchedules();
    const now = Date.now();
    const dueSchedules = schedules.filter(s => !s.isTriggered && new Date(s.scheduledAt).getTime() <= now);

    if (dueSchedules.length === 0) {
      return [];
    }

    // Mark as triggered and dispatch chat message
    dueSchedules.forEach(due => {
      due.isTriggered = true;

      // Dispatch auto-chat message into the 1:1 conversation
      this.sendMessage({
        conversationId: due.conversationId,
        senderId: due.createdByUserId,
        receiverId: due.targetUserId,
        type: 'text',
        text: `📅 [การแจ้งเตือนตามกำหนดนัดหมาย: ${due.title}]\n\n${due.autoMessage}`,
        textColor: 'blue',
        textSize: 'M',
        isScheduledDispatch: true,
      });
    });

    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    return dueSchedules;
  },

  // ----------------------------------------------------
  // Contact Preferences (Custom Nickname & Chat Background)
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // Messages Management
  // ----------------------------------------------------
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
    isScheduledDispatch?: boolean;
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
      isScheduledDispatch: params.isScheduledDispatch,
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

  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.PINNED);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.USER_CONTACTS);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.CONTACT_PREFERENCES);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
    localStorage.setItem(STORAGE_KEYS.USER_CONTACTS, JSON.stringify(INITIAL_USER_CONTACTS));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(INITIAL_SCHEDULES));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify(INITIAL_PINNED));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'alex');
  }
};
