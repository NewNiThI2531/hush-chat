# Changelog — HusH Private Messaging Web Application

All notable changes to this project are documented in this file in accordance with [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

---

## [v2.0.1] — 2026-10-21 (Branch: `release/v2.0.0-production`, `main`)

### 🛠️ Production Bugfix & UI Decluttering Release
- **Critical Message Sending & Display Pipeline Fixed (`SA` & `Developer`):**
  - **Auto-Provision 1:1 Conversations Safely:** Implemented PostgreSQL `LEAST($1::uuid, $2::uuid)` and `GREATEST($1::uuid, $2::uuid)` ordering in `conversations` insertion query so it strictly satisfies `chk_ordered_pair` constraint without failure.
  - **UUID vs. Local ID Synchronization:** Resolved conversation ID mapping between database UUIDs and optimistic client keys. `storageService.getConversationIdSync` synchronously resolves cached conversation UUIDs.
  - **Optimistic UI (<10ms):** Appends messages immediately to local state and storage cache upon `Send`, with real-time background persistence to Neon PostgreSQL `messages` table.
  - **Resilient Message Retrieval:** `getConversationMessages` matches messages by conversation UUID as well as bidirectional user pairs (`sender_id`/`receiver_id`), ensuring immediate rendering and zero message disappearance during state transitions.
- **Production UI Decluttering (`UI/UX` & `Developer`):**
  - **Brand Header & Sidebar:** Removed `CHAT` badge and version badge from top-left header; renamed `Manage Users / Admin` (stripped `RBAC` badge) to `Manage User` with visibility restricted strictly to `SYSTEM_ADMIN` (`Hushadmin`) and `FULL_ACCESS` (`New010`); renamed `+ Add Friend by Username` to `Add Friend`; stripped role text from bottom account footer; completely removed database sync button.
  - **Chat Canvas & Composer:** Removed top encryption pill and 90-day subtext banner; simplified input placeholder to `พิมพ์ข้อความ...`; completely removed composer footer micro-copy.
  - **Right Contact Detail Sidebar:** Removed gray helper descriptions under Nickname and Chat Background sections; removed redundant sidebar footer text.
- **Profile Setting Modal Redesign (`UI/UX`, `SA` & `Developer`):**
  - Cleaned header title to `Profile Setting` and removed subtitle.
  - Made `Last Name` optional (removed required `*`).
  - Added clean read-only `Role / สิทธิ์การใช้งาน` field beside `@username`.
  - Added clearable & toggleable visibility (`showPhone`, `showAge`) with `Eye` / `EyeOff` (`แสดง` / `ซ่อน`) toggle buttons linked to `users.show_phone` and `users.show_age` in PostgreSQL.
  - Removed bottom security & privacy notice box.
- **Manage User View Cleanup:**
  - Removed all database jargon (`Neon`, `PostgreSQL`, `RBAC`, `WebSocket`) and unnecessary developer banners.

---

## [v2.0.0-rc.1] — 2026-10-20 (Branch: `release/v2.0.0-production`)

### 🚀 Release Candidate 1: Clean Neon DB Build (Zero Mock Data for Preview Testing)
- **Git & Release Context:**
  - **Previous Version (`main`):** `v1.0.1` (Interactive mockup phase)
  - **Current Pushed Branch:** `release/v2.0.0-production` (`v2.0.0-rc.1` — Clean Neon DB build, zero mock data)
  - **Next Step:** After verifying the Vercel Preview Deployment URL on `release/v2.0.0-production`, merge into `main` as `v2.0.0`.
- **100% Mock Purge & Real Neon PostgreSQL Integration:**
  - Deleted `src/data/mockData.ts` and all mock arrays (`INITIAL_USERS`, `MOCK_USERS`, `DEMO_MESSAGES`, `SEED_DATA`).
  - Added `purgeLegacyMockStorage()` running on application initialization to clean legacy browser `localStorage` mock keys.
  - Eliminated mock fallbacks so empty database conversations render a clean empty message state.
  - Removed fallback passwords in favor of strict SHA-256 database authentication.
- **Production-Clean UI:**
  - Minimalist Login screen: Brand logo + Title + Username + Password + Sign In button strictly.
  - Purged persona switcher (`สลับบัญชี`) from Admin Console and `Test 10s` (`⚡ ในอีก 10 วินาที`) preset from Schedule Modal.
  - Cleaned all mock placeholders across modals (`AddFriendModal`, `SelfProfileModal`).
- **Live Database State on Neon PostgreSQL:**
  - Seeded and verified only the 3 authorized production accounts:
    1. **`@Hushadmin`**: `Hush Administrator` (`account_type: SYSTEM_ADMIN`, `access_level: ADMIN_ONLY`, `can_chat: false`, `is_immutable_admin: true`, Password: `Admin@002452@`).
    2. **`@New010`**: `Nithi` (`account_type: MEMBER`, `access_level: FULL_ACCESS`, `can_chat: true`, `is_immutable_admin: false`, Password: `N!ew@14523@`).
    3. **`@Fernrs`**: `Rungfa` (`account_type: MEMBER`, `access_level: USER`, `can_chat: true`, `is_immutable_admin: false`, Password: `F!ern@02020@`).
- **Per-Message 90-Day Rolling TTL Retention Policy:**
  - Enforced per-message granularity: each individual message has an independent 90-day lifecycle starting from `messages.created_at` (not from `conversations.created_at`).
  - Rolling cleanup query purges ONLY individual messages older than 90 days (`DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days'`), keeping newer conversation messages intact.
  - Fetch queries include safety filter (`WHERE created_at >= NOW() - INTERVAL '90 days'`).
  - Added index `idx_messages_created_at` on `messages(created_at ASC)`.
  - Added foreign key constraint `fk_conversations_pinned_message` with `ON DELETE SET NULL`: if a pinned message expires past 90 days, `pinned_message_id` automatically resets to `NULL` without affecting the conversation.

---

## [v2.0.0] — 2026-10-20 (Branches: `feat/v2.0.0-neon-production`, `main`)

### 🗄️ Production Release: Live Neon Serverless PostgreSQL & Vercel Deployment
- **100% Real Database Backed (Purged Mock Data):**
  - Completely purged mock personas, mock conversations, and demo switchers.
  - Connected live to Neon Serverless PostgreSQL via `@neondatabase/serverless` HTTP fetch driver (`import.meta.env.VITE_DATABASE_URL` with automatic fallback).
  - Provisioned 6 normalized relational tables on Neon DB: `users`, `conversations`, `messages`, `message_reactions`, `user_contacts`, and `schedules`.
  - Enforced 90-day automated message retention purge (`DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days'`).
- **Seeded 3 Production Accounts:**
  - **`@Hushadmin`:** Protected Sole System Administrator (Immutable, `account_type: SYSTEM_ADMIN`, `can_chat: false`, routes directly to Admin Console).
  - **`@New010`:** Nithi B. (`first_name: 'Nithi'`, `last_name: 'B.'`, Software Engineer & Co-Owner, `account_type: MEMBER`, `access_level: FULL_ACCESS`, can chat and manage users).
  - **`@Fernrs`:** Fern RS (`first_name: 'Fern'`, `last_name: 'RS'`, Product Specialist, `account_type: MEMBER`, `access_level: USER`, standard member with friend-by-username visibility).
- **Sole Admin Immutability Protection:**
  - Visually badged `@Hushadmin` as **`Protected Sole Admin (Immutable)`**.
  - Edit and delete actions are permanently locked in the Admin Console and rejected by the storage service.
- **Ultra-Clean Login Experience:**
  - Replaced demo switcher with a minimalist Username + Password form.
  - Live Neon PostgreSQL status indicator and reviewer credentials reference.
- **Multi-Client Real-Time Synchronization:**
  - Background polling loop syncing messages, reactions, contacts, and schedules between users and devices in real-time.
- **Live Vercel Deployment:**
  - Deployed to `https://hush-chat-omega.vercel.app`.

---

## [v1.1.0-mockup] — 2026-10-20 (Branch: `feat/v1.1.0-rbac-and-schedule`)

### 🚀 Relational RBAC, Admin Console & iPhone 1:1 Calendar System
- **1:1 Interactive Calendar System (iPhone Calendar App Experience):**
  - Designed full interactive monthly calendar grid with Thai/Buddhist calendar integration, navigation chevrons, and "Today" (วันนี้) jump button.
  - **Today Indicator:** Classic iOS red circle (`#EF4444`) with white typography.
  - **Date Event Dots:** Dates with scheduled reminders display dedicated indicator dots (sky blue `#0EA5E9` and amber).
  - **Selected Day Agenda View:** Dynamic schedule list for the selected date with left colored vertical stripe, time slot, auto-message preview, and dispatched badge.
  - **Segmented View Control:** Seamless switching between `ปฏิทินรายเดือน (Month View)`, `วาระนัดหมายทั้งหมด (Agenda View)`, and `สร้างนัดหมาย (+)`.
  - **Quick Presets:** Instant testing options (⚡ *In 10 seconds*, ⏱️ *In 1 minute*, 🌅 *Tomorrow 9:00 AM*).
- **Real-Time Schedule Due Dispatcher & Pop-Up Alert Modal:**
  - Automated 1-second interval checking schedules where `scheduledAt <= now` and `!isTriggered`.
  - Automatically dispatches message into 1:1 chat with `isScheduledDispatch: true` and `📅 Scheduled Reminder` badge.
  - Triggers prominent on-screen **1:1 Schedule Due Alert Modal** with sound haptics and "Jump to Chat" navigation.
- **Normalized Relational Data Architecture (Neon PostgreSQL Ready):**
  - Strictly separated tables linked by foreign keys: `users`, `conversations` (1:1 participant pair), `messages`, `user_contacts` (friendships), and `schedules`.
- **Tiered Role-Based Access Control (RBAC):**
  - **`SYSTEM_ADMIN` (admin):** Dedicated User & Directory Admin. Strictly forbidden from chat (`canChat: false`). Routes directly to the Admin Console upon login.
  - **`OWNER_ADMIN` (alex):** Primary account with full admin privileges + full 1:1 chat and schedule capabilities.
  - **`FULL_ACCESS` Member (sarah):** Can see all users, create new users, and edit permissions.
  - **`VIEW_ALL` Member (marcus, sophie):** Can view all directory users and chat with them, but cannot manage users.
  - **`USER` Standard Member (elena, david):** Restricted directory visibility. Only sees contacts added as friends.
- **Username Friend System:**
  - Added `+ Add Friend by Username` modal for standard members to find and add contacts by exact `@username`.
- **Admin User Management Console (`Admin / Manage Users`):**
  - Accessible for `SYSTEM_ADMIN`, `OWNER_ADMIN`, and `FULL_ACCESS` members.
  - Overview statistics (Total Users, Admins, Full Access, View All, Standard Members).
  - Search & filter by access level.
  - `+ Create User` modal with `@username`, password, profile fields, and access tier selection.
  - `Edit User` modal allowing admins to update anyone's `@username`, reset password, and modify permissions.
- **Chat Header Cleanup:**
  - Completely removed deprecated `Auto-clears after 3 months` pill and `Simulate` button.
  - Replaced with clean `📅 Schedule` button displaying upcoming event count badge.

---

## [v1.0.1] — 2026-10-20 (Branch: `main`, Commit: `504a0b9`)

### 🛠️ UI/UX Refinements & Functional Enhancements
- **Strict Proportional Layout & Responsive Viewports:**
  - Enforced `h-dvh w-full overflow-hidden` on the root shell to guarantee zero outer page scrollbars on all screens (Desktop, Laptop, iPad, iPhone Web).
  - Enforced `min-w-0 flex-1` on the center chat viewport so long text and financial numbers wrap cleanly without pushing sidebars off-screen.
  - Standardized proportional sidebars: Left Sidebar `w-72` (`288px`) on Desktop (`lg+`), Right Contact Detail Sidebar `w-80` (`320px`) on `xl+`.
  - Configured Right Contact Detail Sidebar as a clean Slide-Over Drawer with backdrop overlay on screens `< 1280px` so it never squishes the center chat area.
  - Constrained Typography (`T`) and Emoji/3D Sticker (`😊`) popovers within viewport bounds (`max-h-[min(420px,calc(100dvh-180px))]` and `max-h-[min(480px,calc(100dvh-180px))]`) to prevent clipping or overlapping header bars.
- **Removed Security Policy & Conversation Stats Card:**
  - Completely removed the *"ความปลอดภัย & นโยบายความเป็นส่วนตัว (Security & Privacy Policy)"* box and *"สถิติบทสนทนา"* counter from the Right Sidebar and Chat UI for an ultra-clean minimalist design.
- **Explicit Click-to-Edit Contact Nickname:**
  - Converted the Right Sidebar contact nickname from an open input into an explicit two-state interaction:
    - **Read-Only (Default):** Static nickname text (or *"ยังไม่ได้ตั้งชื่อเล่น (ใช้ชื่อจริง)"*) alongside an explicit **`✏️ แก้ไข` (Edit)** button.
    - **Edit Mode:** Active input field with **`บันทึก` (Save ✓)** and **`ยกเลิก` (Cancel ✕)** buttons.
    - Updated nickname immediately propagates to Left Contacts List, Active Contact Card, and Chat Header.
- **Structured User Profile Fields:**
  - Updated User model and storage schema with separate **First Name (`firstName` — Required)** and **Last Name (`lastName` — Required)**.
  - Added optional **Job Title (`jobTitle` — ตำแหน่งงาน)**: user can leave blank; if blank, hides cleanly in UI without empty placeholder boxes.
  - Added optional **Details / Bio (`bio` — รายละเอียดเพิ่มเติม)**: user can leave blank; if blank, hides cleanly in UI.
  - Self Profile Modal (`⚙️`) updated with dual-name inputs, optional job title, optional details, phone, age, and Thiings 3D avatar selection.
  - Persona Switcher removed from the sidebar footer in favor of a clean, unified account owner bar with `⚙️` Profile button and Logout.
- **Git Branch Standard:**
  - Pushed to feature branch `feat/v1.0.1-ui-refinements` on `NewNiThI2531/hush-chat`, keeping `main` untouched at `v1.0.0` until review sign-off.

---

## [v1.0.0] — 2026-10-19 (Branch: `main`, Commit: `7dcef4e`)

### ✨ Initial Production Prototype Release
- Initial interactive client-side prototype of **HusH** deployed to GitHub `main` (`7dcef4e`).
- 3-column architecture (Left Contacts Sidebar + Center Chat + Right Contact Detail).
- 4-color accent design system: Black (`#111827`), Sky Blue (`#0EA5E9`), Orange (`#F97316`), Rose Pink (`#EC4899`).
- `font-variant-numeric: tabular-nums` for crisp number/metric alignment.
- 7 Chat Background Themes: Pure White, Soft Slate, Warm Sand, Soft Orange, Soft Sky Blue, Soft Rose Pink, Subtle Carbon Dark.
- Thiings.co transparent 3D stickers integration using Vercel Blob CDN (`https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-{fileId}.png`).
- Pinned message banner, search keyword filter, and emoji reactions (`🙌`, `❤️`, `👍`, `🔥`, `🎉`).
- LocalStorage persistence (`storageService`) for messages, pinned state, users, and contact preferences.
- Audio haptic feedback via Web Audio API.

---

## [v0.0.0] — 2026-10-19

### 🚀 Initial
- Initial repository setup with Vite, React 19, TypeScript, and Tailwind CSS.
