import type { Sticker } from '../types/chat';

export const SYSTEM_STICKERS: Sticker[] = [
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
