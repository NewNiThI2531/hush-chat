import type {
  User,
  Message,
  ColorTheme,
  TextSize,
  ContactPreference,
  UserContact,
  Schedule,
  AccessLevel,
} from '../types/chat';
import { sql } from './neonClient';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'hush_current_user_id_v2',
  USERS_CACHE: 'hush_users_cache_v2',
  CONTACTS_CACHE: 'hush_contacts_cache_v2',
  CONVERSATIONS_CACHE: 'hush_conversations_cache_v2',
  MESSAGES_CACHE: 'hush_messages_cache_v2',
  REACTIONS_CACHE: 'hush_reactions_cache_v2',
  SCHEDULES_CACHE: 'hush_schedules_cache_v2',
};

// Strict Per-Message 90-Day Rolling Retention TTL (90 days in ms)
export const MESSAGE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

// Purge all legacy mockup and demo keys from browser storage
function purgeLegacyMockStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const legacyKeys = [
    'hush_users',
    'hush_users_v1',
    'hush_users_v1_1',
    'hush_contact_prefs_v1',
    'hush_user_contacts_v1',
    'hush_messages_v1',
    'hush_messages',
    'hush_pinned_v1',
    'hush_schedules_v1',
    'hush_schedules',
    'hush_last_read_v1',
    'hush_current_user_id',
    'hush_mock_users',
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('hush_mock_') || k.startsWith('hush_demo_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage errors
  }
}

// Simple client-side SHA-256 generator
async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for environments without crypto.subtle
  return text;
}

interface RawDbUser {
  id: string;
  username: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  bio?: string;
  phone?: string;
  age?: number;
  show_phone?: boolean;
  show_age?: boolean;
  avatar_url?: string;
  avatar_color?: string;
  account_type: string;
  access_level: string;
  can_chat: boolean;
  is_immutable_admin: boolean;
  is_online: boolean;
  created_at: string;
}

interface RawDbContact {
  id: string;
  owner_user_id: string;
  contact_user_id: string;
  custom_nickname?: string;
  chat_bg_color?: string;
  created_at: string;
}

interface RawDbConversation {
  id: string;
  user_one_id: string;
  user_two_id: string;
  pinned_message_id?: string;
  created_at: string;
  updated_at: string;
}

interface RawDbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  text_color: string;
  font_size: string;
  sticker_id?: string;
  is_scheduled: boolean;
  created_at: string;
}

interface RawDbReaction {
  message_id: string;
  user_id: string;
  emoji: string;
}

interface RawDbSchedule {
  id: string;
  conversation_id: string;
  creator_id: string;
  participant_id: string;
  title: string;
  auto_message: string;
  scheduled_at: string;
  is_triggered: boolean;
  created_at: string;
}

function mapUser(row: RawDbUser): User {
  const firstName = row.first_name || '';
  const lastName = row.last_name || '';
  const name = `${firstName} ${lastName}`.trim() || row.username;
  const initials =
    ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() ||
    row.username.substring(0, 2).toUpperCase();

  const colorMap: Record<string, ColorTheme> = {
    black: 'black',
    blue: 'blue',
    pink: 'pink',
    orange: 'orange',
  };
  const avatarColor = colorMap[row.avatar_color || ''] || 'blue';

  return {
    id: row.id,
    username: row.username,
    firstName,
    lastName,
    name,
    jobTitle: row.job_title || undefined,
    role: row.job_title || undefined,
    initials,
    avatarColor,
    avatarUrl: row.avatar_url || undefined,
    phone: row.phone || undefined,
    age: row.age || undefined,
    showPhone: row.show_phone !== undefined ? Boolean(row.show_phone) : true,
    showAge: row.show_age !== undefined ? Boolean(row.show_age) : true,
    bio: row.bio || undefined,
    details: row.bio || undefined,
    status: row.is_online ? 'online' : 'offline',
    accountType: row.account_type as User['accountType'],
    accessLevel: row.access_level as AccessLevel,
    canChat: Boolean(row.can_chat),
    isImmutableAdmin: Boolean(row.is_immutable_admin),
    createdAt: row.created_at,
  };
}

// In-Memory cache for 60fps synchronous UI renders
class StorageService {
  private usersCache: User[] = [];
  private contactsCache: UserContact[] = [];
  private conversationsCache: RawDbConversation[] = [];
  private messagesCache: Message[] = [];
  private reactionsCache: Record<string, Record<string, string[]>> = {};
  private schedulesCache: Schedule[] = [];
  private isInitialized = false;

  constructor() {
    purgeLegacyMockStorage();
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    try {
      const u = localStorage.getItem(STORAGE_KEYS.USERS_CACHE);
      if (u) this.usersCache = JSON.parse(u);

      const c = localStorage.getItem(STORAGE_KEYS.CONTACTS_CACHE);
      if (c) this.contactsCache = JSON.parse(c);

      const conv = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS_CACHE);
      if (conv) this.conversationsCache = JSON.parse(conv);

      const m = localStorage.getItem(STORAGE_KEYS.MESSAGES_CACHE);
      if (m) this.messagesCache = JSON.parse(m);

      const r = localStorage.getItem(STORAGE_KEYS.REACTIONS_CACHE);
      if (r) this.reactionsCache = JSON.parse(r);

      const s = localStorage.getItem(STORAGE_KEYS.SCHEDULES_CACHE);
      if (s) this.schedulesCache = JSON.parse(s);
    } catch {
      // Empty cache on parsing error
      this.usersCache = [];
      this.messagesCache = [];
      this.schedulesCache = [];
    }
  }

  private saveToLocalStorage(): void {
    try {
      const now = Date.now();
      // Per-message 90-day rolling TTL: purge any local message whose own timestamp is older than 90 days
      this.messagesCache = this.messagesCache.filter(
        (m) => now - m.createdAt < MESSAGE_RETENTION_MS
      );

      localStorage.setItem(STORAGE_KEYS.USERS_CACHE, JSON.stringify(this.usersCache));
      localStorage.setItem(STORAGE_KEYS.CONTACTS_CACHE, JSON.stringify(this.contactsCache));
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS_CACHE, JSON.stringify(this.conversationsCache));
      localStorage.setItem(STORAGE_KEYS.MESSAGES_CACHE, JSON.stringify(this.messagesCache));
      localStorage.setItem(STORAGE_KEYS.REACTIONS_CACHE, JSON.stringify(this.reactionsCache));
      localStorage.setItem(STORAGE_KEYS.SCHEDULES_CACHE, JSON.stringify(this.schedulesCache));
    } catch {
      // ignore storage quota issues
    }
  }

  // ----------------------------------------------------
  // Initial Sync & 90-Day Retention Purge from Neon DB
  // ----------------------------------------------------
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    await this.syncWithNeon();
    this.isInitialized = true;
  }

  public async syncWithNeon(): Promise<void> {
    try {
      // 1. Enforce 90-day retention purge
      await sql`DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days';`;

      // 2. Fetch users
      const rawUsers = (await sql`
        SELECT id, username, first_name, last_name, job_title, bio, phone, age,
               show_phone, show_age,
               avatar_url, avatar_color, account_type, access_level, can_chat, is_immutable_admin, is_online, created_at
        FROM users ORDER BY created_at ASC;
      `) as unknown as RawDbUser[];

      if (rawUsers && rawUsers.length > 0) {
        this.usersCache = rawUsers.map(mapUser);
      }

      // 3. Fetch contacts
      const rawContacts = (await sql`
        SELECT id, owner_user_id, contact_user_id, custom_nickname, chat_bg_color, created_at
        FROM user_contacts;
      `) as unknown as RawDbContact[];

      this.contactsCache = (rawContacts || []).map((c) => ({
        id: c.id,
        ownerUserId: c.owner_user_id,
        contactUserId: c.contact_user_id,
        customNickname: c.custom_nickname || undefined,
        chatBgColor: c.chat_bg_color || '#FFFFFF',
        createdAt: c.created_at,
      }));

      // 4. Fetch conversations
      const rawConv = (await sql`
        SELECT id, user_one_id, user_two_id, pinned_message_id, created_at, updated_at
        FROM conversations;
      `) as unknown as RawDbConversation[];
      this.conversationsCache = rawConv || [];

      // 5. Fetch reactions
      const rawReactions = (await sql`
        SELECT message_id, user_id, emoji FROM message_reactions;
      `) as unknown as RawDbReaction[];

      const rMap: Record<string, Record<string, string[]>> = {};
      (rawReactions || []).forEach((r) => {
        if (!rMap[r.message_id]) rMap[r.message_id] = {};
        if (!rMap[r.message_id][r.emoji]) rMap[r.message_id][r.emoji] = [];
        rMap[r.message_id][r.emoji].push(r.user_id);
      });
      this.reactionsCache = rMap;

      // 6. Fetch messages (Safety filter: fetch only messages sent within the rolling 90-day window)
      const rawMessages = (await sql`
        SELECT id, conversation_id, sender_id, content, text_color, font_size, sticker_id, is_scheduled, created_at
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '90 days'
        ORDER BY created_at ASC;
      `) as unknown as RawDbMessage[];

      this.messagesCache = (rawMessages || []).map((m) => {
        const conv = this.conversationsCache.find((c) => c.id === m.conversation_id);
        const receiverId = conv
          ? conv.user_one_id === m.sender_id
            ? conv.user_two_id
            : conv.user_one_id
          : '';

        const d = new Date(m.created_at);
        const isSticker = Boolean(m.sticker_id);

        return {
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          receiverId,
          type: isSticker ? 'sticker' : 'text',
          text: isSticker ? '' : m.content || '',
          stickerId: m.sticker_id || undefined,
          stickerFileId: undefined, // Resolved by UI sticker component
          stickerName: undefined,
          textColor: (m.text_color as ColorTheme) || 'black',
          textSize: (m.font_size as TextSize) || 'M',
          timestamp: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: d.getTime(),
          status: 'delivered',
          isScheduledDispatch: Boolean(m.is_scheduled),
          reactions: this.reactionsCache[m.id] || {},
        };
      });

      // 7. Fetch schedules
      const rawSchedules = (await sql`
        SELECT id, conversation_id, creator_id, participant_id, title, auto_message, scheduled_at, is_triggered, created_at
        FROM schedules ORDER BY scheduled_at ASC;
      `) as unknown as RawDbSchedule[];

      this.schedulesCache = (rawSchedules || []).map((s) => ({
        id: s.id,
        conversationId: s.conversation_id,
        createdByUserId: s.creator_id,
        targetUserId: s.participant_id,
        title: s.title,
        autoMessage: s.auto_message,
        scheduledAt: new Date(s.scheduled_at).toISOString(),
        isTriggered: Boolean(s.is_triggered),
        createdAt: new Date(s.created_at).toISOString(),
      }));

      this.saveToLocalStorage();
    } catch (err) {
      console.warn('Neon DB Sync Warning (using local cache):', err);
    }
  }

  // ----------------------------------------------------
  // Authentication & Session
  // ----------------------------------------------------
  public getCurrentUserId(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || '';
  }

  public setCurrentUserId(id: string): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }

  public async authenticate(usernameInput: string, passwordInput: string): Promise<User | null> {
    const clean = usernameInput.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return null;

    try {
      const rows = (await sql`
        SELECT id, username, password_hash, first_name, last_name, job_title, bio, phone, age,
               show_phone, show_age,
               avatar_url, avatar_color, account_type, access_level, can_chat, is_immutable_admin, is_online, created_at
        FROM users
        WHERE LOWER(username) = LOWER(${clean})
        LIMIT 1;
      `) as unknown as RawDbUser[];

      if (!rows || rows.length === 0) {
        return null;
      }

      const row = rows[0];
      const hashedInput = await sha256(passwordInput.trim());

      // Strictly validate hash or plaintext from database
      const isMatch =
        row.password_hash === hashedInput ||
        row.password_hash === passwordInput.trim();

      if (!isMatch) {
        return null;
      }

      const user = mapUser(row);
      this.setCurrentUserId(user.id);
      return user;
    } catch (err) {
      console.error('Neon auth error:', err);
      return null;
    }
  }

  // ----------------------------------------------------
  // User Management & RBAC
  // ----------------------------------------------------
  public getAllUsers(): User[] {
    return this.usersCache;
  }

  public getUserById(id: string): User | undefined {
    return this.usersCache.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    return this.usersCache.find((u) => u.username.toLowerCase() === clean);
  }

  public async createUserAsync(params: {
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
  }): Promise<User> {
    const cleanUsername = params.username.trim().replace(/^@/, '');
    if (!cleanUsername) throw new Error('กรุณาระบุ Username');

    const first = params.firstName.trim();
    const last = params.lastName.trim();
    if (!first || !last) throw new Error('กรุณาระบุทั้งชื่อจริงและนามสกุล');

    const rawPassword = params.password?.trim() || 'password123';
    const pwdHash = await sha256(rawPassword);

    const rows = (await sql`
      INSERT INTO users (
        username, password_hash, first_name, last_name, job_title, bio,
        phone, age, avatar_color, avatar_url, account_type, access_level, can_chat, is_immutable_admin, is_online
      ) VALUES (
        ${cleanUsername},
        ${pwdHash},
        ${first},
        ${last},
        ${params.jobTitle?.trim() || null},
        ${params.bio?.trim() || null},
        ${params.phone?.trim() || null},
        ${params.age ? Number(params.age) : null},
        ${params.avatarColor || 'blue'},
        ${params.avatarUrl || null},
        'MEMBER',
        ${params.accessLevel || 'USER'},
        true,
        false,
        true
      )
      RETURNING id, username, first_name, last_name, job_title, bio, phone, age,
                avatar_url, avatar_color, account_type, access_level, can_chat, is_immutable_admin, is_online, created_at;
    `) as unknown as RawDbUser[];

    const newUser = mapUser(rows[0]);
    this.usersCache.push(newUser);
    this.saveToLocalStorage();
    return newUser;
  }

  // Synchronous wrapper for existing UI callbacks
  public createUser(params: {
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
    // Generate optimistic user
    const first = params.firstName.trim();
    const last = params.lastName.trim();
    const clean = params.username.trim().replace(/^@/, '');
    const tempId = 'usr_' + Date.now();

    const optimistic: User = {
      id: tempId,
      username: clean,
      firstName: first,
      lastName: last,
      name: `${first} ${last}`.trim(),
      jobTitle: params.jobTitle?.trim() || undefined,
      role: params.jobTitle?.trim() || undefined,
      initials: ((first[0] || '') + (last[0] || '')).toUpperCase(),
      avatarColor: params.avatarColor || 'blue',
      phone: params.phone?.trim() || undefined,
      age: params.age || undefined,
      bio: params.bio?.trim() || undefined,
      status: 'online',
      accountType: 'MEMBER',
      accessLevel: params.accessLevel || 'USER',
      canChat: true,
      isImmutableAdmin: false,
      createdAt: new Date().toISOString(),
    };

    this.usersCache.push(optimistic);
    this.saveToLocalStorage();

    // Async persist to Neon
    this.createUserAsync(params).catch((err) => {
      console.error('Failed to persist created user to Neon:', err);
    });

    return optimistic;
  }

  public async updateUserProfileAsync(userId: string, updates: Partial<User>): Promise<User> {
    const existing = this.usersCache.find((u) => u.id === userId);
    if (!existing) throw new Error(`User ${userId} not found`);

    if (existing.isImmutableAdmin || existing.username.toLowerCase() === 'hushadmin') {
      throw new Error('บัญชี Hushadmin เป็น Protected Sole Admin (Immutable) ไม่สามารถแก้ไขข้อมูลได้');
    }

    const first = updates.firstName !== undefined ? updates.firstName.trim() : existing.firstName;
    const last = updates.lastName !== undefined ? updates.lastName.trim() : (existing.lastName || '');
    const username = updates.username ? updates.username.trim().replace(/^@/, '') : existing.username;
    const job = updates.jobTitle !== undefined ? updates.jobTitle.trim() || null : existing.jobTitle || null;
    const bio = updates.bio !== undefined ? updates.bio.trim() || null : existing.bio || null;
    const phone = updates.phone !== undefined ? updates.phone.trim() || null : existing.phone || null;
    const age = updates.age !== undefined ? (updates.age ? Number(updates.age) : null) : (existing.age ? Number(existing.age) : null);
    const showPhone = updates.showPhone !== undefined ? updates.showPhone : (existing.showPhone !== false);
    const showAge = updates.showAge !== undefined ? updates.showAge : (existing.showAge !== false);
    const accessLevel = updates.accessLevel || existing.accessLevel;

    await sql`
      UPDATE users SET
        username = ${username},
        first_name = ${first},
        last_name = ${last},
        job_title = ${job},
        bio = ${bio},
        phone = ${phone},
        age = ${age},
        show_phone = ${showPhone},
        show_age = ${showAge},
        access_level = ${accessLevel}
      WHERE id = ${userId}::uuid AND is_immutable_admin = false;
    `;

    const updated: User = {
      ...existing,
      ...updates,
      username,
      firstName: first,
      lastName: last,
      name: `${first} ${last}`.trim() || first,
      jobTitle: job || undefined,
      role: job || undefined,
      bio: bio || undefined,
      phone: phone || undefined,
      age: age || undefined,
      showPhone,
      showAge,
      accessLevel,
    };

    const idx = this.usersCache.findIndex((u) => u.id === userId);
    if (idx !== -1) this.usersCache[idx] = updated;
    this.saveToLocalStorage();
    return updated;
  }

  public updateUserProfile(userId: string, updates: Partial<User>): User {
    const existing = this.usersCache.find((u) => u.id === userId);
    if (!existing) throw new Error(`User ${userId} not found`);

    if (existing.isImmutableAdmin || existing.username.toLowerCase() === 'hushadmin') {
      throw new Error('บัญชี Hushadmin เป็น Protected Sole Admin (Immutable) ไม่สามารถแก้ไขข้อมูลได้');
    }

    const first = updates.firstName !== undefined ? updates.firstName.trim() : existing.firstName;
    const last = updates.lastName !== undefined ? updates.lastName.trim() : (existing.lastName || '');
    const showPhone = updates.showPhone !== undefined ? updates.showPhone : (existing.showPhone !== false);
    const showAge = updates.showAge !== undefined ? updates.showAge : (existing.showAge !== false);
    const updated: User = {
      ...existing,
      ...updates,
      firstName: first,
      lastName: last,
      name: `${first} ${last}`.trim() || first,
      role: updates.jobTitle || existing.role,
      showPhone,
      showAge,
    };

    const idx = this.usersCache.findIndex((u) => u.id === userId);
    if (idx !== -1) this.usersCache[idx] = updated;
    this.saveToLocalStorage();

    this.updateUserProfileAsync(userId, updates).catch((err) => {
      console.error('Failed to sync profile update to Neon:', err);
    });

    return updated;
  }

  // ----------------------------------------------------
  // Contacts & Friendships (1:1 Friend Directory)
  // ----------------------------------------------------
  public getAllUserContacts(): UserContact[] {
    return this.contactsCache;
  }

  public getVisibleContactsForUser(currentUser: User): User[] {
    // 1. SYSTEM_ADMIN cannot chat with anyone
    if (!currentUser.canChat || currentUser.accountType === 'SYSTEM_ADMIN') {
      return [];
    }

    const chatEligible = this.usersCache.filter(
      (u) => u.canChat && u.id !== currentUser.id && u.accountType !== 'SYSTEM_ADMIN'
    );

    // 2. OWNER_ADMIN, FULL_ACCESS, or VIEW_ALL see all eligible chat members
    if (
      currentUser.accountType === 'OWNER_ADMIN' ||
      currentUser.accessLevel === 'FULL_ACCESS' ||
      currentUser.accessLevel === 'VIEW_ALL'
    ) {
      return chatEligible;
    }

    // 3. Standard 'USER' tier only sees contacts added as friends or with active messages
    const friendContactIds = new Set(
      this.contactsCache
        .filter((c) => c.ownerUserId === currentUser.id)
        .map((c) => c.contactUserId)
    );

    this.messagesCache.forEach((m) => {
      if (m.senderId === currentUser.id) friendContactIds.add(m.receiverId);
      if (m.receiverId === currentUser.id) friendContactIds.add(m.senderId);
    });

    return chatEligible.filter((u) => friendContactIds.has(u.id));
  }

  public async addContactByUsernameAsync(
    ownerUserId: string,
    rawUsername: string
  ): Promise<{ user: User; contact: UserContact }> {
    const clean = rawUsername.trim().replace(/^@/, '').toLowerCase();
    if (!clean) throw new Error('กรุณาระบุชื่อผู้ใช้งาน (@username)');

    const targetUser = this.usersCache.find((u) => u.username.toLowerCase() === clean);
    if (!targetUser) throw new Error(`ไม่พบผู้ใช้งาน @${clean} ในระบบ (กรุณาตรวจสอบตัวสะกด)`);

    if (targetUser.id === ownerUserId) throw new Error('ไม่สามารถเพิ่มตนเองเป็นเพื่อนได้');
    if (targetUser.accountType === 'SYSTEM_ADMIN' || !targetUser.canChat) {
      throw new Error('ไม่สามารถเพิ่มบัญชี System Administrator เป็นเพื่อนหรือเริ่มแชทได้');
    }

    const rows = (await sql`
      INSERT INTO user_contacts (owner_user_id, contact_user_id, custom_nickname, chat_bg_color)
      VALUES (${ownerUserId}::uuid, ${targetUser.id}::uuid, null, '#FFFFFF')
      ON CONFLICT (owner_user_id, contact_user_id) DO UPDATE SET chat_bg_color = user_contacts.chat_bg_color
      RETURNING id, owner_user_id, contact_user_id, custom_nickname, chat_bg_color, created_at;
    `) as unknown as RawDbContact[];

    const newContact: UserContact = {
      id: rows[0].id,
      ownerUserId,
      contactUserId: targetUser.id,
      customNickname: rows[0].custom_nickname || undefined,
      chatBgColor: rows[0].chat_bg_color || '#FFFFFF',
      createdAt: rows[0].created_at,
    };

    this.contactsCache.push(newContact);
    this.saveToLocalStorage();
    return { user: targetUser, contact: newContact };
  }

  public addContactByUsername(
    ownerUserId: string,
    rawUsername: string
  ): { user: User; contact: UserContact } {
    const clean = rawUsername.trim().replace(/^@/, '').toLowerCase();
    const targetUser = this.usersCache.find((u) => u.username.toLowerCase() === clean);
    if (!targetUser) throw new Error(`ไม่พบผู้ใช้งาน @${clean} ในระบบ`);

    const tempContact: UserContact = {
      id: 'uc_' + Date.now(),
      ownerUserId,
      contactUserId: targetUser.id,
      createdAt: new Date().toISOString(),
    };

    this.contactsCache.push(tempContact);
    this.saveToLocalStorage();

    this.addContactByUsernameAsync(ownerUserId, rawUsername).catch((err) => {
      console.error('Failed to sync contact to Neon:', err);
    });

    return { user: targetUser, contact: tempContact };
  }

  // ----------------------------------------------------
  // Contact Customizations (Nickname & Chat Background)
  // ----------------------------------------------------
  public getContactPreference(ownerUserId: string, targetUserId: string): ContactPreference {
    const contact = this.contactsCache.find(
      (c) => c.ownerUserId === ownerUserId && c.contactUserId === targetUserId
    );

    return {
      ownerUserId,
      targetUserId,
      customNickname: contact?.customNickname,
      chatBgColor: contact?.chatBgColor || '#FFFFFF',
    };
  }

  public setContactNickname(
    ownerUserId: string,
    targetUserId: string,
    customNickname: string
  ): ContactPreference {
    const trimmed = customNickname.trim();
    const nicknameVal = trimmed.length > 0 ? trimmed : undefined;

    const contact = this.contactsCache.find(
      (c) => c.ownerUserId === ownerUserId && c.contactUserId === targetUserId
    );
    if (contact) {
      contact.customNickname = nicknameVal;
    } else {
      this.contactsCache.push({
        id: 'uc_' + Date.now(),
        ownerUserId,
        contactUserId: targetUserId,
        customNickname: nicknameVal,
        chatBgColor: '#FFFFFF',
        createdAt: new Date().toISOString(),
      });
    }

    this.saveToLocalStorage();

    // Async persist to Neon
    sql`
      INSERT INTO user_contacts (owner_user_id, contact_user_id, custom_nickname)
      VALUES (${ownerUserId}::uuid, ${targetUserId}::uuid, ${nicknameVal || null})
      ON CONFLICT (owner_user_id, contact_user_id)
      DO UPDATE SET custom_nickname = ${nicknameVal || null};
    `.catch((err) => console.error('Failed to save nickname to Neon:', err));

    return {
      ownerUserId,
      targetUserId,
      customNickname: nicknameVal,
      chatBgColor: contact?.chatBgColor || '#FFFFFF',
    };
  }

  public setChatBackground(
    ownerUserId: string,
    targetUserId: string,
    chatBgColor: string
  ): ContactPreference {
    const contact = this.contactsCache.find(
      (c) => c.ownerUserId === ownerUserId && c.contactUserId === targetUserId
    );
    if (contact) {
      contact.chatBgColor = chatBgColor || '#FFFFFF';
    } else {
      this.contactsCache.push({
        id: 'uc_' + Date.now(),
        ownerUserId,
        contactUserId: targetUserId,
        chatBgColor: chatBgColor || '#FFFFFF',
        createdAt: new Date().toISOString(),
      });
    }

    this.saveToLocalStorage();

    // Async persist to Neon
    sql`
      INSERT INTO user_contacts (owner_user_id, contact_user_id, chat_bg_color)
      VALUES (${ownerUserId}::uuid, ${targetUserId}::uuid, ${chatBgColor || '#FFFFFF'})
      ON CONFLICT (owner_user_id, contact_user_id)
      DO UPDATE SET chat_bg_color = ${chatBgColor || '#FFFFFF'};
    `.catch((err) => console.error('Failed to save chat background to Neon:', err));

    return {
      ownerUserId,
      targetUserId,
      customNickname: contact?.customNickname,
      chatBgColor: chatBgColor || '#FFFFFF',
    };
  }

  public getDisplayName(ownerUserId: string, contact: User): string {
    const pref = this.getContactPreference(ownerUserId, contact.id);
    return pref.customNickname?.trim() ? pref.customNickname : contact.name;
  }

  public getChatBackground(ownerUserId: string, contactId: string): string {
    const pref = this.getContactPreference(ownerUserId, contactId);
    return pref.chatBgColor || '#FFFFFF';
  }

  // ----------------------------------------------------
  // Conversations & 1:1 Messages
  // ----------------------------------------------------
  public getConversationIdSync(userAId: string, userBId: string): string {
    const existing = this.conversationsCache.find(
      (c) =>
        (c.user_one_id === userAId && c.user_two_id === userBId) ||
        (c.user_one_id === userBId && c.user_two_id === userAId)
    );
    if (existing) return existing.id;
    return `${userAId}_${userBId}`;
  }

  public async getOrCreateConversationId(userAId: string, userBId: string): Promise<string> {
    const existing = this.conversationsCache.find(
      (c) =>
        (c.user_one_id === userAId && c.user_two_id === userBId) ||
        (c.user_one_id === userBId && c.user_two_id === userAId)
    );
    if (existing) return existing.id;

    try {
      // Order UUIDs via LEAST and GREATEST so PostgreSQL chk_ordered_pair NEVER fails
      const rows = (await sql`
        INSERT INTO conversations (user_one_id, user_two_id)
        VALUES (LEAST(${userAId}::uuid, ${userBId}::uuid), GREATEST(${userAId}::uuid, ${userBId}::uuid))
        ON CONFLICT (user_one_id, user_two_id) DO UPDATE SET updated_at = NOW()
        RETURNING id, user_one_id, user_two_id, pinned_message_id, created_at, updated_at;
      `) as unknown as RawDbConversation[];

      if (rows && rows.length > 0) {
        const foundIdx = this.conversationsCache.findIndex((c) => c.id === rows[0].id);
        if (foundIdx !== -1) {
          this.conversationsCache[foundIdx] = rows[0];
        } else {
          this.conversationsCache.push(rows[0]);
        }
        this.saveToLocalStorage();
        return rows[0].id;
      }
      return `${userAId}_${userBId}`;
    } catch (err) {
      console.warn('Neon getOrCreateConversationId error:', err);
      return `${userAId}_${userBId}`;
    }
  }

  public getConversationMessages(conversationId: string, userAId?: string, userBId?: string): Message[] {
    const now = Date.now();
    const conv = this.conversationsCache.find((c) => c.id === conversationId);
    const u1 = conv ? conv.user_one_id : userAId;
    const u2 = conv ? conv.user_two_id : userBId;

    // Strict Per-Message 90-Day Rolling TTL: only return messages whose own timestamp is within 90 days
    return this.messagesCache.filter((m) => {
      if (now - m.createdAt >= MESSAGE_RETENTION_MS) return false;
      // Direct conversation ID match
      if (m.conversationId === conversationId) return true;
      // Matching conversation object ID
      if (conv && m.conversationId === conv.id) return true;
      // Matching user pair from conversation row
      if (u1 && u2 && ((m.senderId === u1 && m.receiverId === u2) || (m.senderId === u2 && m.receiverId === u1))) {
        return true;
      }
      // Matching user pair fallback for optimistic messages before UUID resolution
      if (userAId && userBId && ((m.senderId === userAId && m.receiverId === userBId) || (m.senderId === userBId && m.receiverId === userAId))) {
        return true;
      }
      return false;
    });
  }

  /**
   * Fetches only messages sent within the rolling 90-day window for this conversation directly from Neon DB.
   * Also triggers per-message rolling cleanup for expired messages (> 90 days).
   */
  public async fetchMessagesForConversation(conversationId: string): Promise<Message[]> {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId);
      if (!isUUID) {
        return this.getConversationMessages(conversationId);
      }

      // 1. Auto-Cleanup: Delete ONLY individual messages that were sent more than 90 days ago
      await sql`
        DELETE FROM messages
        WHERE created_at < NOW() - INTERVAL '90 days';
      `;

      // 2. Fetch only messages sent within the last 90 days for this conversation
      const rawMessages = (await sql`
        SELECT id, conversation_id, sender_id, content, text_color, font_size, sticker_id, is_scheduled, created_at
        FROM messages
        WHERE conversation_id = ${conversationId}::uuid
          AND created_at >= NOW() - INTERVAL '90 days'
        ORDER BY created_at ASC;
      `) as unknown as RawDbMessage[];

      const mapped = (rawMessages || []).map((m) => {
        const conv = this.conversationsCache.find((c) => c.id === m.conversation_id);
        const receiverId = conv
          ? conv.user_one_id === m.sender_id
            ? conv.user_two_id
            : conv.user_one_id
          : '';

        const d = new Date(m.created_at);
        const isSticker = Boolean(m.sticker_id);

        return {
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          receiverId,
          type: (isSticker ? 'sticker' : 'text') as 'sticker' | 'text',
          text: isSticker ? '' : m.content || '',
          stickerId: m.sticker_id || undefined,
          stickerFileId: undefined,
          stickerName: undefined,
          textColor: (m.text_color as ColorTheme) || 'black',
          textSize: (m.font_size as TextSize) || 'M',
          timestamp: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: d.getTime(),
          status: 'delivered' as const,
          isScheduledDispatch: Boolean(m.is_scheduled),
          reactions: this.reactionsCache[m.id] || {},
        };
      });

      this.messagesCache = [
        ...this.messagesCache.filter((m) => m.conversationId !== conversationId),
        ...mapped,
      ];
      this.saveToLocalStorage();

      return mapped;
    } catch (err) {
      console.warn('Neon fetchMessagesForConversation error:', err);
      return this.getConversationMessages(conversationId);
    }
  }

  public sendMessage(params: {
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
    const now = new Date();
    const tempId = 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Resolve best known conversation ID synchronously
    let activeConvId = params.conversationId;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeConvId);
    if (!isUUID) {
      const syncId = this.getConversationIdSync(params.senderId, params.receiverId);
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(syncId)) {
        activeConvId = syncId;
      }
    }

    const newMessage: Message = {
      id: tempId,
      conversationId: activeConvId,
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

    // Optimistic UI: append immediately to local cache (< 10ms render)
    this.messagesCache.push(newMessage);
    this.saveToLocalStorage();

    // Async persist to Neon DB
    this.persistMessageToNeon(newMessage, { ...params, conversationId: activeConvId });

    return newMessage;
  }

  private async persistMessageToNeon(
    msg: Message,
    params: {
      conversationId: string;
      senderId: string;
      receiverId: string;
      type: 'text' | 'sticker';
      text: string;
      stickerId?: string;
      textColor: ColorTheme;
      textSize: TextSize;
      isScheduledDispatch?: boolean;
    }
  ) {
    try {
      // Resolve valid UUID conversation ID if needed
      let convId = params.conversationId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(convId);
      if (!isUUID) {
        convId = await this.getOrCreateConversationId(params.senderId, params.receiverId);
      }
      msg.conversationId = convId;

      const rows = (await sql`
        INSERT INTO messages (
          conversation_id, sender_id, content, text_color, font_size, sticker_id, is_scheduled
        ) VALUES (
          ${convId}::uuid,
          ${params.senderId}::uuid,
          ${params.text || ''},
          ${params.textColor || 'black'},
          ${params.textSize || 'M'},
          ${params.stickerId || null},
          ${Boolean(params.isScheduledDispatch)}
        )
        RETURNING id, created_at;
      `) as unknown as { id: string; created_at: string }[];

      if (rows && rows.length > 0) {
        msg.id = rows[0].id;
        this.saveToLocalStorage();
      }

      await sql`
        UPDATE conversations SET updated_at = NOW() WHERE id = ${convId}::uuid;
      `;
    } catch (err) {
      console.warn('Neon persist message warning (cached locally):', err);
    }
  }

  public toggleReaction(messageId: string, emoji: string, userId: string): Message[] {
    const target = this.messagesCache.find((m) => m.id === messageId);
    if (!target) return this.messagesCache;

    if (!target.reactions) target.reactions = {};
    const currentUsers = target.reactions[emoji] || [];

    const hadReaction = currentUsers.includes(userId);
    if (hadReaction) {
      target.reactions[emoji] = currentUsers.filter((id) => id !== userId);
      if (target.reactions[emoji].length === 0) delete target.reactions[emoji];
    } else {
      target.reactions[emoji] = [...currentUsers, userId];
    }

    this.saveToLocalStorage();

    // Async persist to Neon
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId);
    if (isUUID) {
      if (hadReaction) {
        sql`
          DELETE FROM message_reactions
          WHERE message_id = ${messageId}::uuid AND user_id = ${userId}::uuid AND emoji = ${emoji};
        `.catch((err) => console.warn('Neon reaction delete error:', err));
      } else {
        sql`
          INSERT INTO message_reactions (message_id, user_id, emoji)
          VALUES (${messageId}::uuid, ${userId}::uuid, ${emoji})
          ON CONFLICT (message_id, user_id, emoji) DO NOTHING;
        `.catch((err) => console.warn('Neon reaction insert error:', err));
      }
    }

    return this.messagesCache;
  }

  public getPinnedMessageId(conversationId: string): string | null {
    const conv = this.conversationsCache.find((c) => c.id === conversationId);
    if (!conv?.pinned_message_id) return null;

    // Check if pinned message still exists and is within its rolling 90-day lifecycle
    const now = Date.now();
    const msg = this.messagesCache.find(
      (m) => m.id === conv.pinned_message_id && now - m.createdAt < MESSAGE_RETENTION_MS
    );

    if (!msg) {
      // Pinned message has expired past 90 days and was deleted -> automatically set pinned_message_id = null
      conv.pinned_message_id = undefined;
      this.saveToLocalStorage();

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId);
      if (isUUID) {
        sql`UPDATE conversations SET pinned_message_id = NULL WHERE id = ${conversationId}::uuid;`
          .catch((err) => console.warn('Neon auto-clear expired pin error:', err));
      }
      return null;
    }

    return conv.pinned_message_id;
  }

  public setPinnedMessageId(conversationId: string, messageId: string | null): void {
    const conv = this.conversationsCache.find((c) => c.id === conversationId);
    if (conv) conv.pinned_message_id = messageId || undefined;
    this.saveToLocalStorage();

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId);
    if (isUUID) {
      const msgUUID = messageId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)
        ? messageId
        : null;

      sql`
        UPDATE conversations
        SET pinned_message_id = ${msgUUID ? msgUUID + '::uuid' : null}
        WHERE id = ${conversationId}::uuid;
      `.catch((err) => console.warn('Neon set pin error:', err));
    }
  }

  public getUnreadCount(conversationId: string, currentUserId: string): number {
    const msgs = this.getConversationMessages(conversationId);
    return msgs.filter((m) => m.receiverId === currentUserId && m.status !== 'read').length;
  }

  public markConversationAsRead(conversationId: string, currentUserId: string): void {
    let changed = false;
    this.messagesCache.forEach((m) => {
      if (m.conversationId === conversationId && m.receiverId === currentUserId && m.status !== 'read') {
        m.status = 'read';
        changed = true;
      }
    });
    if (changed) this.saveToLocalStorage();
  }

  // ----------------------------------------------------
  // 1:1 Schedules & Calendar Reminders
  // ----------------------------------------------------
  public getAllSchedules(): Schedule[] {
    return this.schedulesCache;
  }

  public getSchedulesForConversation(conversationId: string): Schedule[] {
    return this.schedulesCache
      .filter((s) => s.conversationId === conversationId)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  public getUpcomingSchedulesCount(conversationId: string): number {
    const schedules = this.getSchedulesForConversation(conversationId);
    return schedules.filter((s) => !s.isTriggered && new Date(s.scheduledAt).getTime() > Date.now()).length;
  }

  public async createScheduleAsync(params: {
    conversationId: string;
    createdByUserId: string;
    targetUserId: string;
    title: string;
    autoMessage: string;
    scheduledAt: string;
  }): Promise<Schedule> {
    let convId = params.conversationId;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(convId);
    if (!isUUID) {
      convId = await this.getOrCreateConversationId(params.createdByUserId, params.targetUserId);
    }

    const rows = (await sql`
      INSERT INTO schedules (
        conversation_id, creator_id, participant_id, title, auto_message, scheduled_at, is_triggered
      ) VALUES (
        ${convId}::uuid,
        ${params.createdByUserId}::uuid,
        ${params.targetUserId}::uuid,
        ${params.title.trim()},
        ${params.autoMessage.trim()},
        ${params.scheduledAt}::timestamptz,
        false
      )
      RETURNING id, conversation_id, creator_id, participant_id, title, auto_message, scheduled_at, is_triggered, created_at;
    `) as unknown as RawDbSchedule[];

    const newSchedule: Schedule = {
      id: rows[0].id,
      conversationId: rows[0].conversation_id,
      createdByUserId: rows[0].creator_id,
      targetUserId: rows[0].participant_id,
      title: rows[0].title,
      autoMessage: rows[0].auto_message,
      scheduledAt: new Date(rows[0].scheduled_at).toISOString(),
      isTriggered: Boolean(rows[0].is_triggered),
      createdAt: new Date(rows[0].created_at).toISOString(),
    };

    this.schedulesCache.push(newSchedule);
    this.saveToLocalStorage();
    return newSchedule;
  }

  public createSchedule(params: {
    conversationId: string;
    createdByUserId: string;
    targetUserId: string;
    title: string;
    autoMessage: string;
    scheduledAt: string;
  }): Schedule {
    const temp: Schedule = {
      id: 'sch_' + Date.now(),
      conversationId: params.conversationId,
      createdByUserId: params.createdByUserId,
      targetUserId: params.targetUserId,
      title: params.title.trim(),
      autoMessage: params.autoMessage.trim(),
      scheduledAt: params.scheduledAt,
      isTriggered: false,
      createdAt: new Date().toISOString(),
    };

    this.schedulesCache.push(temp);
    this.saveToLocalStorage();

    this.createScheduleAsync(params).catch((err) => {
      console.error('Failed to persist schedule to Neon:', err);
    });

    return temp;
  }

  public deleteSchedule(scheduleId: string): void {
    this.schedulesCache = this.schedulesCache.filter((s) => s.id !== scheduleId);
    this.saveToLocalStorage();

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scheduleId);
    if (isUUID) {
      sql`DELETE FROM schedules WHERE id = ${scheduleId}::uuid;`.catch((err) =>
        console.warn('Neon delete schedule warning:', err)
      );
    }
  }

  public checkAndTriggerDueSchedules(): Schedule[] {
    const now = Date.now();
    const dueSchedules = this.schedulesCache.filter(
      (s) => !s.isTriggered && new Date(s.scheduledAt).getTime() <= now
    );

    if (dueSchedules.length === 0) return [];

    dueSchedules.forEach((due) => {
      due.isTriggered = true;

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

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(due.id);
      if (isUUID) {
        sql`UPDATE schedules SET is_triggered = true WHERE id = ${due.id}::uuid;`.catch((err) =>
          console.warn('Neon trigger schedule update warning:', err)
        );
      }
    });

    this.saveToLocalStorage();
    return dueSchedules;
  }
}

export const storageService = new StorageService();
