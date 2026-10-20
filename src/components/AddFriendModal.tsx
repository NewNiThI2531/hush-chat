import React, { useState } from 'react';
import type { User } from '../types/chat';
import { storageService } from '../services/storageService';
import { Avatar } from './Avatar';
import { UserPlus, X, Search, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onFriendAdded: (newFriend: User) => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onFriendAdded,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState('');
  const [successUser, setSuccessUser] = useState<User | null>(null);

  if (!isOpen) return null;

  const cleanQuery = usernameInput.trim().replace(/^@/, '').toLowerCase();
  const previewUser = cleanQuery
    ? storageService.getAllUsers().find(u => u.username.toLowerCase() === cleanQuery && u.id !== currentUser.id)
    : undefined;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessUser(null);

    try {
      const result = storageService.addContactByUsername(currentUser.id, usernameInput);
      setSuccessUser(result.user);
      onFriendAdded(result.user);
      setUsernameInput('');
      setTimeout(() => {
        setSuccessUser(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเพิ่มเพื่อน');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-text">
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl overflow-hidden animate-scaleUp p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#111827] text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5 text-[#0EA5E9]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                เพิ่มเพื่อนด้วย Username
              </h3>
              <p className="text-[11px] text-slate-500">
                ค้นหาและเพิ่มผู้ใช้งานด้วย @username เข้าสู่รายชื่อแชทของคุณ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAdd} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successUser && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>เพิ่ม @{successUser.username} ({successUser.name}) สำเร็จแล้ว!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ชื่อผู้ใช้งาน (@username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setError('');
                }}
                placeholder="เช่น fernrs, new010"
                required
                autoFocus
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              ระบบจะทำการค้นหาบัญชีที่ตรงกับ @username ที่ Admin ได้ลงทะเบียนไว้
            </p>
          </div>

          {/* Quick Preview Card if match found */}
          {previewUser && (
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  initials={previewUser.initials}
                  avatarUrl={previewUser.avatarUrl}
                  color={previewUser.avatarColor}
                  size="md"
                  status={previewUser.status}
                  showStatus
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#111827] truncate">
                    {previewUser.name}
                  </h4>
                  <p className="text-[11px] text-[#0EA5E9] font-medium truncate">
                    @{previewUser.username}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {previewUser.role}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                พบบัญชีนี้
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#111827] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#0EA5E9]" />
              <span>เพิ่มเป็นเพื่อน (Add Friend)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
