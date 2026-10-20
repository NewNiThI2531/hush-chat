import React, { useState, useMemo } from 'react';
import type { User, Schedule } from '../types/chat';
import { storageService } from '../services/storageService';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Send,
  Trash2,
  CheckCircle2,
  Zap,
  AlertCircle,
  CalendarDays,
  ListTodo,
} from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  contact: User;
  displayedContactName: string;
  conversationId: string;
  onScheduleCreated?: () => void;
  onScheduleDeleted?: () => void;
}

const MONTH_NAMES_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const DAY_NAMES_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  contact,
  displayedContactName,
  conversationId,
  onScheduleCreated,
  onScheduleDeleted,
}) => {
  // Calendar view mode: 'calendar' (Month + Agenda like iOS), 'agenda' (Full list), 'create' (New event)
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda' | 'create'>('calendar');

  // Currently displayed month & year in calendar
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // Selected date in calendar (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  // Form states
  const [title, setTitle] = useState('');
  const [autoMessage, setAutoMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all schedules for this 1:1 conversation
  const schedules = useMemo(() => {
    if (!conversationId) return [];
    return storageService.getSchedulesForConversation(conversationId);
  }, [conversationId, viewMode, successMsg]);

  // Map of date string (YYYY-MM-DD) -> Schedule[]
  const schedulesByDate = useMemo(() => {
    const map: Record<string, Schedule[]> = {};
    schedules.forEach((s) => {
      const d = new Date(s.scheduledAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [schedules]);

  if (!isOpen) return null;

  // Selected date key
  const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const eventsOnSelectedDate = schedulesByDate[selectedDateKey] || [];

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  // Calendar Grid Calculation (iOS style 7-column grid)
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];
  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }
  // Next month leading days to complete full grid (multiple of 7)
  const remainingCells = 42 - calendarDays.length; // 6 rows * 7
  for (let d = 1; d <= (remainingCells >= 7 ? remainingCells - 7 : remainingCells); d++) {
    calendarDays.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  // Quick Preset Handlers
  const handleApplyPreset = (secondsFromNow: number, label: string) => {
    const targetDate = new Date(Date.now() + secondsFromNow * 1000);
    const localIso = new Date(targetDate.getTime() - targetDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduledAt(localIso);
    setSelectedDate(targetDate);
    if (!title.trim()) {
      setTitle(`นัดหมาย (${label})`);
    }
    if (!autoMessage.trim()) {
      setAutoMessage(`⏰ ถึงเวลานัดหมายตามกำหนด (${label}) แล้วครับ!`);
    }
  };

  const handleApplyTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduledAt(localIso);
    setSelectedDate(d);
    if (!title.trim()) {
      setTitle('สรุปงานประจำวันเช้าวันพรุ่งนี้');
    }
    if (!autoMessage.trim()) {
      setAutoMessage('🌅 อรุณสวัสดิ์ครับ! ถึงเวลานัดหมายสรุปงาน 09:00 น. เรียบร้อยแล้วครับ');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim()) {
      setError('กรุณาระบุหัวข้อนัดหมาย');
      return;
    }
    if (!autoMessage.trim()) {
      setError('กรุณาระบุข้อความที่จะส่งอัตโนมัติเข้าแชท');
      return;
    }
    if (!scheduledAt) {
      setError('กรุณาเลือกวันและเวลา');
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      setError('รูปแบบวันและเวลาไม่ถูกต้อง');
      return;
    }

    try {
      storageService.createSchedule({
        conversationId,
        createdByUserId: currentUser.id,
        targetUserId: contact.id,
        title: title.trim(),
        autoMessage: autoMessage.trim(),
        scheduledAt: scheduledDate.toISOString(),
      });

      setSelectedDate(scheduledDate);
      setCurrentMonthDate(new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), 1));
      setTitle('');
      setAutoMessage('');
      setSuccessMsg('บันทึกกำหนดการนัดหมายสำเร็จ!');
      onScheduleCreated?.();
      setTimeout(() => {
        setViewMode('calendar');
        setSuccessMsg('');
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างนัดหมาย');
    }
  };

  const handleDelete = (id: string) => {
    storageService.deleteSchedule(id);
    onScheduleDeleted?.();
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const isSelected = (d: Date) => {
    return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-text">
      <div
        className="w-full max-w-3xl bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS-Style Top Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-[#E5E7EB] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#111827] text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5 text-[#0EA5E9]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#111827]">
                  Calendar • นัดหมาย 1:1
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#0284C7] border border-sky-200">
                  {displayedContactName}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                ระบบปฏิทินนัดหมายแบบ iPhone Calendar ส่งข้อความเข้าแชทและแจ้งเตือนอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Add Event (+) button */}
            <button
              type="button"
              onClick={() => {
                // Pre-fill datetime with selected date
                const d = new Date(selectedDate);
                d.setHours(new Date().getHours() + 1, 0, 0, 0);
                const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                setScheduledAt(localIso);
                setViewMode('create');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="สร้างนัดหมายใหม่"
            >
              <Plus className="w-4 h-4 text-[#0EA5E9]" />
              <span className="hidden sm:inline">เพิ่มนัดหมาย</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* iOS-Style Segmented View Switcher */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50 border-b border-[#E5E7EB] flex items-center justify-between gap-3">
          {/* Segmented Control */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 text-xs font-bold text-slate-600 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span>ปฏิทินรายเดือน (Month)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span>วาระนัดหมายทั้งหมด ({schedules.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('create')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'create'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span>สร้างนัดหมาย (+)</span>
            </button>
          </div>

          {/* Today Button */}
          {viewMode === 'calendar' && (
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3 py-1 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:text-[#0EA5E9] hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
            >
              วันนี้ (Today)
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* VIEW 1: iOS Calendar & Agenda View */}
          {viewMode === 'calendar' && (
            <div className="space-y-5">
              {/* iOS Month Header (Month Year + Prev/Next Arrows) */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#111827] tracking-tight">
                    {MONTH_NAMES_TH[month]} {year + 543}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">({year})</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                    title="เดือนก่อนหน้า"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                    title="เดือนถัดไป"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* iOS Month Calendar Grid */}
              <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-3xl p-3 sm:p-4 shadow-subtle">
                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2 select-none">
                  {DAY_NAMES_TH.map((dName, i) => (
                    <div
                      key={dName}
                      className={`py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}
                    >
                      {dName}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {calendarDays.map((cell, idx) => {
                    const cDate = cell.date;
                    const dateStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
                    const hasEvents = schedulesByDate[dateStr] && schedulesByDate[dateStr].length > 0;
                    const currentIsToday = isToday(cDate);
                    const currentIsSelected = isSelected(cDate);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(cDate)}
                        className={`h-11 sm:h-13 rounded-2xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                          !cell.isCurrentMonth ? 'opacity-30' : ''
                        } ${
                          currentIsSelected
                            ? 'bg-white border-2 border-[#111827] shadow-xs'
                            : 'hover:bg-white/80'
                        }`}
                      >
                        {/* Date Number with Today Red Circle (Apple Calendar Style) */}
                        <span
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold tabular-nums transition-all ${
                            currentIsToday
                              ? 'bg-[#EF4444] text-white shadow-xs'
                              : currentIsSelected
                              ? 'text-[#111827] font-black'
                              : 'text-slate-700'
                          }`}
                        >
                          {cDate.getDate()}
                        </span>

                        {/* Event Dot Indicator (Apple iOS style) */}
                        {hasEvents && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] shadow-xs"></span>
                            {schedulesByDate[dateStr].length > 1 && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-xs"></span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* iOS Selected Day Agenda View */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0EA5E9]" />
                    <h4 className="text-sm font-bold text-[#111827]">
                      วาระนัดหมายประจำวันที่ {selectedDate.getDate()} {MONTH_NAMES_TH[selectedDate.getMonth()]} {selectedDate.getFullYear() + 543}
                    </h4>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    {eventsOnSelectedDate.length} รายการ
                  </span>
                </div>

                {eventsOnSelectedDate.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-slate-300" />
                    <span>ไม่มีการนัดหมายในวันที่เลือก</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(selectedDate);
                        d.setHours(new Date().getHours() + 1, 0, 0, 0);
                        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setScheduledAt(localIso);
                        setViewMode('create');
                      }}
                      className="text-xs font-bold text-[#0EA5E9] hover:underline cursor-pointer"
                    >
                      + เพิ่มนัดหมายสำหรับวันนี้
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {eventsOnSelectedDate.map((item) => {
                      const dt = new Date(item.scheduledAt);
                      const isCreator = item.createdByUserId === currentUser.id;

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs hover:border-[#0EA5E9] transition-all flex items-start justify-between gap-3 relative overflow-hidden"
                        >
                          {/* Left Apple Calendar Colored Stripe */}
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0EA5E9]"></div>

                          <div className="pl-2 space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#0EA5E9] font-mono tabular-nums">
                                {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} น.
                              </span>
                              <h5 className="text-xs sm:text-sm font-bold text-[#111827] truncate">
                                {item.title}
                              </h5>
                              {item.isTriggered && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  ส่งเข้าแชทแล้ว ✓
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                              {item.autoMessage}
                            </p>

                            <div className="text-[11px] text-slate-400">
                              ผู้สร้าง: {isCreator ? 'คุณ' : displayedContactName}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            title="ลบนัดหมาย"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: Full Agenda View (All Schedules) */}
          {viewMode === 'agenda' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#111827]">
                  รายการนัดหมายทั้งหมดในบทสนทนานี้ ({schedules.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setViewMode('create')}
                  className="text-xs font-bold text-[#0EA5E9] hover:underline cursor-pointer"
                >
                  + เพิ่มนัดหมายใหม่
                </button>
              </div>

              {schedules.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center text-xs text-slate-500 space-y-2">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>ยังไม่มีนัดหมายในบทสนทนานี้</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {schedules.map((item) => {
                    const dt = new Date(item.scheduledAt);
                    const isUpcoming = !item.isTriggered && dt.getTime() > Date.now();

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 relative overflow-hidden ${
                          isUpcoming
                            ? 'bg-white border-sky-200 shadow-2xs hover:border-[#0EA5E9]'
                            : 'bg-slate-50 border-slate-200 opacity-80'
                        }`}
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            isUpcoming ? 'bg-[#0EA5E9]' : 'bg-slate-300'
                          }`}
                        ></div>

                        <div className="pl-2 space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">
                              {dt.toLocaleDateString('th-TH', { dateStyle: 'medium' })} เวลา {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} น.
                            </span>
                            {item.isTriggered && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ส่งเข้าแชทแล้ว ✓
                              </span>
                            )}
                          </div>

                          <h5 className="text-sm font-bold text-[#111827]">
                            {item.title}
                          </h5>

                          <p className="text-xs text-slate-600 bg-slate-100/60 p-2 rounded-xl border border-slate-200/60">
                            {item.autoMessage}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: Create Schedule Form */}
          {viewMode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  หัวข้อนัดหมาย (Event Title) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น สรุปงานออกแบบ หรือ ส่งมอบตัวเลข KPI"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#111827] transition-all"
                />
              </div>

              {/* Date & Time Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  วันและเวลาที่ต้องการแจ้งเตือน (Scheduled Date & Time) <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#111827] transition-all"
                />

                {/* Quick Presets for Instant Testing */}
                <div className="mt-2.5 pt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Presets:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(10, 'ทดสอบ 10 วินาที')}
                    className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                  >
                    ⚡ ในอีก 10 วินาที (Test)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(60, 'อีก 1 นาที')}
                    className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg font-semibold text-[11px] transition-all cursor-pointer"
                  >
                    ⏱️ ในอีก 1 นาที
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyTomorrowMorning}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg font-semibold text-[11px] transition-all cursor-pointer"
                  >
                    🌅 พรุ่งนี้ 09:00 น.
                  </button>
                </div>
              </div>

              {/* Auto Message to Dispatch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ข้อความแจ้งเตือนอัตโนมัติ (Auto-Send Chat Message) <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">
                  ข้อความนี้จะถูกส่งเข้าแชท 1:1 กับ {displayedContactName} และแสดง Pop-up แจ้งเตือนบนหน้าจอเมื่อถึงเวลา
                </p>
                <textarea
                  value={autoMessage}
                  onChange={(e) => setAutoMessage(e.target.value)}
                  rows={3}
                  placeholder="เช่น ⏰ ถึงเวลานัดหมายตรวจสอบตัวเลข KPI แล้วครับ!"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#111827] transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ย้อนกลับไปที่ปฏิทิน
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#111827] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#0EA5E9]" />
                  <span>บันทึกการนัดหมาย (Save Event)</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between text-xs text-slate-500">
          <span>HusH 1:1 iPhone-Style Calendar Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
