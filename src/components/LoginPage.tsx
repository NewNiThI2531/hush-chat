import React, { useState } from 'react';
import { SoundWaveLogo } from './SoundWaveLogo';
import { storageService } from '../services/storageService';
import type { User } from '../types/chat';
import { Lock, User as UserIcon, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2, Database } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('New010');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await storageService.authenticate(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (กรุณาตรวจสอบอีกครั้ง)');
      }
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-8 select-text">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Branding header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <SoundWaveLogo size="lg" versionBadge="v2.0.0" className="mb-3" />
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">
            เข้าสู่ระบบ HusH Messaging
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Private, Ultra-Fast & Minimalist Messaging • Neon Serverless PostgreSQL
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Neon PostgreSQL Production Database</span>
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
                  placeholder="เช่น Hushadmin, New010, Fernrs"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
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
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#111827] hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4 text-[#0EA5E9]" />
                </>
              )}
            </button>
          </form>

          {/* Credentials Info Guide */}
          <div className="mt-5 pt-4 border-t border-[#E5E7EB] text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>บัญชีทดสอบในระบบ Production:</span>
            </div>
            <div className="space-y-1.5 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">@Hushadmin</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                  Sole Admin (Immutable)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sky-700">@New010</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                  Full Access & Chat
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-pink-700">@Fernrs</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-100 text-pink-800 font-semibold">
                  Standard User
                </span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 flex justify-between">
                <span>รหัสผ่านเริ่มต้นทั้งหมด:</span>
                <code className="text-slate-700 font-bold">password123</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-5 text-xs text-slate-400">
          🔒 ข้อมูลจัดเก็บบน Neon Serverless PostgreSQL • นโยบายล้างข้อความอัตโนมัติ 90 วัน
        </div>
      </div>
    </div>
  );
};
