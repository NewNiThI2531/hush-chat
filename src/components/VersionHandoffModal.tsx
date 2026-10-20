import React, { useState } from 'react';
import {
  X,
  Tag,
  Users,
  Database,
  FileText,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface VersionHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AGENTS = [
  {
    role: 'PM',
    title: 'Project Manager Agent',
    name: 'Scope & Boundary Enforcer',
    status: 'Signed Off',
    deliverables: 'Approved v1.0.1 patch: enforced click-to-edit nickname, structured profile (First/Last name), clean UI without stats card, and proportional layout on branch feat/v1.0.1-ui-refinements.',
  },
  {
    role: 'SA',
    title: 'System Analyst Agent',
    name: 'Domain & Database Architect',
    status: 'Signed Off',
    deliverables: 'Updated TypeScript Domain Models and Neon PostgreSQL DDL with firstName, lastName, optional jobTitle, and details fields.',
  },
  {
    role: 'UI/UX',
    title: 'UI/UX Designer Agent',
    name: 'Aesthetics & Layout Craftsman',
    status: 'Signed Off',
    deliverables: 'Refined 3-pane proportional architecture (w-72 left sidebar, w-80 right sidebar, slide-over drawer < 1280px), removed security card, ensured popover bounds.',
  },
  {
    role: 'DEV',
    title: 'Frontend / Full-Stack Agent',
    name: 'React + TypeScript Engineer',
    status: 'Signed Off',
    deliverables: 'Implemented click-to-edit nickname state, structured profile inputs in SelfProfileModal (⚙️), dynamic jobTitle rendering in Right Sidebar, and h-dvh/min-w-0 layout.',
  },
  {
    role: 'TestLead',
    title: 'QA Test Lead Agent',
    name: 'Quality & Test Matrix Director',
    status: 'Signed Off',
    deliverables: 'Defined test matrix for click-to-edit nickname interaction, optional jobTitle display, and viewport overflow prevention.',
  },
  {
    role: 'Tester',
    title: 'QA Tester Agent',
    name: 'Functional & Viewport Tester',
    status: 'Signed Off',
    deliverables: 'Verified zero UI overlap, zero broken interactions across Desktop PC (1920px+), Laptop (1280px-1440px), iPad (768px-1024px), and iPhone (375px-430px).',
  },
  {
    role: 'DevOps',
    title: 'DevOps & Release Agent',
    name: 'Versioning & Release Manager',
    status: 'Signed Off',
    deliverables: 'Managed branch feat/v1.0.1-ui-refinements, bumped to v1.0.1, updated VERSION, CHANGELOG.md, AGENTS.md, and HANDOFF.md.',
  },
];

const NEON_SQL_SCHEMA = `-- ====================================================================
-- HusH Database Schema — Neon Serverless PostgreSQL (DDL for Phase 2)
-- Version: v1.0.1 (Branch: feat/v1.0.1-ui-refinements)
-- ====================================================================

-- 1. Users table (Admin pre-provisioned via pgcrypto)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    job_title VARCHAR(100),
    avatar_color VARCHAR(20) DEFAULT 'blue',
    avatar_url TEXT,
    phone VARCHAR(20),
    age INT,
    bio TEXT,
    role VARCHAR(100) DEFAULT 'Team Member',
    status VARCHAR(20) DEFAULT 'offline',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Contact preferences (Per-user nickname override and chat background)
CREATE TABLE IF NOT EXISTS contact_preferences (
    owner_user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    target_user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    custom_nickname VARCHAR(100),
    chat_bg_color VARCHAR(20) DEFAULT '#FFFFFF',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (owner_user_id, target_user_id)
);

-- 3. Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(100) PRIMARY KEY, -- format: userA_userB (alphabetically sorted)
    pinned_message_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Messages table (Strictly text, numbers, emojis, and Thiings stickers)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(100) PRIMARY KEY,
    conversation_id VARCHAR(100) REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    receiver_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'sticker')),
    content TEXT,
    text_color VARCHAR(20) DEFAULT 'black',
    font_size VARCHAR(10) DEFAULT 'M',
    sticker_id VARCHAR(50),
    sticker_file_id VARCHAR(100), -- Thiings.co Vercel Blob token
    sticker_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Message Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
    message_id VARCHAR(100) REFERENCES messages(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id, emoji)
);

-- 6. 90-Day Auto Retention Partition / Scheduled Purge Job
-- Neon pg_cron / scheduled trigger:
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days';
`;

export const VersionHandoffModal: React.FC<VersionHandoffModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'lifecycle' | 'sql' | 'handoff'>('agents');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-text">
      <div
        className="w-full max-w-3xl bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#111827] text-white flex items-center justify-center shadow-xs">
              <Tag className="w-5 h-5 text-[#0EA5E9]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#111827]">
                  HusH Release & 7-Agent Squad System
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#0EA5E9] text-white shadow-xs">
                  v1.0.1
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  feat/v1.0.1-ui-refinements
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Phase 1 Interactive UI/UX Prototype • Architecture & Multi-Agent Handoff
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#E5E7EB] bg-slate-50 text-xs font-semibold select-none overflow-x-auto">
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'agents'
                ? 'border-[#0EA5E9] text-[#0EA5E9] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>7-Agent Squad (ทีมผู้ร่วมพัฒนา)</span>
          </button>

          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'lifecycle'
                ? 'border-[#0EA5E9] text-[#0EA5E9] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Version Lifecycle (แผนการปล่อยเวอร์ชัน)</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-[#0EA5E9] text-[#0EA5E9] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Neon PostgreSQL DDL (โครงสร้างฐานข้อมูล)</span>
          </button>

          <button
            onClick={() => setActiveTab('handoff')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'handoff'
                ? 'border-[#0EA5E9] text-[#0EA5E9] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Handoff & Next Steps</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: 7-Agent Squad */}
          {activeTab === 'agents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">
                      7/7 Agents Signed Off for Version v1.0.1
                    </h4>
                    <p className="text-xs text-emerald-700">
                      สมาชิกทั้ง 7 สายงานได้ทำการตรวจสอบและอนุมัติฟังก์ชันทั้งหมดของ v1.0.1 เรียบร้อยแล้ว
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AGENTS.map((agent) => (
                  <div
                    key={agent.role}
                    className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-slate-300 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[11px] font-black rounded-lg bg-[#111827] text-white">
                          {agent.role}
                        </span>
                        <h5 className="text-xs font-bold text-[#111827]">
                          {agent.title}
                        </h5>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{agent.status}</span>
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-slate-500">
                      {agent.name}
                    </p>

                    <p className="text-xs text-slate-700 leading-relaxed pt-1">
                      {agent.deliverables}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Version Lifecycle */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl">
                <h4 className="text-sm font-bold text-sky-900 mb-1">
                  Semantic Version Tracking Protocol
                </h4>
                <p className="text-xs text-sky-700 leading-relaxed">
                  ระบบติดตามสถานะการปล่อยเวอร์ชันเชื่อมโยงระหว่าง Local Development, Git Commit, Vercel (Frontend), Render (Go Backend) และ Neon (PostgreSQL)
                </p>
              </div>

              <div className="space-y-3">
                {/* Previous */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    0
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Previous Git / Deploy Version:</span>
                      <code className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-300">v1.0.0 (Commit 7dcef4e on main)</code>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Initial interactive UI prototype release with 3-pane layout, 4-color accent, and Thiings.co 3D stickers on main.
                    </p>
                  </div>
                </div>

                {/* Current */}
                <div className="p-4 rounded-2xl bg-white border-2 border-[#0EA5E9] shadow-subtle flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#0EA5E9] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#111827]">Current Target Version / Patch:</span>
                      <code className="text-xs font-mono font-bold bg-sky-100 text-[#0284C7] px-2 py-0.5 rounded border border-sky-300">
                        v1.0.1
                      </code>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                        feat/v1.0.1-ui-refinements
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      Proportional responsive layout, click-to-edit nickname interaction (Read-Only static default with Edit ✏️ → Save ✓ / Cancel ✕), structured profile fields (First/Last name split, optional jobTitle/details), and complete removal of security card.
                    </p>
                  </div>
                </div>

                {/* Next */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Next Planned Production Version:</span>
                      <code className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
                        v1.1.0
                      </code>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Go Fiber + Gorilla WebSocket Backend deployed on Render, Neon Serverless PostgreSQL with connection pooling, and Vercel production hosting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Neon SQL DDL Schema */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#0EA5E9]" />
                  <span>Neon PostgreSQL DDL Schema (Phase 2 Ready)</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  PostgreSQL 16 Compatible
                </span>
              </div>

              <pre className="p-4 bg-[#111827] text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
                <code>{NEON_SQL_SCHEMA}</code>
              </pre>
            </div>
          )}

          {/* TAB 4: Handoff Protocol & Next Steps */}
          {activeTab === 'handoff' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <h4 className="text-sm font-bold text-emerald-900 mb-1">
                  Handoff Protocol & Next Agent Checklist
                </h4>
                <p className="text-xs text-emerald-700">
                  เอกสารส่งต่องานระหว่าง Agent และ Developer สำหรับการต่อยอด Phase 2 ได้ทันทีโดยไม่ตกหล่น
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#111827]">Phase 1 Client State Completed:</span>
                    <p className="text-slate-500 mt-0.5">
                      โมเดลและสถานะใน <code>localStorage</code> ถูกจัดเตรียมให้ตรงกับตารางฐานข้อมูล Neon 1:1
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5">
                  <ArrowRight className="w-4 h-4 text-[#0EA5E9] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#111827]">Phase 2 Backend Integration Steps:</span>
                    <ul className="list-disc list-inside text-slate-500 mt-1 space-y-1 pl-1">
                      <li>สร้างฐานข้อมูลบน Neon Console และรันสคริปต์ DDL จากแท็บ Neon PostgreSQL DDL</li>
                      <li>พัฒนา Go Fiber + Gorilla WebSocket Gateway รองรับ JWT และ Client Heartbeat (ping/pong)</li>
                      <li>เปลี่ยน <code>storageService.ts</code> ให้ใช้ WebSocket Client เชื่อมต่อ <code>wss://backend.render.com/ws</code></li>
                      <li>ตั้งเวลา Cron Job สำหรับการล้างข้อมูลข้อความที่เกิน 90 วันอัตโนมัติ</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between text-xs text-slate-500">
          <span>HusH Chat Multi-Agent Handoff Framework</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111827] text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
