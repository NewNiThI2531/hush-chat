# 🤝 HusH Multi-Agent Handoff Document (Session Continuity)

**Target Version:** `v2.0.0-rc.1` (Release Candidate 1 — Clean Neon DB Build)  
**Previous Version (`main`):** `v1.0.1` (Interactive mockup phase)  
**Current Pushed Branch:** `release/v2.0.0-production` (`v2.0.0-rc.1` — Clean Neon DB build, zero mock data)  
**Next Step:** After verifying the Vercel Preview Deployment URL on `release/v2.0.0-production`, merge into `main` as `v2.0.0`.  
**Database:** Neon Serverless PostgreSQL (`ep-muddy-hill`)  
**Status:** ✅ **v2.0.0-rc.1 Ready for Vercel Preview Testing on `release/v2.0.0-production`**

---

## 📌 Executive Summary

This handoff document provides continuous context for any incoming developer, AI agent, or engineering team member.

In **`v2.0.0-rc.1`**, HusH packages a clean Neon DB build strictly to **`release/v2.0.0-production`** for Vercel Preview testing, with all Mockup and Demo data eradicated:

1. **Total Mock Data & Fallback Purge:**
   - Deleted `src/data/mockData.ts` and all hardcoded mock arrays (`INITIAL_USERS`, `MOCK_USERS`, `DEMO_MESSAGES`, `SEED_DATA`).
   - Browser initialization executes `purgeLegacyMockStorage()`, wiping any legacy `hush_*` mock keys from `localStorage`.
   - Removed all mock fallback branches: conversations with 0 messages render a clean empty state.
   - Removed hardcoded fallback passwords in favor of strict SHA-256 database authentication.
2. **Production-Clean UI & App Shell:**
   - Login page strictly displays Brand Logo, Title, Username input, Password input, and Sign In button (no autofills, no test credential hints, no demo badges).
   - Removed Persona Switcher (`สลับบัญชี`) from Admin Console.
   - Removed `Test 10s` (`⚡ ในอีก 10 วินาที`) preset from Schedule Modal.
   - Cleaned all mock placeholders in modals.
3. **Provisioned & Verified Relational Database State on Neon DB:**
   - Only 3 authorized accounts in `users`:
     - `@Hushadmin`: Protected Sole System Administrator (`Password: Admin@002452@`, `account_type = 'SYSTEM_ADMIN'`, `access_level = 'ADMIN_ONLY'`, `can_chat = FALSE`, `is_immutable_admin = TRUE`).
     - `@New010`: Nithi B. (`Password: N!ew@14523@`, `account_type = 'MEMBER'`, `access_level = 'FULL_ACCESS'`, `can_chat = TRUE`, `is_immutable_admin = FALSE`).
     - `@Fernrs`: Fern RS (`Password: F!ern@02020@`, `account_type = 'MEMBER'`, `access_level = 'USER'`, `can_chat = TRUE`, `is_immutable_admin = FALSE`).
   - Cleared all fake/demo messages, message reactions, and schedules (reset to 0 rows for clean production start).
4. **Sole Admin Immutability Protection:**
   - `@Hushadmin` is locked against modification or deletion in both the Admin Console UI and storage queries.
5. **Real-Time Synchronization:**
   - Multi-device polling loop keeping messages, contacts, and schedules synchronized in real-time.

---

## ⚡ Active Neon PostgreSQL Relational Schema (DDL)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. USERS TABLE
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

-- 2. CONVERSATIONS TABLE
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

-- 3. MESSAGES TABLE (90-Day Auto Retention)
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

-- 6. SCHEDULES TABLE
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
);
```

---

## 🚀 Deployment Credentials & Environment

- **Neon Database:** Serverless PostgreSQL pooler on AWS us-east-2
- **Driver:** `@neondatabase/serverless` (HTTP fetch driver over SSL)
- **Vercel Production URL:** `https://hush-chat-omega.vercel.app`
- **Dedicated Release Branch:** `release/v2.0.0-production` (Release Tag: `v2.0.0-rc.1`)
- **Next Step:** After verifying the Vercel Preview Deployment URL on `release/v2.0.0-production`, merge into `main` as `v2.0.0`.
