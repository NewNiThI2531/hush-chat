import React, { useState } from 'react';
import { SoundWaveLogo } from './SoundWaveLogo';
import { Avatar } from './Avatar';
import { MOCK_USERS } from '../data/mockData';
import type { User } from '../types/chat';
import { Lock, User as UserIcon, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('alex.lee');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matchedUser = MOCK_USERS.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() ||
           u.id.toLowerCase() === username.trim().toLowerCase()
    );

    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      setError('ไม่พบบัญชีนี้ในระบบ (กรุณาใช้บัญชีที่ Admin สร้างให้)');
    }
  };

  const handleQuickDemo = (user: User) => {
    setUsername(user.username);
    setPassword('••••••••');
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-8">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Branding header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <SoundWaveLogo size="lg" className="mb-3" />
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">
            เข้าสู่ระบบแชทส่วนตัว HusH
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            Private, Minimal & End-to-End Encrypted Messaging
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>เฉพาะสมาชิกที่ Admin สร้างให้เท่านั้น</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card p-7 transition-all">
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
                  placeholder="เช่น alex.lee"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
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
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-[#111827] hover:bg-slate-800 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
            >
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Persona Switcher */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Persona Switcher
              </span>
              <span className="text-[11px] text-sky-600 font-medium">6 Pre-Seeded Accounts</span>
            </div>

            <div className="space-y-2">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickDemo(user)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-subtle transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={user.initials}
                      color={user.avatarColor}
                      size="sm"
                      status={user.status}
                      showStatus
                    />
                    <div>
                      <div className="text-sm font-semibold text-[#111827] group-hover:text-[#0EA5E9] transition-colors">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        @{user.username} · {user.role}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 group-hover:border-[#0EA5E9] group-hover:text-[#0EA5E9] transition-colors">
                    Login
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          🔒 ประวัติแชทเก็บรักษาแบบเข้ารหัสไม่เกิน 90 วัน (Auto-clear 90 days)
        </div>
      </div>
    </div>
  );
};
