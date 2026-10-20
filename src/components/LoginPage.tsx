import React, { useState, useMemo } from 'react';
import { SoundWaveLogo } from './SoundWaveLogo';
import { Avatar } from './Avatar';
import { storageService } from '../services/storageService';
import type { User } from '../types/chat';
import { Lock, User as UserIcon, ArrowRight, ShieldCheck, Eye, EyeOff, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const users = useMemo(() => storageService.getAllUsers(), []);

  const [username, setUsername] = useState('alex');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const clean = username.trim().replace(/^@/, '').toLowerCase();
    const matchedUser = users.find(
      u => u.username.toLowerCase() === clean || u.id.toLowerCase() === clean
    );

    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      setError('ไม่พบบัญชีนี้ในระบบ (กรุณาใช้บัญชีที่ Admin สร้างให้ หรือเลือกจาก Quick Persona)');
    }
  };

  const handleQuickDemo = (user: User) => {
    setUsername(user.username);
    setPassword('••••••••');
    onLogin(user);
  };

  const getRoleBadge = (user: User) => {
    if (user.accountType === 'SYSTEM_ADMIN') {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#111827] text-white">
          SYSTEM_ADMIN (Admin Console Only)
        </span>
      );
    }
    if (user.accountType === 'OWNER_ADMIN') {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-600 text-white">
          OWNER_ADMIN (Admin + Chat)
        </span>
      );
    }
    if (user.accessLevel === 'FULL_ACCESS') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#0284C7] border border-sky-200">
          FULL_ACCESS (Manage Users)
        </span>
      );
    }
    if (user.accessLevel === 'VIEW_ALL') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          VIEW_ALL (See Directory)
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        USER (Friend List Only)
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-8 select-text">
      {/* Container */}
      <div className="w-full max-w-lg">
        {/* Branding header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <SoundWaveLogo size="lg" className="mb-3" />
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">
            เข้าสู่ระบบแชทส่วนตัว HusH
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Private, Minimal & End-to-End Encrypted Messaging • Version v1.1.0-mockup
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>เฉพาะสมาชิกที่ Admin สร้างให้เท่านั้น (Pre-Seeded & RBAC)</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-card p-6 sm:p-7 transition-all">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium animate-shake">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin, alex, sarah, elena"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-[#111827] hover:bg-slate-800 text-white font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="w-4 h-4 text-[#0EA5E9]" />
            </button>
          </form>

          {/* Quick Persona Switcher with RBAC breakdown */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" />
                <span>Quick RBAC Persona Switcher</span>
              </span>
              <span className="text-[11px] text-sky-600 font-semibold">{users.length} บัญชีในระบบ</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickDemo(user)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-subtle transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      initials={user.initials}
                      avatarUrl={user.avatarUrl}
                      color={user.avatarColor}
                      size="sm"
                      status={user.status}
                      showStatus
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#111827] group-hover:text-[#0EA5E9] transition-colors truncate flex items-center gap-1.5">
                        <span>{user.name}</span>
                        <span className="font-mono text-slate-400 font-normal">(@{user.username})</span>
                      </div>
                      <div className="mt-0.5">
                        {getRoleBadge(user)}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 group-hover:border-[#0EA5E9] group-hover:text-[#0EA5E9] transition-colors shrink-0 ml-2">
                    Login
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-5 text-xs text-slate-400">
          🔒 ข้อมูลในระบบจำลองการทำงานของ Neon Serverless PostgreSQL + Relational RBAC
        </div>
      </div>
    </div>
  );
};
