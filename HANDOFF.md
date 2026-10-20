# 🤝 HusH Multi-Agent Handoff Document (Session Continuity)

**Target Version:** `v1.0.1`  
**Git Branch:** `feat/v1.0.1-ui-refinements`  
**Base / Previous Version on `main`:** `v1.0.0` (Commit `7dcef4e` — *"feat: release HusH v1.0 - interactive UI/UX mockup & responsive prototype"*)  
**Next Planned Milestone:** `v1.1.0` (Go Fiber + Gorilla WebSocket + Neon PostgreSQL on Render/Vercel)  
**Status:** ✅ **v1.0.1 Quality Gate Passed & Ready for Push to feat/v1.0.1-ui-refinements**

---

## 📌 Executive Summary

This handoff document provides continuous context for any incoming developer, AI agent, or engineering team member.

In **`v1.0.1`**, the squad applied 5 critical architectural and UX fixes:
1. **Strict Proportional Layout:** Enforced `h-dvh w-full overflow-hidden` and `min-w-0 flex-1` so panes never overlap, text wraps cleanly, and sidebars maintain fixed proportions (`w-72` / `288px` Left Sidebar, `w-80` / `320px` Right Sidebar on `xl+`, and smooth slide-over drawer on `< 1280px`).
2. **Removed Security & Privacy Policy Card:** Cleaned up the Right Sidebar to focus strictly on Contact Details, Nickname, and Chat Background Color.
3. **Explicit Click-to-Edit Interaction for Nicknames:** Implemented two-state interaction (Static Read-Only default with `✏️ แก้ไข` -> Active Input with `บันทึก` ✓ / `ยกเลิก` ✕).
4. **Structured Profile Fields:** Separated `firstName` (Required), `lastName` (Required), optional `jobTitle`, optional `details`/`bio`, `phone`, and `age`. Persona Switcher removed from sidebar footer in favor of current user profile bar with `⚙️` Settings.
5. **Git Branch & Release Tracking:** Working branch established as `feat/v1.0.1-ui-refinements` with updated `VERSION` (`v1.0.1`), `CHANGELOG.md`, `AGENTS.md`, and in-app modal.

---

## 🗄️ LocalStorage Data Schema (`v1.0.1`)

The client operates on persistent `localStorage` keys designed to map directly to upcoming Neon Serverless PostgreSQL tables:

| LocalStorage Key | Data Type | Neon DB Equivalent Table | Description |
|---|---|---|---|
| `hush_current_user_id` | `string` | Session / JWT Token | Active user ID (`alex`) |
| `hush_users_v1` | `User[]` | `users` | Pre-provisioned user accounts with `firstName`, `lastName`, `jobTitle`, `bio`, etc. |
| `hush_contact_prefs_v1` | `Record<string, ContactPreference>` | `contact_preferences` | Per-user nickname override and chat background hex per conversation |
| `hush_messages_v1` | `Message[]` | `messages` | Messages stream (text, formatting, Thiings 3D sticker tokens) |
| `hush_pinned_v1` | `Record<string, string>` | `conversations.pinned_message_id` | Pinned message ID per conversation |

---

## ⚡ Neon PostgreSQL Target Schema (DDL for Phase 2)

```sql
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
    id VARCHAR(100) PRIMARY KEY, -- userA_userB (alphabetically sorted)
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
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 🚀 Exact Next Steps for Phase 2 Development Session

1. **Git Commit & Push (Branch: `feat/v1.0.1-ui-refinements`):**
   ```bash
   git checkout -b feat/v1.0.1-ui-refinements
   git add .
   git commit -m "feat(release): v1.0.1 - UI/UX refinements, click-to-edit nickname & structured profiles"
   git push -u origin feat/v1.0.1-ui-refinements
   ```
2. **Phase 2 Backend Integration (Go + Neon DB):**
   - Create a Neon PostgreSQL project, execute the DDL above, and seed pre-provisioned user accounts via `pgcrypto`.
   - Setup a Go Fiber backend service in `server/` with Gorilla WebSocket.
   - Implement WebSocket message broadcasting:
     - `chat:send`
     - `chat:reaction`
     - `chat:pin`
     - `preference:update` (nickname and background color sync)
   - Replace `storageService.ts` with a WebSocket client connection (`ws://localhost:8080/ws` -> `wss://hush-backend.onrender.com/ws`).
