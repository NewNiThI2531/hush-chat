import type { User, Message, Sticker, UserContact, Schedule, ContactPreference } from '../types/chat';

/**
 * HusH Production Seed References
 * Active data is strictly persisted in Neon Serverless PostgreSQL.
 */
export function getConversationId(userAId: string, userBId: string): string {
  const [first, second] = [userAId, userBId].sort();
  return `${first}_${second}`;
}
export const SEED_USERS: User[] = [
  {
    id: '9b68073a-ff37-45a5-a713-5a7fa67c5e35',
    firstName: 'Hush',
    lastName: 'Admin',
    name: 'Hush Admin',
    username: 'Hushadmin',
    password: 'password123',
    jobTitle: 'System Administrator',
    role: 'System Administrator',
    initials: 'HA',
    avatarColor: 'black',
    phone: '+66 2 000 0001',
    age: 35,
    bio: 'Protected Sole System Administrator. Immutability enforced: cannot be edited or deleted.',
    status: 'online',
    accountType: 'SYSTEM_ADMIN',
    accessLevel: 'ADMIN_ONLY',
    canChat: false,
    isImmutableAdmin: true,
    createdAt: '2026-10-20T00:00:00.000Z',
  },
  {
    id: 'af988620-f86d-498e-840f-13b80292932e',
    firstName: 'Nithi',
    lastName: 'B.',
    name: 'Nithi B.',
    username: 'New010',
    password: 'password123',
    jobTitle: 'Software Engineer & Co-Owner',
    role: 'Software Engineer & Co-Owner',
    initials: 'NB',
    avatarColor: 'blue',
    phone: '+66 81 234 5678',
    age: 28,
    bio: 'HusH Core Developer. Full access permissions.',
    status: 'online',
    accountType: 'MEMBER',
    accessLevel: 'FULL_ACCESS',
    canChat: true,
    isImmutableAdmin: false,
    createdAt: '2026-10-20T00:00:00.000Z',
  },
  {
    id: '9fa293bf-7021-4cbb-8267-86ea0c575450',
    firstName: 'Fern',
    lastName: 'RS',
    name: 'Fern RS',
    username: 'Fernrs',
    password: 'password123',
    jobTitle: 'Product Specialist',
    role: 'Product Specialist',
    initials: 'FR',
    avatarColor: 'pink',
    phone: '+66 89 876 5432',
    age: 26,
    bio: 'HusH Member. Standard user tier.',
    status: 'online',
    accountType: 'MEMBER',
    accessLevel: 'USER',
    canChat: true,
    isImmutableAdmin: false,
    createdAt: '2026-10-20T00:00:00.000Z',
  },
];

export const MOCK_USERS: User[] = SEED_USERS;

export const INITIAL_USER_CONTACTS: UserContact[] = [
  {
    id: 'c_new_fern',
    ownerUserId: 'af988620-f86d-498e-840f-13b80292932e',
    contactUserId: '9fa293bf-7021-4cbb-8267-86ea0c575450',
    customNickname: 'Fern',
    chatBgColor: '#FFFFFF',
    createdAt: '2026-10-20T00:00:00.000Z',
  },
  {
    id: 'c_fern_new',
    ownerUserId: '9fa293bf-7021-4cbb-8267-86ea0c575450',
    contactUserId: 'af988620-f86d-498e-840f-13b80292932e',
    customNickname: 'New',
    chatBgColor: '#FFFFFF',
    createdAt: '2026-10-20T00:00:00.000Z',
  },
];

export const INITIAL_CONTACT_PREFERENCES: Record<string, ContactPreference> = {};

export const MOCK_STICKERS: Sticker[] = [
  {
    id: 'stk_check',
    title: 'Done',
    subTitle: 'เสร็จเรียบร้อย',
    category: 'Status',
    bgColor: '#EFF6FF',
    accentColor: '#2563EB',
    borderColor: '#BFDBFE',
    iconType: 'check-circle-2',
  },
  {
    id: 'stk_clock',
    title: 'Standby',
    subTitle: 'กำลังดำเนินการ',
    category: 'Status',
    bgColor: '#FFFBEB',
    accentColor: '#D97706',
    borderColor: '#FDE68A',
    iconType: 'clock',
  },
  {
    id: 'stk_shield',
    title: 'Encrypted',
    subTitle: 'เข้ารหัส E2EE',
    category: 'Security',
    bgColor: '#F0FDF4',
    accentColor: '#16A34A',
    borderColor: '#BBF7D0',
    iconType: 'shield-check',
  },
  {
    id: 'stk_fire',
    title: 'Urgent',
    subTitle: 'ด่วนที่สุด',
    category: 'Alert',
    bgColor: '#FEF2F2',
    accentColor: '#DC2626',
    borderColor: '#FECACA',
    iconType: 'flame',
  },
];

export const INITIAL_MESSAGES: Message[] = [];
export const INITIAL_PINNED: Record<string, string> = {};
export const INITIAL_SCHEDULES: Schedule[] = [];
