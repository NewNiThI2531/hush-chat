import React from 'react';
import type { Schedule, User } from '../types/chat';
import { Calendar, Bell, ArrowRight, X, Clock } from 'lucide-react';

interface ScheduleDueAlertModalProps {
  schedule: Schedule | null;
  partnerUser?: User;
  onJumpToChat: (partnerUser: User) => void;
  onDismiss: () => void;
}

export const ScheduleDueAlertModal: React.FC<ScheduleDueAlertModalProps> = ({
  schedule,
  partnerUser,
  onJumpToChat,
  onDismiss,
}) => {
  if (!schedule) return null;

  const dt = new Date(schedule.scheduledAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-text">
      <div
        className="w-full max-w-md bg-white rounded-3xl border-2 border-[#0EA5E9] shadow-2xl overflow-hidden animate-scaleUp p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#0284C7] border border-sky-200 text-xs font-black tracking-wide uppercase">
            <Bell className="w-3.5 h-3.5 text-[#0EA5E9] animate-bounce" />
            <span>1:1 Schedule Due Alert</span>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Box */}
        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-[#111827] leading-snug">
            {schedule.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span className="font-semibold text-slate-700">
              {dt.toLocaleDateString('th-TH')} เวลา {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} น.
            </span>
            {partnerUser && (
              <>
                <span>•</span>
                <span>สนทนากับ <strong className="text-slate-800">{partnerUser.name}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Message preview */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-xs text-slate-700 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            ข้อความที่ถูกส่งเข้าแชทอัตโนมัติ:
          </span>
          <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
            {schedule.autoMessage}
          </p>
        </div>

        {/* Notification note */}
        <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>ระบบได้ทำการส่งข้อความนี้เข้าสู่ห้องแชทเรียบร้อยแล้ว</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            รับทราบ (Dismiss)
          </button>

          {partnerUser && (
            <button
              type="button"
              onClick={() => onJumpToChat(partnerUser)}
              className="px-4 py-2.5 bg-[#111827] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>ไปที่แชทบทสนทนานี้</span>
              <ArrowRight className="w-4 h-4 text-[#0EA5E9]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
