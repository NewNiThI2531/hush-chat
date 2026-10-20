# 🤝 HusH Multi-Agent Handoff Document (Session Continuity)

**Target Version:** `v1.1.0-mockup`  
**Git Branch:** `feat/v1.1.0-rbac-and-schedule`  
**Base / Previous Version on `main`:** `v1.0.1` (Commit `504a0b9`)  
**Next Planned Milestone:** Phase 2 (Go Fiber WebSocket Backend on Render + Neon PostgreSQL on Port 5432 + Vercel)  
**Status:** ✅ **v1.1.0-mockup Quality Gate Passed & Ready for Push to feat/v1.1.0-rbac-and-schedule**

---

## 📌 Executive Summary

This handoff document provides continuous context for any incoming developer, AI agent, or engineering team member.

In **`v1.1.0-mockup`**, the squad finalized the complete relational data architecture, tiered RBAC, user management console, and 1:1 Apple iPhone Calendar scheduling engine:

1. **iPhone Calendar Experience (1:1 Schedule):**
   - Interactive monthly calendar with Thai/Buddhist year support, navigation chevrons, Today red circle (`#EF4444`), and event indicator dots.
   - Selected Day Agenda View with left colored stripe, time slot, and auto-message preview.
   - Segmented view switcher (`Month View` / `Agenda View` / `New Event`).
   - Quick presets for instant testing (⚡ *In 10s*, ⏱️ *In 1m*, 🌅 *Tomorrow 9am*).
2. **Automated Pop-Up & Chat Message Dispatcher:**
   - Real-time 1-second interval checking due schedules where `scheduledAt <= now` and `!isTriggered`.
   - Dispatches message directly into 1:1 chat with `isScheduledDispatch: true` and `📅 Scheduled Reminder` badge.
   - Triggers on-screen **Schedule Due Pop-Up Alert Modal** with sound haptics and Jump to Chat action.
3. **Admin User Management Console & Tiered RBAC:**
   - `SYSTEM_ADMIN` (`admin`): Dedicated User & Directory Admin. Strictly forbidden from chatting (`canChat: false`). Routes directly to Admin Console upon login.
   - `OWNER_ADMIN` (`alex`): Primary personal account with full administrative authority + full 1:1 chat and schedule capabilities.
   - `FULL_ACCESS` Member (`sarah`): Can view all users, open Admin Console, create users, and edit permissions.
   - `VIEW_ALL` Member (`marcus`, `sophie`): Can view all directory users and start 1:1 chat, but cannot manage users.
   - `USER` Standard Member (`elena`, `david`): Restricted directory visibility. Only sees confirmed friends.
4. **Username Friend System:**
   - `+ Add Friend by Username` modal for standard members to look up and add contacts by exact `@username`.
5. **Chat Header Cleanup:**
   - Completely removed deprecated `Auto-clears after 3 months` pill and `Simulate` button.
   - Replaced with clean `📅 Schedule` button displaying upcoming event count badge.

---

## ⚡ Complete Neon PostgreSQL Relational Schema (DDL for Phase 2)

```sql
-- ====================================================================
-- HusH Relational Database Schema — Neon Serverless PostgreSQL (DDL)
-- Version: v1.1.0-mockup (Branch: feat/v1.1.0-rbac-and-schedule)
-- ====================================================================

-- Enable UUID extension and pgcrypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users table (Normalized with Tiered RBAC & can_chat flag)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    job_title VARCHAR(100),
    role VARCHAR(100),
    bio TEXT,
    phone VARCHAR(20),
    age INT,
    avatar_color VARCHAR(20) DEFAULT 'blue',
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'offline',
    account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('SYSTEM_ADMIN', 'OWNER_ADMIN', 'MEMBER')),
    access_level VARCHAR(30) NOT NULL CHECK (access_level IN ('FULL_ACCESS', 'VIEW_ALL', 'USER')),
    can_chat BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: SYSTEM_ADMIN can never have can_chat = true
ALTER TABLE users ADD CONSTRAINT check_system_admin_no_chat 
    CHECK (NOT (account_type = 'SYSTEM_ADMIN' AND can_chat = TRUE));

-- 2. Conversations table (Strictly 1:1 who-chats-with-whom mapping)
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(100) PRIMARY KEY, -- deterministic pair key e.g. userA_userB or UUID
    participant_one_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    participant_two_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    pinned_message_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_distinct_participants CHECK (participant_one_id <> participant_two_id)
);

-- 3. Messages table (Strictly text, numbers, emojis, and Thiings stickers)
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
    is_scheduled_dispatch BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Contacts / Friendships (Per-user friend list & nickname overrides)
CREATE TABLE IF NOT EXISTS user_contacts (
    id VARCHAR(100) PRIMARY KEY,
    owner_user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    custom_nickname VARCHAR(100),
    chat_bg_color VARCHAR(20) DEFAULT '#FFFFFF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (owner_user_id, contact_user_id)
);

-- 5. 1:1 Schedules & Automated Message Reminders
CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(100) PRIMARY KEY,
    conversation_id VARCHAR(100) REFERENCES conversations(id) ON DELETE CASCADE,
    created_by_user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    target_user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    auto_message TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    is_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Message Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
    message_id VARCHAR(100) REFERENCES messages(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id, emoji)
);

-- 7. 90-Day Auto Retention Purge
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 🚀 Exact Next Steps for Phase 2 Development Session

1. **Git Commit & Push (Branch: `feat/v1.1.0-rbac-and-schedule`):**
   ```bash
   git checkout -b feat/v1.1.0-rbac-and-schedule
   git add .
   git commit -m "feat(release): v1.1.0-mockup - relational RBAC, admin console & iPhone 1:1 calendar"
   git push -u origin feat/v1.1.0-rbac-and-schedule
   ```
2. **Phase 2 Backend Integration (Go Fiber + Neon PostgreSQL):**
   - Provision a Neon PostgreSQL project and execute the schema DDL above.
   - Seed pre-provisioned user accounts with bcrypt hashes.
   - Implement Go Fiber WebSocket Hub supporting real-time chat broadcasts, contact nickname updates, and schedule notifications.
   - Connect client WebSocket client to `wss://backend.render.com/ws`.
