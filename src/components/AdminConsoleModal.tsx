import React, { useState, useMemo } from 'react';
import type { User, AccessLevel, ColorTheme } from '../types/chat';
import { storageService } from '../services/storageService';
import { Avatar } from './Avatar';
import {
  ShieldAlert,
  UserPlus,
  Edit2,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  MessageSquareOff,
  MessageSquare,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUsersUpdated?: () => void;
  isStandalonePage?: boolean;
  onLogout?: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUsersUpdated,
  isStandalonePage = false,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  // Sub-modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states for Create User
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('password123');
  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [createJobTitle, setCreateJobTitle] = useState('');
  const [createBio, setCreateBio] = useState('');
  const [createAccessLevel, setCreateAccessLevel] = useState<AccessLevel>('USER');
  const [createAvatarColor, setCreateAvatarColor] = useState<ColorTheme>('blue');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form states for Edit User
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAccessLevel, setEditAccessLevel] = useState<AccessLevel>('USER');
  const [editError, setEditError] = useState('');

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
    onUsersUpdated?.();
  };

  const allUsers = useMemo(() => {
    return storageService.getAllUsers();
  }, [refreshKey, isOpen]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        filterLevel === 'ALL' ||
        (filterLevel === 'ADMIN' && (u.accountType === 'SYSTEM_ADMIN' || u.accountType === 'OWNER_ADMIN')) ||
        u.accessLevel === filterLevel;

      return matchesSearch && matchesFilter;
    });
  }, [allUsers, searchQuery, filterLevel]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: allUsers.length,
      admins: allUsers.filter((u) => u.accountType === 'SYSTEM_ADMIN' || u.accountType === 'OWNER_ADMIN').length,
      fullAccess: allUsers.filter((u) => u.accessLevel === 'FULL_ACCESS').length,
      viewAll: allUsers.filter((u) => u.accessLevel === 'VIEW_ALL').length,
      standardUser: allUsers.filter((u) => u.accessLevel === 'USER').length,
    };
  }, [allUsers]);

  if (!isOpen && !isStandalonePage) return null;

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditPassword(user.password || '');
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditJobTitle(user.jobTitle || '');
    setEditBio(user.bio || '');
    setEditAccessLevel(user.accessLevel);
    setEditError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      const created = storageService.createUser({
        username: createUsername,
        password: createPassword,
        firstName: createFirstName,
        lastName: createLastName,
        jobTitle: createJobTitle,
        bio: createBio,
        accessLevel: createAccessLevel,
        avatarColor: createAvatarColor,
      });

      setFormSuccess(`สร้างผู้ใช้งาน @${created.username} เรียบร้อยแล้ว!`);
      triggerRefresh();
      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateUsername('');
        setCreateFirstName('');
        setCreateLastName('');
        setCreateJobTitle('');
        setCreateBio('');
        setFormSuccess('');
      }, 900);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างบัญชี');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');

    try {
      storageService.updateUserProfile(editingUser.id, {
        username: editUsername,
        password: editPassword || editingUser.password,
        firstName: editFirstName,
        lastName: editLastName,
        jobTitle: editJobTitle,
        bio: editBio,
        accessLevel: editAccessLevel,
      });

      triggerRefresh();
      setEditingUser(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการแก้ไขบัญชี');
    }
  };

  const getAccessBadge = (user: User) => {
    if (user.isImmutableAdmin || user.username.toLowerCase() === 'hushadmin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#111827] text-white shadow-xs border border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protected Sole Admin (Immutable)</span>
        </span>
      );
    }
    if (user.accountType === 'SYSTEM_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#111827] text-white shadow-xs">
          <ShieldAlert className="w-3 h-3 text-red-400" />
          <span>SYSTEM_ADMIN</span>
        </span>
      );
    }
    if (user.accountType === 'OWNER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-600 text-white shadow-xs">
          <span>OWNER_ADMIN</span>
        </span>
      );
    }
    if (user.accessLevel === 'FULL_ACCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-[#0284C7] border border-sky-200">
          <span>FULL_ACCESS</span>
        </span>
      );
    }
    if (user.accessLevel === 'VIEW_ALL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <span>VIEW_ALL</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <span>USER</span>
      </span>
    );
  };

  return (
    <div
      className={
        isStandalonePage
          ? 'min-h-screen w-full bg-[#F8FAFC] flex flex-col p-4 sm:p-6'
          : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-text'
      }
    >
      <div
        className={`w-full ${
          isStandalonePage
            ? 'max-w-6xl mx-auto flex-1'
            : 'max-w-5xl bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl'
        } flex flex-col max-h-[94dvh] overflow-hidden bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl animate-scaleUp`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#111827] text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5 text-[#0EA5E9]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#111827]">
                  Admin & User Directory Console
                </h2>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Neon PostgreSQL • v2.0.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                จัดการบัญชีผู้ใช้งาน, สิทธิ์การเข้าถึง (Tiered Access), และแก้ไข Username สำหรับระบบฐานข้อมูล Neon PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111827] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#0EA5E9]" />
              <span>สร้างผู้ใช้ใหม่ (+ Create User)</span>
            </button>

            {!isStandalonePage && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-6 py-3 border-b border-[#E5E7EB] bg-slate-50 text-xs">
          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400">ผู้ใช้งานทั้งหมด</span>
            <div className="text-sm font-black text-[#111827] tabular-nums">{stats.total} บัญชี</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400">Admins (System & Owner)</span>
            <div className="text-sm font-black text-[#111827] tabular-nums">{stats.admins} บัญชี</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-sky-600">Full Access (จัดการสิทธิ์)</span>
            <div className="text-sm font-black text-[#0284C7] tabular-nums">{stats.fullAccess} บัญชี</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-amber-600">View All (เห็นทุกคน)</span>
            <div className="text-sm font-black text-amber-700 tabular-nums">{stats.viewAll} บัญชี</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Standard Member (User)</span>
            <div className="text-sm font-black text-slate-700 tabular-nums">{stats.standardUser} บัญชี</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-3 border-b border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, @username หรือตำแหน่ง..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs font-semibold">
            <span className="text-slate-400 text-[11px] mr-1">สิทธิ์:</span>
            {['ALL', 'ADMIN', 'FULL_ACCESS', 'VIEW_ALL', 'USER'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-[#111827] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* User Directory Table / List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E5E7EB] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">ผู้ใช้งาน (User)</th>
                  <th className="py-3 px-4">Username (@handle)</th>
                  <th className="py-3 px-4">สิทธิ์การเข้าถึง (Access Level)</th>
                  <th className="py-3 px-4">แชท (Chat Status)</th>
                  <th className="py-3 px-4 text-right">การจัดการ (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrent ? 'bg-sky-50/30' : ''
                      }`}
                    >
                      {/* Name & Role */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            initials={user.initials}
                            avatarUrl={user.avatarUrl}
                            color={user.avatarColor}
                            size="sm"
                            status={user.status}
                            showStatus
                          />
                          <div>
                            <div className="font-bold text-[#111827] flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-sky-100 text-[#0284C7]">
                                  (คุณ)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{user.role || 'ไม่มีตำแหน่ง'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4 font-mono font-bold text-[#0EA5E9]">
                        @{user.username}
                      </td>

                      {/* Access Level Badge */}
                      <td className="py-3 px-4">
                        {getAccessBadge(user)}
                      </td>

                      {/* Can Chat */}
                      <td className="py-3 px-4">
                        {user.canChat ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <MessageSquare className="w-3 h-3 text-emerald-500" />
                            <span>Chat Enabled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <MessageSquareOff className="w-3 h-3 text-slate-400" />
                            <span>No Chat (Admin Only)</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.isImmutableAdmin || user.username.toLowerCase() === 'hushadmin' ? (
                            <button
                              type="button"
                              disabled
                              className="p-1.5 text-slate-400 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed opacity-60"
                              title="Protected Sole Admin (Immutable): บัญชีนี้ถูกล็อกความปลอดภัยสูงสุด ไม่สามารถแก้ไขหรือลบได้"
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 text-slate-500 hover:text-[#0EA5E9] hover:bg-sky-50 rounded-lg transition-all border border-slate-200 cursor-pointer"
                              title="แก้ไขชื่อผู้ใช้, สิทธิ์ และข้อมูลส่วนตัว"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info & Logout / Back to chat */}
        <div className="px-6 py-3.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>เข้าสู่ระบบในชื่อ: <strong>{currentUser.name}</strong> (@{currentUser.username})</span>
            <span>•</span>
            <span className="font-mono text-[#0EA5E9]">{currentUser.accountType}</span>
          </div>

          <div className="flex items-center gap-2">
            {isStandalonePage && onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs text-xs"
              >
                <span>🚪 ออกจากระบบ (Sign Out)</span>
              </button>
            )}

            {!isStandalonePage && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#111827] text-white font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>💬 กลับสู่หน้าแชท (Back to Chat)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUB-MODAL 1: Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-lg bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-6 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#111827] text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#0EA5E9]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    สร้างผู้ใช้งานใหม่ (Create New User)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    กำหนด @username, รหัสผ่าน, และสิทธิ์การเข้าถึงสำหรับ Neon PostgreSQL
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน (@username) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createUsername}
                    onChange={(e) => setCreateUsername(e.target.value)}
                    placeholder="เช่น john.doe"
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่าน (Password) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อจริง (First Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createFirstName}
                    onChange={(e) => setCreateFirstName(e.target.value)}
                    placeholder="เช่น John"
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    นามสกุล (Last Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createLastName}
                    onChange={(e) => setCreateLastName(e.target.value)}
                    placeholder="เช่น Doe"
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ตำแหน่งงาน (Job Title)
                  </label>
                  <input
                    type="text"
                    value={createJobTitle}
                    onChange={(e) => setCreateJobTitle(e.target.value)}
                    placeholder="เช่น Product Manager"
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ระดับสิทธิ์ (Access Level) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createAccessLevel}
                    onChange={(e) => setCreateAccessLevel(e.target.value as AccessLevel)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  >
                    <option value="USER">USER (เห็นเฉพาะเพื่อนที่เพิ่มไว้)</option>
                    <option value="VIEW_ALL">VIEW_ALL (เห็นสมาชิกทุกคนในระบบ)</option>
                    <option value="FULL_ACCESS">FULL_ACCESS (สร้างและจัดการสิทธิ์ผู้ใช้ได้)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  โทนสี Avatar
                </label>
                <div className="flex items-center gap-2">
                  {(['blue', 'orange', 'pink', 'black'] as ColorTheme[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCreateAvatarColor(c)}
                      className={`w-7 h-7 rounded-xl border-2 transition-all cursor-pointer ${
                        createAvatarColor === c ? 'border-[#111827] scale-110 shadow-xs' : 'border-transparent'
                      } ${
                        c === 'blue'
                          ? 'bg-[#0EA5E9]'
                          : c === 'orange'
                          ? 'bg-[#F97316]'
                          : c === 'pink'
                          ? 'bg-[#EC4899]'
                          : 'bg-[#111827]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รายละเอียดเพิ่มเติม (Bio / Details)
                </label>
                <textarea
                  value={createBio}
                  onChange={(e) => setCreateBio(e.target.value)}
                  rows={2}
                  placeholder="ข้อมูลสรุปเกี่ยวกับผู้ใช้งานนี้..."
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111827] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-[#0EA5E9]" />
                  <span>บันทึกและสร้างบัญชี</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: Edit User / Edit Username Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-lg bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-6 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#111827] text-white flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-[#0EA5E9]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    แก้ไขบัญชี: {editingUser.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    แก้ไข @username, รหัสผ่าน, และสิทธิ์การเข้าถึงของผู้ใช้งานนี้
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน (@username) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] font-mono focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รีเซ็ตรหัสผ่าน (Reset Password)
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="ใส่รหัสใหม่หากต้องการเปลี่ยน"
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อจริง (First Name)
                  </label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    นามสกุล (Last Name)
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ตำแหน่งงาน (Job Title)
                  </label>
                  <input
                    type="text"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ระดับสิทธิ์ (Access Level)
                  </label>
                  <select
                    value={editAccessLevel}
                    onChange={(e) => setEditAccessLevel(e.target.value as AccessLevel)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
                  >
                    <option value="USER">USER (เห็นเฉพาะเพื่อนที่เพิ่มไว้)</option>
                    <option value="VIEW_ALL">VIEW_ALL (เห็นสมาชิกทุกคนในระบบ)</option>
                    <option value="FULL_ACCESS">FULL_ACCESS (สร้างและจัดการสิทธิ์ผู้ใช้ได้)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รายละเอียดเพิ่มเติม (Bio)
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#111827] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111827] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
