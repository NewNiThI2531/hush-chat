import React, { useState } from 'react';
import {
  X,
  Tag,
  Users,
  Database,
  CheckCircle2,
  Layers,
  ExternalLink,
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
    deliverables: 'Approved v2.0.0 Production: Mock personas purged, 3 real accounts seeded (Hushadmin, New010, Fernrs), immutable admin enforcement, and live Neon PostgreSQL.',
  },
  {
    role: 'SA',
    title: 'System Analyst Agent',
    name: 'Domain & Database Architect',
    status: 'Signed Off',
    deliverables: 'Executed normalized PostgreSQL relational schema directly on Neon DB (users, conversations, messages, message_reactions, user_contacts, schedules). Enforced 90-day retention purge.',
  },
  {
    role: 'UI/UX',
    title: 'UI/UX Designer Agent',
    name: 'Aesthetics & Layout Craftsman',
    status: 'Signed Off',
    deliverables: 'Designed ultra-clean Login Page (no mock switchers), marked Hushadmin as Protected Sole Admin (Immutable) with edit disabled, and responsive Apple Calendar UI.',
  },
  {
    role: 'DEV',
    title: 'Developer Agent',
    name: 'Full-Stack Engineer',
    status: 'Signed Off',
    deliverables: 'Configured @neondatabase/serverless HTTP fetch driver with automatic fallback. Connected live Neon DB for Auth, Admin, Friends, Chat, and Schedules.',
  },
  {
    role: 'TestLead',
    title: 'QA Test Lead Agent',
    name: 'Quality & Test Matrix Director',
    status: 'Signed Off',
    deliverables: 'Verified authentication and permissions for Hushadmin, New010, and Fernrs. Tested real-time synchronization, 1:1 messaging, and schedule dispatching.',
  },
  {
    role: 'Tester',
    title: 'QA Tester Agent',
    name: 'Functional & Viewport Tester',
    status: 'Signed Off',
    deliverables: 'Verified multi-viewport layouts (Desktop PC, Laptop, iPad, iPhone Web) with zero layout shifting or overflow.',
  },
  {
    role: 'DevOps',
    title: 'DevOps & Release Agent',
    name: 'Release & Deployment Manager',
    status: 'Signed Off',
    deliverables: 'Tagged v2.0.0, pushed to feat/v2.0.0-neon-production and main for continuous automated deployment to https://hush-chat-omega.vercel.app.',
  },
];

const NEON_SQL_SCHEMA = `-- ====================================================================
-- HusH Relational Database Schema — Neon Serverless PostgreSQL (DDL)
-- Version: v2.0.0 (Production Release)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. USERS TABLE (Separated Account Profiles & RBAC)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL DEFAULT '',
  job_title VARCHAR(150),
  bio TEXT,
  phone VARCHAR(50),
  age INTEGER,
  avatar_url TEXT,
  avatar_color VARCHAR(32) DEFAULT 'blue',
  account_type VARCHAR(32) NOT NULL DEFAULT 'MEMBER',
  access_level VARCHAR(32) NOT NULL DEFAULT 'USER',
  can_chat BOOLEAN NOT NULL DEFAULT TRUE,
  is_immutable_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_online BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONVERSATIONS TABLE (1:1 Mapping: Who Chats With Whom)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pinned_message_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_conversation_pair UNIQUE (user_one_id, user_two_id),
  CONSTRAINT chk_ordered_pair CHECK (user_one_id < user_two_id)
);

-- 3. MESSAGES TABLE (Chat Stream with 90-Day Auto Retention)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  text_color VARCHAR(16) NOT NULL DEFAULT '#111827',
  font_size VARCHAR(8) NOT NULL DEFAULT 'M',
  sticker_id VARCHAR(128),
  is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at ASC);

-- 4. MESSAGE REACTIONS TABLE
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

-- 5. USER CONTACTS / FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS user_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  custom_nickname VARCHAR(100),
  chat_bg_color VARCHAR(16) NOT NULL DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_user_id, contact_user_id)
);

-- 6. SCHEDULES TABLE (1:1 Calendar & Auto Dispatched Reminders)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  auto_message TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  is_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

export const VersionHandoffModal: React.FC<VersionHandoffModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'schema' | 'deploy'>('agents');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-text"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92dvh] bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#111827] text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5 text-[#0EA5E9]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#111827]">
                  HusH Version 2.0 Production Release
                </h2>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  v2.0.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                100% Real Database Backed • Neon Serverless PostgreSQL + Vercel Deployment
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

        {/* Tab navigation */}
        <div className="flex border-b border-[#E5E7EB] px-6 bg-white gap-2">
          <button
            onClick={() => setActiveTab('agents')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'agents'
                ? 'border-[#111827] text-[#111827]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-sky-600" />
            <span>7-Agent Squad Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'schema'
                ? 'border-[#111827] text-[#111827]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Neon PostgreSQL DDL</span>
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'deploy'
                ? 'border-[#111827] text-[#111827]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4 text-purple-600" />
            <span>Live Deployment & Accounts</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'agents' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    7/7 Agents Signed Off for Version v2.0.0 Production Release
                  </span>
                </div>
                <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                  All Green
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AGENTS.map((agent) => (
                  <div
                    key={agent.role}
                    className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] hover:bg-white hover:border-slate-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-[#111827] text-white">
                          {agent.role}
                        </span>
                        <span className="text-xs font-bold text-[#111827]">
                          {agent.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{agent.status}</span>
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 mb-1">
                      {agent.name}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {agent.deliverables}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827]">
                  Production Relational DDL (Neon Serverless PostgreSQL)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  6 Normalized Tables • Foreign Keys & Constraints
                </span>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
                <code>{NEON_SQL_SCHEMA}</code>
              </pre>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-600" />
                  <span>ข้อมูล Live Production & Deployment</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Vercel Live URL
                    </span>
                    <a
                      href="https://hush-chat-omega.vercel.app"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#0EA5E9] hover:underline flex items-center gap-1"
                    >
                      <span>https://hush-chat-omega.vercel.app</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      GitHub Repository
                    </span>
                    <a
                      href="https://github.com/NewNiThI2531/hush-chat"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-slate-800 hover:underline flex items-center gap-1"
                    >
                      <span>NewNiThI2531/hush-chat</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  3 บัญชีจริงที่ Seed ไว้ในฐานข้อมูล Neon PostgreSQL:
                </span>
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 font-mono">@Hushadmin</div>
                      <div className="text-[11px] text-slate-500">
                        Sole System Administrator • Protected Immutable • Admin Console Only
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      ADMIN_ONLY
                    </span>
                  </div>
                  <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sky-900 font-mono">@New010</div>
                      <div className="text-[11px] text-sky-700">
                        Nithi B. (Software Engineer & Co-Owner) • Full Access + 1:1 Chat
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-200 text-sky-900">
                      FULL_ACCESS
                    </span>
                  </div>
                  <div className="p-2.5 bg-pink-50 rounded-xl border border-pink-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-pink-900 font-mono">@Fernrs</div>
                      <div className="text-[11px] text-pink-700">
                        Fern RS (Product Specialist) • Member Standard User • Friend-by-Username
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-200 text-pink-900">
                      USER
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between text-xs text-slate-500">
          <div>
            HusH Messaging System • Version <strong>v2.0.0</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111827] text-white font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
