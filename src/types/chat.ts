/**
 * HusH Domain Types & PostgreSQL Schema Mapping
 * Maps 1:1 to upcoming Neon Serverless PostgreSQL tables:
 * - `users` (`id`, `username`, `password_hash`, `full_name`, `avatar_url`, `phone`, `age`, `created_at`)
 * - `contact_preferences` (`owner_user_id`, `target_user_id`, `custom_nickname`, `chat_bg_color`)
 * - `conversations`
 * - `messages`
 * - `message_reactions`
 * - `pinned_messages`
 */

export type ColorTheme = 'black' | 'orange' | 'blue' | 'pink';
export type TextSize = 'S' | 'M' | 'L' | 'XL';

export type AccountType = 'SYSTEM_ADMIN' | 'OWNER_ADMIN' | 'MEMBER';
export type AccessLevel = 'FULL_ACCESS' | 'VIEW_ALL' | 'USER';

export interface User {
  id: string;              // maps to users.id VARCHAR(50)
  firstName: string;       // maps to users.first_name VARCHAR(50) (Required)
  lastName: string;        // maps to users.last_name VARCHAR(50) (Required)
  name: string;            // maps to users.full_name VARCHAR(100)
  username: string;        // maps to users.username VARCHAR(50) UNIQUE (Editable by Admins / Full Access)
  password?: string;       // maps to users.password_hash TEXT
  jobTitle?: string;       // maps to users.job_title VARCHAR(100) (Optional)
  role?: string;           // alias / fallback for jobTitle
  initials: string;        // calculated or users.initials VARCHAR(4)
  avatarColor: ColorTheme; // maps to users.avatar_color VARCHAR(20)
  avatarUrl?: string;      // maps to users.avatar_url TEXT
  phone?: string;          // maps to users.phone VARCHAR(20)
  age?: number | string;   // maps to users.age INT
  bio?: string;            // maps to users.bio TEXT (Optional details/bio)
  details?: string;        // alias for bio
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  accountType: AccountType;// 'SYSTEM_ADMIN' | 'OWNER_ADMIN' | 'MEMBER'
  accessLevel: AccessLevel;// 'FULL_ACCESS' | 'VIEW_ALL' | 'USER'
  canChat: boolean;        // strictly false for SYSTEM_ADMIN; true for OWNER_ADMIN and MEMBER
  createdAt: string;       // ISO timestamp
}

export interface UserContact {
  id: string;              // maps to user_contacts.id
  ownerUserId: string;     // maps to user_contacts.owner_user_id (FK users.id)
  contactUserId: string;   // maps to user_contacts.contact_user_id (FK users.id)
  customNickname?: string; // maps to user_contacts.custom_nickname
  chatBgColor?: string;    // maps to user_contacts.chat_bg_color
  createdAt: string;
}

export interface ContactPreference {
  ownerUserId: string;     // maps to contact_preferences.owner_user_id VARCHAR(50)
  targetUserId: string;    // maps to contact_preferences.target_user_id VARCHAR(50)
  customNickname?: string; // maps to contact_preferences.custom_nickname VARCHAR(100)
  chatBgColor?: string;    // maps to contact_preferences.chat_bg_color VARCHAR(20)
  updatedAt?: number;
}

export interface Schedule {
  id: string;              // maps to schedules.id (UUID)
  conversationId: string;  // maps to schedules.conversation_id (FK conversations.id)
  createdByUserId: string; // maps to schedules.created_by_user_id (FK users.id)
  targetUserId: string;    // maps to schedules.target_user_id (FK users.id)
  title: string;           // Event title
  autoMessage: string;     // Message sent to chat & shown in pop-up
  scheduledAt: string;     // ISO Date-Time string
  isTriggered: boolean;    // true when dispatched
  createdAt: string;
}

export interface ChatBackgroundTheme {
  id: string;
  name: string;
  hex: string;
  borderHex: string;
  isDark?: boolean;
}

export const CHAT_BACKGROUND_THEMES: ChatBackgroundTheme[] = [
  { id: 'white', name: 'Pure White (ค่าเริ่มต้น)', hex: '#FFFFFF', borderHex: '#E5E7EB' },
  { id: 'slate', name: 'Soft Slate', hex: '#F8FAFC', borderHex: '#E2E8F0' },
  { id: 'sand', name: 'Warm Sand / Cream', hex: '#FFFBF5', borderHex: '#FED7AA' },
  { id: 'orange', name: 'Soft Orange Tint', hex: '#FFF7ED', borderHex: '#FED7AA' },
  { id: 'blue', name: 'Soft Sky Blue Tint', hex: '#F0F9FF', borderHex: '#BAE6FD' },
  { id: 'pink', name: 'Soft Rose Pink Tint', hex: '#FDF2F8', borderHex: '#FBCFE8' },
  { id: 'carbon', name: 'Subtle Carbon Dark', hex: '#18181B', borderHex: '#27272A', isDark: true },
];

export interface ThiingsSticker {
  id: string;              // e.g. 'th_approved'
  fileId: string;          // Vercel blob fileId: 'vlzf1COZwJkp1yLn12mawFDL0yfQ3M'
  name: string;            // e.g. 'Approved'
  category: string;        // e.g. 'Approval & Success' | 'Emotions & Praise' | 'Finance & Metrics' | 'Work & Status'
  url: string;             // https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-{fileId}.png
}

export interface Sticker {
  id: string;
  title: string;
  subTitle?: string;
  category: string;
  bgColor: string;
  accentColor: string;
  borderColor: string;
  iconType: string;
}

export interface Message {
  id: string;              // maps to messages.id (UUID)
  conversationId: string;  // maps to messages.conversation_id (FK conversations.id)
  senderId: string;        // maps to messages.sender_id (FK users.id)
  receiverId: string;      // maps to messages.receiver_id (FK users.id)
  type: 'text' | 'sticker';// maps to messages.message_type
  text: string;            // maps to messages.content TEXT (empty for sticker)
  stickerId?: string;      // maps to messages.sticker_id VARCHAR(50)
  stickerFileId?: string;  // maps to messages.sticker_file_id VARCHAR(100) (Thiings.co CDN token)
  stickerName?: string;    // maps to messages.sticker_name VARCHAR(100)
  textColor: ColorTheme;   // maps to messages.text_color VARCHAR(20) DEFAULT 'black'
  textSize: TextSize;      // maps to messages.font_size VARCHAR(10) DEFAULT 'M'
  timestamp: string;       // client formatted display time
  createdAt: number;       // maps to messages.created_at TIMESTAMPTZ (subject to 90-day auto-purge)
  status: 'sent' | 'delivered' | 'read';
  isPinned?: boolean;
  isScheduledDispatch?: boolean; // badge indicating message was automatically sent by schedule
  reactions: Record<string, string[]>; // maps to message_reactions (message_id, emoji, user_id)
}

export interface Conversation {
  id: string;              // maps to conversations.id
  participantOneId: string;// maps to conversations.participant_one_id (FK users.id)
  participantTwoId: string;// maps to conversations.participant_two_id (FK users.id)
  participants: [string, string]; // backward-compatible pair tuple
  pinnedMessageId?: string | null;
  createdAt: string;
  updatedAt: number;
}
