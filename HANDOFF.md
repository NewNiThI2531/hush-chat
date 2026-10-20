# 🤝 HusH Multi-Agent Handoff Document (Session Continuity)

**Target Version:** `v2.0.0` (Production Release)  
**Git Branches:** `feat/v2.0.0-neon-production` and `main`  
**Production Live URL:** `https://hush-chat-omega.vercel.app`  
**Database:** Neon Serverless PostgreSQL (`ep-muddy-hill`)  
**Status:** ✅ **v2.0.0 Production Deployed & Verified**

---

## 📌 Executive Summary

This handoff document provides continuous context for any incoming developer, AI agent, or engineering team member.

In **`v2.0.0`**, HusH transitioned from a client-side mockup to a **100% real Database-Backed Production Application** connected live to **Neon Serverless PostgreSQL** and deployed on **Vercel**:

1. **Mock Data Purge:**
   - 100% of mock personas, mock conversations, and demo login switchers permanently removed.
2. **Provisioned Relational Database Tables on Neon DB:**
   - `users`: Separated user accounts, RBAC access levels, immutable admin protection.
   - `conversations`: 1:1 participant pair with ordered UUID constraints (`chk_ordered_pair`).
   - `messages`: Message stream with 90-day automated retention purge.
   - `message_reactions`: Multi-user emoji reactions.
   - `user_contacts`: 1:1 friend relationships, custom nicknames, per-chat background themes.
   - `schedules`: 1:1 Apple Calendar events with automated pop-up & message dispatch.
3. **Initial Seeded Production Accounts:**
   - `@Hushadmin`: Protected Sole System Administrator (`SYSTEM_ADMIN`, `ADMIN_ONLY`, `can_chat: false`, routes directly to Admin Console).
   - `@New010`: Nithi B. (Software Engineer & Co-Owner, `FULL_ACCESS`, 1:1 chat and admin access).
   - `@Fernrs`: Fern RS (Product Specialist, `USER`, standard member, friend-by-username).
   - Default Password: `password123`
4. **Sole Admin Immutability Protection:**
   - `@Hushadmin` is locked against modification or deletion in both the Admin Console UI and storage queries.
5. **Ultra-Clean Login Experience:**
   - Minimalist Username + Password form with show/hide password toggle.
6. **Real-Time Synchronization:**
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
- **GitHub Repository:** `https://github.com/NewNiThI2531/hush-chat.git`
- **Production Branches:** `feat/v2.0.0-neon-production` and `main`
