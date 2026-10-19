import type { ThiingsSticker } from '../types/chat';

export const THIINGS_CDN_BASE = 'https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-';

export const getThiingsUrl = (fileId: string): string => {
  return `${THIINGS_CDN_BASE}${fileId}.png`;
};

export const CURATED_THIINGS_STICKERS: ThiingsSticker[] = [
  // Approval & Success
  {
    id: 'th_approved',
    fileId: 'vlzf1COZwJkp1yLn12mawFDL0yfQ3M',
    name: 'Approved',
    category: 'Approval',
    url: getThiingsUrl('vlzf1COZwJkp1yLn12mawFDL0yfQ3M'),
  },
  {
    id: 'th_check_mark',
    fileId: '3QgwSXrWjfSV2HYyhqEm4POcAvaRqP',
    name: 'Check Mark',
    category: 'Approval',
    url: getThiingsUrl('3QgwSXrWjfSV2HYyhqEm4POcAvaRqP'),
  },
  {
    id: 'th_five_star',
    fileId: 'cgJSl3t4KGMpgZaKrHfLIILkzHZ8Oz',
    name: 'Five Star Rating',
    category: 'Approval',
    url: getThiingsUrl('cgJSl3t4KGMpgZaKrHfLIILkzHZ8Oz'),
  },
  {
    id: 'th_shield',
    fileId: 'CZxT18DNf12Vjv8rrZv8V0tddRi9Xu',
    name: 'Security Shield',
    category: 'Approval',
    url: getThiingsUrl('CZxT18DNf12Vjv8rrZv8V0tddRi9Xu'),
  },
  {
    id: 'th_handshake',
    fileId: 'g0jWpKzDefUBkVrz5WRvIkWjsUYOer',
    name: 'Handshake Deal',
    category: 'Approval',
    url: getThiingsUrl('g0jWpKzDefUBkVrz5WRvIkWjsUYOer'),
  },
  {
    id: 'th_accessibility',
    fileId: '3AxRRK8N7RUPSXd7awFUFhoUdtHvMr',
    name: 'Accessibility',
    category: 'Approval',
    url: getThiingsUrl('3AxRRK8N7RUPSXd7awFUFhoUdtHvMr'),
  },

  // Emotions & Praise
  {
    id: 'th_heart',
    fileId: 'RQtOXVb8LaWRBM1vFtlMCggGMulrKV',
    name: '3D Heart',
    category: 'Praise',
    url: getThiingsUrl('RQtOXVb8LaWRBM1vFtlMCggGMulrKV'),
  },
  {
    id: 'th_sparkle',
    fileId: 'iT6iw7WfyRXgolEFCKBTQ4uBNFPlOQ',
    name: 'AI Sparkle',
    category: 'Praise',
    url: getThiingsUrl('iT6iw7WfyRXgolEFCKBTQ4uBNFPlOQ'),
  },
  {
    id: 'th_party',
    fileId: '8Y4vTmV5FmRuiaQPvL1E4DxsEkWIpZ',
    name: 'Party Hat',
    category: 'Praise',
    url: getThiingsUrl('8Y4vTmV5FmRuiaQPvL1E4DxsEkWIpZ'),
  },
  {
    id: 'th_fireplace',
    fileId: 'vQoBDwi0TkUjbdBNlTys4prXoxZJT8',
    name: 'Fire Heat',
    category: 'Praise',
    url: getThiingsUrl('vQoBDwi0TkUjbdBNlTys4prXoxZJT8'),
  },

  // Finance & Metrics
  {
    id: 'th_charts',
    fileId: 'JuGWDxW5tzUzQbZacA8V2CW0TRBQvL',
    name: 'Bar Charts',
    category: 'Finance',
    url: getThiingsUrl('JuGWDxW5tzUzQbZacA8V2CW0TRBQvL'),
  },
  {
    id: 'th_dollar',
    fileId: 'eFBuNm0r8VaMWxy4MM6UzQWVsUvNz7',
    name: 'Dollar Bill',
    category: 'Finance',
    url: getThiingsUrl('eFBuNm0r8VaMWxy4MM6UzQWVsUvNz7'),
  },
  {
    id: 'th_coin',
    fileId: 'S70eRKwGghbWrxnQFigJARrNiDgtR2',
    name: 'Gold Coin',
    category: 'Finance',
    url: getThiingsUrl('S70eRKwGghbWrxnQFigJARrNiDgtR2'),
  },
  {
    id: 'th_wallet',
    fileId: 'r5QxxRu1dvIND6CpaRBYLTnJmCfzNM',
    name: 'Leather Wallet',
    category: 'Finance',
    url: getThiingsUrl('r5QxxRu1dvIND6CpaRBYLTnJmCfzNM'),
  },
  {
    id: 'th_piggybank',
    fileId: 'gi1guqBnlG1eNNWEdV9sOK3nbBiYfd',
    name: 'Piggy Bank',
    category: 'Finance',
    url: getThiingsUrl('gi1guqBnlG1eNNWEdV9sOK3nbBiYfd'),
  },

  // Work & Status
  {
    id: 'th_clock',
    fileId: '4nOJYyI1HbLAiWaGB8U340K3zNWcjK',
    name: 'Wall Clock',
    category: 'Status',
    url: getThiingsUrl('4nOJYyI1HbLAiWaGB8U340K3zNWcjK'),
  },
  {
    id: 'th_coffee',
    fileId: 'mOoyvLISs98asAdPdQUhTac4S9Q1M9',
    name: 'Coffee Mug',
    category: 'Status',
    url: getThiingsUrl('mOoyvLISs98asAdPdQUhTac4S9Q1M9'),
  },
  {
    id: 'th_lightbulb',
    fileId: 'JaLO4GvMZea2az0FyzzLXFoWFyjJOB',
    name: 'Lightbulb Idea',
    category: 'Status',
    url: getThiingsUrl('JaLO4GvMZea2az0FyzzLXFoWFyjJOB'),
  },
  {
    id: 'th_calendar',
    fileId: 'ij7GEZhfmzLNlLgDJVhkST8FIm5rJV',
    name: 'Calendar Date',
    category: 'Status',
    url: getThiingsUrl('ij7GEZhfmzLNlLgDJVhkST8FIm5rJV'),
  },
  {
    id: 'th_key',
    fileId: 'MUeRFCYcMO6Cp1jlR2ZQd0B6wGD5G3',
    name: 'Gold Key',
    category: 'Status',
    url: getThiingsUrl('MUeRFCYcMO6Cp1jlR2ZQd0B6wGD5G3'),
  },
  {
    id: 'th_bell',
    fileId: 'CK4odMSKWdmIj0ueBtNq9HOZR6Fbgv',
    name: 'Notification Bell',
    category: 'Status',
    url: getThiingsUrl('CK4odMSKWdmIj0ueBtNq9HOZR6Fbgv'),
  },
  {
    id: 'th_alert',
    fileId: 'rYQA0MBt7kN6Ap9xch2dYMInv4FzEX',
    name: 'Urgent Alert',
    category: 'Status',
    url: getThiingsUrl('rYQA0MBt7kN6Ap9xch2dYMInv4FzEX'),
  },
];

export const STICKER_CATEGORIES = ['All', 'Approval', 'Praise', 'Finance', 'Status'] as const;
export type StickerCategory = typeof STICKER_CATEGORIES[number];
