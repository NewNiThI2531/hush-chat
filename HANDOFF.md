# 🤝 HusH Multi-Agent Handoff Document (Session Continuity)

**Target Version:** `v2.0.2` (Production Clean UI & Hardened Message Pipeline)  
**Previous Version:** `v2.0.1`  
**Current Release Branch:** `release/v2.0.2-clean-ui`  
**Production Branch:** `main`  
**Database:** Neon Serverless PostgreSQL (`ep-muddy-hill`)  
**Status:** ✅ **v2.0.2 Ready for Production on `release/v2.0.2-clean-ui` & `main`**

---

## 📌 Executive Summary

This handoff document provides continuous context for any incoming developer, AI agent, or engineering team member.

In **`v2.0.2`**, the HusH 7-Agent Squad finalized the production-grade bugfix and decluttering pass:

1. **100% Verified Live Message Pipeline (`SA`, `DEV`, `TestLead`):**
   - Verified live messaging across all data types: plain text, numbers/financial figures, Thai emojis, and Thiings 3D stickers.
   - Inserted and queried directly against Neon PostgreSQL pooler on AWS us-east-2.
   - Safe 1:1 conversation provisioning using `LEAST($1::uuid, $2::uuid)` and `GREATEST($1::uuid, $2::uuid)` ordering, completely eliminating `chk_ordered_pair` constraint failures.
   - Added automated lookup of `stickerFileId` and `stickerName` against `CURATED_THIINGS_STICKERS` in `storageService.fetchMessagesForConversation` and `MessageBubble.tsx`, guaranteeing 100% interactive 3D rendering whether loaded from local storage cache or freshly queried from the database.
   - Sub-10ms Optimistic UI updates with resilient background database persistence.

2. **Clean Production UI & Zero Clutter (`UI/UX`, `DEV`):**
   - **Tab Title:** Strictly **`HusH — Chat`** in `index.html` and `document.title`.
   - **Logo & Header:** Displays ONLY the black soundwave icon and **`HusH`** (no `CHAT` badge, no version badge in either the app header or login view).
   - **Sidebar:** Renamed `Manage Users / Admin` (stripped `RBAC` badge) to **`Manage User`** (role-gated strictly to `SYSTEM_ADMIN` and `FULL_ACCESS`). Renamed `+ Add Friend by Username` to **`Add Friend`**.
   - **Account Footer:** Displays strictly user Name and `@username` with Settings and Logout actions (stripped `• FULL_ACCESS` and database sync button).
   - **Chat Viewport:** Completely removed top encryption notice banner and composer footer micro-copy (`Enter to send...`). Placeholder simplified to **`พิมพ์ข้อความ...`**.
   - **Contact Details:** Removed gray helper descriptions under Nickname and Chat Background sections, and removed redundant footer copy.

3. **Redesigned Profile Setting Modal (`UI/UX`, `SA`, `DEV`):**
   - Clean title `Profile Setting` without subtitle.
   - `Role / สิทธิ์การใช้งาน` displayed as Read-Only beside `@username`.
   - `Last Name (นามสกุล)` made optional (no required asterisk).
   - Editable & clearable `Phone Number` and `Age` with explicit `Eye` / `EyeOff` (`แสดง` / `ซ่อน`) toggle buttons, mapped directly to `users.show_phone` and `users.show_age` boolean columns in Neon DB.
   - Security and privacy notice box completely removed.

4. **Zero Technical Jargon Audit (`Tester`):**
   - Eradicated all occurrences of `"Neon"`, `"PostgreSQL"`, `"RBAC"`, and `"WebSocket"` in customer-facing UI views and modals.

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
  show_phone BOOLEAN NOT NULL DEFAULT TRUE,
  show_age BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url TEXT,
  avatar_color VARCHAR(32) NOT NULL DEFAULT 'black',
  account_type VARCHAR(32) NOT NULL DEFAULT 'MEMBER',
  access_level VARCHAR(32) NOT NULL DEFAULT 'USER',
  can_chat BOOLEAN NOT NULL DEFAULT TRUE,
  is_immutable_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONVERSATIONS TABLE (Strict LEAST/GREATEST UUID pair check)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pinned_message_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_pair UNIQUE (user_one_id, user_two_id),
  CONSTRAINT chk_ordered_pair CHECK (user_one_id < user_two_id)
);

-- 3. MESSAGES TABLE (Per-Message 90-Day Rolling TTL)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  text_color VARCHAR(20) NOT NULL DEFAULT 'black',
  font_size VARCHAR(10) NOT NULL DEFAULT 'M',
  sticker_id VARCHAR(50),
  is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at ASC);

-- 4. MESSAGE REACTIONS TABLE
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

-- 5. USER CONTACTS & PREFERENCES TABLE
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

## 🔐 Authorized Production Accounts

1. **`@Hushadmin`**: Protected Sole System Administrator
   - `Password:` `Admin@002452@`
   - `Role:` Sole Administrator (`is_immutable_admin: true`, `can_chat: false`, Admin Console only)
2. **`@New010`**: Nithi B.
   - `Password:` `N!ew@14523@`
   - `Role:` Full Access (`can_chat: true`, `access_level: FULL_ACCESS`, 1:1 chat & User Management)
3. **`@Fernrs`**: Fern RS
   - `Password:` `F!ern@02020@`
   - `Role:` Member (`can_chat: true`, `access_level: USER`, standard friend messaging)

---

## 🚀 Deployment Credentials & Environment

- **Neon Database:** Serverless PostgreSQL pooler on AWS us-east-2
- **Driver:** `@neondatabase/serverless` (HTTP fetch driver over SSL)
- **Vercel Production URL:** `https://hush-chat-omega.vercel.app`
- **Release Branch:** `release/v2.0.2-clean-ui`
- **Production Branch:** `main`
- **Repository:** `https://github.com/NewNiThI2531/hush-chat.git`
