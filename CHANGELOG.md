# Changelog — HusH Private Messaging Web Application

All notable changes to this project are documented in this file in accordance with [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

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
