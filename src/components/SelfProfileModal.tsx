import React, { useState } from 'react';
import type { User, ColorTheme } from '../types/chat';
import { Avatar } from './Avatar';
import { X, Check, User as UserIcon, Phone, Calendar, FileText, Sparkles, Lock, Shield } from 'lucide-react';

interface SelfProfileModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: User) => void;
}

// Curated 3D avatar stickers from Thiings.co
const AVATAR_3D_OPTIONS = [
  { id: 'star', name: 'Star', url: 'https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-e8sT7Gk70iP0xK4cWw94kXl9Z5bQn2.png' },
  { id: 'approved', name: 'Approved', url: 'https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-vlzf1COZwJkp1yLn12mawFDL0yfQ3M.png' },
  { id: 'sparkle', name: 'Sparkle', url: 'https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-iT6iw7WfyRXgolEFCKBTQ4uBNFPlOQ.png' },
  { id: 'rocket', name: 'Rocket', url: 'https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-k9L2xPq7M0n1Vw4bZ8cXy9Za3Qe5Rt.png' },
  { id: 'shield', name: 'Shield', url: 'https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-RQtOXVb8LaWRBM1vFtlMCggGMulrKV.png' },
  { id: 'diamond', name: 'Diamond', url: 'https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-a1B2c3D4e5F6g7H8i9J0kLmNoPqRsT.png' },
];

export const SelfProfileModal: React.FC<SelfProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSave,
}) => {
  const [firstName, setFirstName] = useState(currentUser.firstName || currentUser.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(currentUser.lastName || currentUser.name.split(' ').slice(1).join(' ') || '');
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle || currentUser.role || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [age, setAge] = useState(currentUser.age?.toString() || '');
  const [bio, setBio] = useState(currentUser.bio || currentUser.details || '');
  const [avatarColor, setAvatarColor] = useState<ColorTheme>(currentUser.avatarColor);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser.avatarUrl);
  const [activeTab, setActiveTab] = useState<'presets' | 'thiings3d'>('presets');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = firstName.trim() || currentUser.firstName || 'User';
    const cleanLast = lastName.trim() || currentUser.lastName || '';
    const cleanJob = jobTitle.trim() || undefined;
    const cleanBio = bio.trim() || undefined;

    const updated: User = {
      ...currentUser,
      firstName: cleanFirst,
      lastName: cleanLast,
      name: `${cleanFirst} ${cleanLast}`.trim(),
      jobTitle: cleanJob,
      role: cleanJob,
      phone: phone.trim() || undefined,
      age: age.trim() ? parseInt(age.trim(), 10) || currentUser.age : undefined,
      bio: cleanBio,
      details: cleanBio,
      avatarColor,
      avatarUrl: avatarUrl || undefined,
      initials: ((cleanFirst[0] || '') + (cleanLast[0] || '')).toUpperCase() || currentUser.initials,
    };
    onSave(updated);
    onClose();
  };

  const colorThemes: { id: ColorTheme; name: string; bg: string; border: string }[] = [
    { id: 'blue', name: 'Sky Blue', bg: 'bg-sky-500', border: 'border-sky-300' },
    { id: 'pink', name: 'Rose Pink', bg: 'bg-pink-500', border: 'border-pink-300' },
    { id: 'orange', name: 'Orange', bg: 'bg-orange-500', border: 'border-orange-300' },
    { id: 'black', name: 'Slate Dark', bg: 'bg-slate-800', border: 'border-slate-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#111827] text-white flex items-center justify-center shadow-xs">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                แก้ไขโปรไฟล์ส่วนตัว (Profile Settings)
              </h2>
              <p className="text-xs text-slate-500">
                ข้อมูลบัญชีและรูปประจำตัวของคุณบน HusH
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Avatar Preview & Selection */}
          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>รูปประจำตัว (Avatar)</span>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(undefined)}
                  className="text-[11px] font-semibold text-[#0EA5E9] hover:underline"
                >
                  ใช้อักษรย่อปกติ (Reset to Initials)
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Avatar
                initials={((firstName.trim()[0] || '') + (lastName.trim()[0] || '')).toUpperCase() || currentUser.initials}
                avatarUrl={avatarUrl}
                color={avatarColor}
                size="2xl"
                className="shadow-md ring-4 ring-white"
              />

              <div className="flex-1 space-y-2">
                {/* Tabs: Color Presets vs 3D Stickers */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    className={`flex-1 py-1 rounded-lg transition-all ${
                      activeTab === 'presets'
                        ? 'bg-white text-[#111827] shadow-xs'
                        : 'text-slate-600 hover:text-[#111827]'
                    }`}
                  >
                    ชุดสีตัวอักษร
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('thiings3d')}
                    className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                      activeTab === 'thiings3d'
                        ? 'bg-white text-[#111827] shadow-xs'
                        : 'text-slate-600 hover:text-[#111827]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>3D Avatar</span>
                  </button>
                </div>

                {activeTab === 'presets' ? (
                  <div className="flex items-center gap-2 pt-1">
                    {colorThemes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setAvatarColor(c.id);
                          setAvatarUrl(undefined);
                        }}
                        className={`group relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                          avatarColor === c.id && !avatarUrl
                            ? 'border-[#111827] scale-110 shadow-sm'
                            : 'border-transparent hover:scale-105'
                        }`}
                        title={c.name}
                      >
                        <span className={`w-6 h-6 rounded-full ${c.bg}`} />
                        {avatarColor === c.id && !avatarUrl && (
                          <Check className="w-3 h-3 text-white absolute stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {AVATAR_3D_OPTIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAvatarUrl(item.url)}
                        className={`p-1 rounded-xl border-2 transition-all flex items-center justify-center aspect-square bg-white ${
                          avatarUrl === item.url
                            ? 'border-[#0EA5E9] ring-2 ring-sky-200 scale-105 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        title={item.name}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* First Name & Last Name (Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ชื่อจริง (First Name) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="เช่น Alex"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                นามสกุล (Last Name) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="เช่น Lee"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Job Title (Optional) & Username (Read-Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>ตำแหน่งงาน (Job Title)</span>
                <span className="text-[10px] text-slate-400 font-normal">ไม่บังคับ (Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="เช่น Lead Product Designer"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>ชื่อผู้ใช้ (Username)</span>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> ล็อกโดย Admin
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={`@${currentUser.username}`}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium cursor-not-allowed select-none"
                />
              </div>
            </div>
          </div>

          {/* Phone & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                เบอร์โทรศัพท์ (Phone Number)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+66 81 234 5678"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#111827] tabular-nums focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                อายุ (Age)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="28"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#111827] tabular-nums focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bio / Details (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>รายละเอียดเพิ่มเติม / ข้อมูลแนะนำตัว (Details & Bio)</span>
              <span className="text-[10px] text-slate-400 font-normal">ไม่บังคับ (Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="เขียนแนะนำตัวหรือรายละเอียดเพิ่มเติม (สามารถเว้นว่างได้)..."
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all resize-none"
              />
            </div>
          </div>

          {/* Security & Neon PostgreSQL note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-700">
                สิทธิ์และความเป็นส่วนตัว (End-to-End Privacy)
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
                การแก้ไขข้อมูลนี้จะถูกบันทึกลงในฐานข้อมูล Neon PostgreSQL (ตาราง <code>users</code>)
                และซิงก์แบบเรียลไทม์ผ่าน WebSocket ไปยังคู่สนทนาทั้งหมด
              </p>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#0EA5E9] hover:bg-[#0284C7] rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกโปรไฟล์</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
