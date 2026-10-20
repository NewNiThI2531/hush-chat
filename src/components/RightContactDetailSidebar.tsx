import React, { useState, useEffect } from 'react';
import type { User } from '../types/chat';
import { CHAT_BACKGROUND_THEMES } from '../types/chat';
import { Avatar } from './Avatar';
import {
  X,
  UserCheck,
  Edit2,
  Palette,
  Phone,
  Calendar,
  Check,
  RotateCcw,
  Briefcase,
} from 'lucide-react';

interface RightContactDetailSidebarProps {
  contact: User;
  customNickname?: string;
  chatBgColor?: string;
  onUpdateNickname: (nickname: string) => void;
  onUpdateChatBgColor: (colorHex: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const RightContactDetailSidebar: React.FC<RightContactDetailSidebarProps> = ({
  contact,
  customNickname = '',
  chatBgColor = '#FFFFFF',
  onUpdateNickname,
  onUpdateChatBgColor,
  onClose,
  isOpen,
}) => {
  const [nicknameInput, setNicknameInput] = useState(customNickname);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);

  useEffect(() => {
    setNicknameInput(customNickname || '');
    setIsEditingNickname(false);
  }, [customNickname, contact.id]);

  const handleSaveNickname = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateNickname(nicknameInput.trim());
    setIsEditingNickname(false);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  const handleCancelEdit = () => {
    setNicknameInput(customNickname || '');
    setIsEditingNickname(false);
  };

  const handleResetNickname = () => {
    setNicknameInput('');
    onUpdateNickname('');
    setIsEditingNickname(false);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  // Optional fields
  const job = (contact.jobTitle || contact.role || '').trim();
  const bioDetails = (contact.bio || contact.details || '').trim();
  const hasMetadata = Boolean(contact.phone?.trim() || contact.age);

  return (
    <>
      {/* Mobile, Tablet & Laptop Backdrop overlay (< 1280px) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 xl:hidden animate-fadeIn"
        />
      )}

      {/* Right Sidebar Container: w-80 (320px) on xl+, slide-over drawer below xl */}
      <aside
        className={`
          fixed top-0 right-0 bottom-0 z-50 w-80 sm:w-84 xl:w-80 bg-white border-l border-[#E5E7EB]
          flex flex-col h-full shadow-2xl xl:shadow-none select-none transition-transform duration-300 ease-in-out shrink-0
          ${isOpen ? 'translate-x-0 xl:static' : 'translate-x-full xl:hidden'}
        `}
      >
        {/* Header */}
        <div className="h-16 px-5 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#0EA5E9]" />
            <h3 className="text-sm font-bold text-[#111827]">
              ข้อมูลคู่สนทนา (Contact Info)
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="ปิดแถบข้อมูล (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (Focused strictly on Contact Profile, Nickname, and Chat Background Color) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. Contact Profile Header Card */}
          <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] shadow-subtle">
            <Avatar
              initials={contact.initials}
              avatarUrl={contact.avatarUrl}
              color={contact.avatarColor}
              size="2xl"
              status={contact.status}
              showStatus
              className="shadow-sm mb-3.5 ring-4 ring-white"
            />

            {/* Displayed Name with Real Name reference */}
            <h4 className="text-base font-extrabold text-[#111827] tracking-tight">
              {customNickname ? (
                <span>
                  {customNickname}
                  <span className="block text-xs font-normal text-slate-500 mt-0.5">
                    ({contact.name})
                  </span>
                </span>
              ) : (
                contact.name
              )}
            </h4>

            {/* Username */}
            <p className="text-xs font-semibold text-[#0EA5E9] mt-0.5">
              @{contact.username}
            </p>

            {/* Optional Job Title: only render if present */}
            {job && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                <Briefcase className="w-3 h-3 text-[#0EA5E9]" />
                <span>{job}</span>
              </div>
            )}

            {/* Online / Away / Offline Status Pill */}
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  contact.status === 'online'
                    ? 'bg-emerald-500 animate-pulse'
                    : contact.status === 'away'
                    ? 'bg-amber-400'
                    : 'bg-slate-400'
                }`}
              />
              <span className="capitalize">{contact.status}</span>
              {contact.lastSeen && <span className="text-slate-400">• {contact.lastSeen}</span>}
            </div>

            {/* Optional Bio / Details: only render if present */}
            {bioDetails && (
              <p className="text-xs text-slate-600 mt-3 px-2 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200/60 w-full text-left">
                {bioDetails}
              </p>
            )}

            {/* Metadata: Phone & Age (only render if available) */}
            {hasMetadata && (
              <div className="w-full mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-left">
                {contact.phone && (
                  <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>เบอร์โทร</span>
                    </div>
                    <div className="text-xs font-bold text-[#111827] mt-0.5 truncate tabular-nums">
                      {contact.phone}
                    </div>
                  </div>
                )}

                {contact.age && (
                  <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>อายุ</span>
                    </div>
                    <div className="text-xs font-bold text-[#111827] mt-0.5 tabular-nums">
                      {contact.age} ปี
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Custom Nickname Editor (Explicit Click-to-Edit Interaction) */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-[#F97316]" />
                <span>ชื่อเล่นในแชท (Nickname)</span>
              </label>

              {customNickname && !isEditingNickname && (
                <button
                  type="button"
                  onClick={handleResetNickname}
                  className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                  title="รีเซ็ตชื่อเล่นกลับเป็นชื่อจริง"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>รีเซ็ต</span>
                </button>
              )}
            </div>

            {/* Read-Only State vs. Edit Mode State */}
            {!isEditingNickname ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold text-[#111827] truncate">
                    {customNickname ? (
                      <span className="text-[#F97316]">{customNickname}</span>
                    ) : (
                      <span className="text-slate-400 font-normal italic">
                        ยังไม่ได้ตั้งชื่อเล่น (ใช้ชื่อจริง)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingNickname(true)}
                  className="flex items-center gap-1 text-xs font-bold text-[#0EA5E9] hover:text-[#0284C7] bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg border border-sky-200 transition-all cursor-pointer shrink-0"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>แก้ไข</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveNickname} className="space-y-2 animate-fadeIn">
                <input
                  type="text"
                  autoFocus
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder={`เช่น น้อง ${contact.name.split(' ')[0]}`}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#0EA5E9] rounded-xl text-xs font-semibold text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0EA5E9] focus:bg-white transition-all"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 px-3 bg-[#111827] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>บันทึก</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            )}

            {isSavedToast && (
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 animate-fadeIn">
                <Check className="w-3 h-3" /> บันทึกชื่อเล่นสำเร็จ
              </p>
            )}

            <p className="text-[11px] text-slate-400 leading-normal pt-0.5">
              💡 ชื่อเล่นนี้จะแสดงเฉพาะในหน้าจอของคุณใน Left Contacts List, Active Card และ Chat Header โดยไม่กระทบชื่อบัญชีจริงของคู่สนทนา
            </p>
          </div>

          {/* 3. Chat Background Color Theme Selector */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#0EA5E9]" />
                <span>ธีมสีพื้นหลังแชท (Chat Canvas)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                7 ธีม
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              เลือกโทนสีพื้นหลังสำหรับห้องแชทนี้ (บันทึกอัตโนมัติ):
            </p>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {CHAT_BACKGROUND_THEMES.map((theme) => {
                const isSelected = chatBgColor.toLowerCase() === theme.hex.toLowerCase();
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onUpdateChatBgColor(theme.hex)}
                    style={{ backgroundColor: theme.hex }}
                    className={`group relative h-10 rounded-xl border-2 transition-all flex items-center justify-center shadow-xs cursor-pointer ${
                      isSelected
                        ? 'border-[#0EA5E9] ring-2 ring-sky-300 scale-105'
                        : 'border-slate-200 hover:border-slate-400 hover:scale-102'
                    }`}
                    title={theme.name}
                  >
                    {isSelected && (
                      <Check
                        className={`w-4 h-4 stroke-[2.5] ${
                          theme.isDark ? 'text-white' : 'text-[#0EA5E9]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 font-medium pt-1">
              ธีมปัจจุบัน:{' '}
              <span className="font-bold text-[#111827]">
                {CHAT_BACKGROUND_THEMES.find(
                  (t) => t.hex.toLowerCase() === chatBgColor.toLowerCase()
                )?.name || chatBgColor}
              </span>
            </div>
          </div>
        </div>

        {/* Ultra-clean footer */}
        <div className="p-3.5 border-t border-[#E5E7EB] bg-[#F8FAFC] text-center text-[11px] text-slate-400">
          HusH Chat • Contact Preferences
        </div>
      </aside>
    </>
  );
};
