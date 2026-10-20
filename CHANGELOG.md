# Changelog — HusH Private Messaging Web Application

All notable changes to this project are documented in this file in accordance with [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

---

## [v1.0.1] — 2026-10-20 (Branch: `feat/v1.0.1-ui-refinements`)

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
