import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ColorTheme, TextSize, ThiingsSticker } from '../types/chat';
import { CURATED_THIINGS_STICKERS, STICKER_CATEGORIES } from '../data/thiingsStickers';
import { ThiingsStickerDisplay } from './ThiingsStickerDisplay';
import { Send, Smile, Type, Check, X, Search, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, color: ColorTheme, size: TextSize) => void;
  onSendThiingsSticker: (stickerId: string, fileId: string, name: string) => void;
}

const COMMON_EMOJIS = [
  '😊', '👍', '🙌', '❤️', '🔥', '🎉', '✨', '🚀',
  '💡', '👏', '👀', '🤝', '💯', '✅', '⏳', '📌',
  '💼', '📊', '⚡', '☕', '🌟', '🙏', '😍', '🤩',
  '💬', '🔒', '📱', '💻', '🎯', '🏆', '✌️', '💪'
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendThiingsSticker,
}) => {
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState<ColorTheme>('black');
  const [textSize, setTextSize] = useState<TextSize>('M');

  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'emoji' | 'thiings'>('thiings');

  // Thiings 3D sticker search and category filtering
  const [stickerSearch, setStickerSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colorsConfig: { id: ColorTheme; label: string; hex: string; bg: string }[] = [
    { id: 'black', label: 'ดำ (Black)', hex: '#111827', bg: 'bg-[#111827]' },
    { id: 'orange', label: 'ส้ม (Orange)', hex: '#EA580C', bg: 'bg-[#EA580C]' },
    { id: 'blue', label: 'ฟ้า (Sky Blue)', hex: '#0284C7', bg: 'bg-[#0284C7]' },
    { id: 'pink', label: 'ชมพู (Pink)', hex: '#DB2777', bg: 'bg-[#DB2777]' },
  ];

  const sizesConfig: { id: TextSize; label: string; desc: string; previewClass: string }[] = [
    { id: 'S', label: 'S', desc: 'เล็ก (13px)', previewClass: 'text-[13px]' },
    { id: 'M', label: 'M', desc: 'ปกติ (15px)', previewClass: 'text-[15px]' },
    { id: 'L', label: 'L', desc: 'ใหญ่ (18px)', previewClass: 'text-[18px] font-medium' },
    { id: 'XL', label: 'XL', desc: 'ใหญ่พิเศษ (24px)', previewClass: 'text-[24px] font-bold' },
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
    }
  }, [text]);

  // Esc key listener to close popovers/drawers
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFormatMenu(false);
        setShowEmojiMenu(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim(), textColor, textSize);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setShowFormatMenu(false);
    setShowEmojiMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSelectThiingsSticker = (sticker: ThiingsSticker) => {
    onSendThiingsSticker(sticker.id, sticker.fileId, sticker.name);
    setShowEmojiMenu(false);
  };

  // Filtered 3D stickers
  const filteredStickers = useMemo(() => {
    return CURATED_THIINGS_STICKERS.filter((s) => {
      const matchesCategory =
        selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !stickerSearch.trim() ||
        s.name.toLowerCase().includes(stickerSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(stickerSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, stickerSearch]);

  // Active preview styling for typing
  const previewTextColor = {
    black: 'text-[#111827]',
    orange: 'text-[#EA580C]',
    blue: 'text-[#0284C7]',
    pink: 'text-[#DB2777]',
  }[textColor];

  const previewTextSize = {
    S: 'text-[13px]',
    M: 'text-[15px]',
    L: 'text-[18px] font-medium',
    XL: 'text-[24px] font-bold',
  }[textSize];

  return (
    <div className="bg-white border-t border-[#E5E7EB] p-2.5 sm:p-4 shrink-0 relative select-none pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {/* Mobile Backdrop for Drawers (< 768px) */}
      {(showFormatMenu || showEmojiMenu) && (
        <div
          onClick={() => {
            setShowFormatMenu(false);
            setShowEmojiMenu(false);
          }}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 md:hidden animate-fadeIn"
        />
      )}

      {/* 1. Text Formatting Popover / Bottom Sheet (T Button) */}
      {showFormatMenu && (
        <div
          className="fixed inset-x-0 bottom-0 md:absolute md:bottom-full md:mb-2 md:left-6 md:inset-x-auto bg-white border border-[#E5E7EB] rounded-t-3xl md:rounded-2xl shadow-popover p-4 w-full md:w-80 z-40 animate-slideUp md:animate-scaleIn max-h-[80vh] overflow-y-auto"
        >
          {/* Mobile Drag Indicator */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3 md:hidden" />

          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
              <Type className="w-4 h-4 text-slate-500" />
              <span>ปรับแต่งตัวหนังสือ (Typography)</span>
            </span>
            <button
              onClick={() => setShowFormatMenu(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Color Chooser */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">
              เลือกสีตัวหนังสือ (4 สีหลัก):
            </div>
            <div className="grid grid-cols-4 gap-2">
              {colorsConfig.map((c) => {
                const isSelected = textColor === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setTextColor(c.id)}
                    title={c.label}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#111827] bg-slate-50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full ${c.bg} flex items-center justify-center shadow-xs`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 truncate">
                      {c.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Chooser */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-2">
              เลือกขนาดตัวหนังสือ (4 ระดับ):
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {sizesConfig.map((s) => {
                const isSelected = textSize === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setTextSize(s.id)}
                    title={s.desc}
                    className={`py-2 px-2 rounded-xl text-center border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#111827] text-white border-[#111827] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Emoji & Thiings.co 3D Stickers Popover / Bottom Sheet (😊 Button) */}
      {showEmojiMenu && (
        <div
          className="fixed inset-x-0 bottom-0 md:absolute md:bottom-full md:mb-2 md:left-6 md:inset-x-auto bg-white border border-[#E5E7EB] rounded-t-3xl md:rounded-2xl shadow-popover p-3.5 w-full md:w-[380px] z-40 animate-slideUp md:animate-scaleIn max-h-[85vh] md:max-h-[500px] flex flex-col"
        >
          {/* Mobile Drag Indicator */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-2 md:hidden" />

          {/* Tab Headers */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('thiings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'thiings'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" />
                <span>3D Stickers</span>
              </button>
              <button
                onClick={() => setActiveTab('emoji')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'emoji'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                😊 Emojis
              </button>
            </div>

            <button
              onClick={() => setShowEmojiMenu(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab 1: Thiings.co 3D Stickers */}
          {activeTab === 'thiings' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Search Bar inside Sticker Picker */}
              <div className="relative mb-2 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={stickerSearch}
                  onChange={(e) => setStickerSearch(e.target.value)}
                  placeholder="ค้นหา 3D สติกเกอร์ (เช่น approved, heart, chart)..."
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#111827] focus:bg-white"
                />
                {stickerSearch && (
                  <button
                    onClick={() => setStickerSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Category Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 shrink-0 no-scrollbar">
                {STICKER_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#111827] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* 3D Stickers Grid */}
              <div className="flex-1 overflow-y-auto pr-1 min-h-[220px] max-h-[300px]">
                {filteredStickers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    ไม่พบสติกเกอร์ที่ตรงกับ "{stickerSearch}"
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {filteredStickers.map((sticker) => (
                      <button
                        key={sticker.id}
                        type="button"
                        onClick={() => handleSelectThiingsSticker(sticker)}
                        className="flex flex-col items-center justify-center p-1.5 rounded-xl border border-slate-100 hover:border-sky-300 hover:bg-sky-50/40 transition-all group"
                      >
                        <ThiingsStickerDisplay
                          fileId={sticker.fileId}
                          name={sticker.name}
                          size="sm"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer attribution */}
              <div className="pt-2 mt-1 border-t border-slate-100 text-[10px] text-slate-400 text-center shrink-0">
                ⚡ Powered by Thiings.co 3D Icon Collection (Zero-Blob Payload)
              </div>
            </div>
          )}

          {/* Tab 2: Standard Emoji Grid */}
          {activeTab === 'emoji' && (
            <div className="max-h-[280px] overflow-y-auto pr-1">
              <div className="grid grid-cols-8 gap-1 pt-1">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:bg-slate-100 hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Input Box */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] focus-within:bg-white focus-within:border-[#111827] focus-within:ring-1 focus-within:ring-[#111827] transition-all p-2 sm:p-2.5">
        {/* Text Area (at least 16px on mobile to avoid iOS Safari zoom, md:text-sm for desktop) */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="พิมพ์ข้อความ... (Enter เพื่อส่ง)"
          rows={1}
          className={`w-full bg-transparent resize-none border-0 focus:outline-none placeholder-slate-400 tabular-nums ${previewTextColor} ${previewTextSize} text-base md:text-inherit px-1.5 py-1 min-h-[36px]`}
        />

        {/* Action Toolbar Below Input */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
          {/* Left Action Buttons: T (Typography) and 😊 (Emoji / 3D Sticker) */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* T Button (Min 44x44px touch target on mobile) */}
            <button
              type="button"
              onClick={() => {
                setShowFormatMenu(!showFormatMenu);
                setShowEmojiMenu(false);
              }}
              title="ปรับแต่งสีและขนาดตัวอักษร (T)"
              className={`flex items-center gap-1 px-2.5 py-1.5 min-h-[38px] rounded-xl border text-xs font-bold transition-all ${
                showFormatMenu
                  ? 'bg-[#111827] text-white border-[#111827]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>T</span>
              {/* Active color dot & size indicator */}
              <span
                className="w-2 h-2 rounded-full border border-white/50 shrink-0"
                style={{
                  backgroundColor: {
                    black: '#111827',
                    orange: '#EA580C',
                    blue: '#0284C7',
                    pink: '#DB2777',
                  }[textColor],
                }}
              />
              <span className="text-[10px] text-slate-400 font-normal">
                {textSize}
              </span>
            </button>

            {/* Emoji & 3D Sticker Button */}
            <button
              type="button"
              onClick={() => {
                setShowEmojiMenu(!showEmojiMenu);
                setShowFormatMenu(false);
              }}
              title="แทรกอิโมจิ หรือ 3D สติกเกอร์ (😊)"
              className={`p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border transition-all ${
                showEmojiMenu
                  ? 'bg-[#111827] text-white border-[#111827]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Current style badge preview (Desktop only) */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 pl-1">
              <span>โหมด:</span>
              <span
                className="font-semibold"
                style={{
                  color: {
                    black: '#111827',
                    orange: '#EA580C',
                    blue: '#0284C7',
                    pink: '#DB2777',
                  }[textColor],
                }}
              >
                {textColor}
              </span>
              <span>·</span>
              <span className="font-semibold text-slate-600">{textSize}</span>
            </div>
          </div>

          {/* Right Action: Pill-shaped Send Button in Sky Blue #0EA5E9 */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 min-h-[40px] rounded-full font-bold text-xs shadow-sm transition-all ${
              text.trim()
                ? 'bg-[#0EA5E9] hover:bg-[#0284C7] text-white cursor-pointer active:scale-95 shadow-sky-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer Subtext (Responsive format) */}
      <div className="mt-1.5 px-1 text-[11px] text-slate-400">
        {/* Desktop / Tablet */}
        <div className="hidden sm:flex items-center justify-between">
          <div>Enter to send · Shift + Enter for a new line</div>
          <div>🔒 Just between you two · History auto-clears after 3 months</div>
        </div>

        {/* Mobile (< 640px) */}
        <div className="sm:hidden text-center">
          🔒 Private · Auto-clears after 3 months
        </div>
      </div>
    </div>
  );
};
