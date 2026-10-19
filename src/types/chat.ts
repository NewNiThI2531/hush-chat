/**
 * HusH Domain Types & PostgreSQL Schema Mapping
 * Maps 1:1 to upcoming Neon Serverless PostgreSQL tables:
 * - `users`
 * - `conversations`
 * - `messages`
 * - `message_reactions`
 * - `pinned_messages`
 */

export type ColorTheme = 'black' | 'orange' | 'blue' | 'pink';
export type TextSize = 'S' | 'M' | 'L' | 'XL';

export interface User {
  id: string;              // maps to users.id (UUID or slug)
  name: string;            // maps to users.full_name VARCHAR(100)
  username: string;        // maps to users.username VARCHAR(50) UNIQUE
  role: string;            // maps to users.role VARCHAR(100)
  initials: string;        // calculated or users.initials VARCHAR(4)
  avatarColor: ColorTheme; // maps to users.avatar_color VARCHAR(20)
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

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
  reactions: Record<string, string[]>; // maps to message_reactions (message_id, emoji, user_id)
}

export interface Conversation {
  id: string;              // maps to conversations.id
  participants: [string, string];
  pinnedMessageId?: string | null;
  updatedAt: number;
}
