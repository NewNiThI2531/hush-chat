# HusH — Private & Minimalist Workspace Messenger
### Version 1: Interactive UI/UX Mockup & Responsive Architecture Prototype

"HusH" is a private, ultra-fast, lightweight text-and-number messaging web application designed with a clean, airy Notion/Linear aesthetic. It is engineered specifically for privacy, fast interaction, and high numeric readability with zero bloated file attachments.

---

## ✨ Key Features (Version 1 Prototype)

### 1. 🔐 Pre-Provisioned Authentication & Persona Switcher
- Clean, minimal login card with Username and Password fields (no public sign-up/registration).
- **Quick Persona Switcher:** Hot-swap between **6 pre-seeded member accounts** (`Alex Lee`, `Sophie Chen`, `Marcus Reed`, `Emma Wilson`, `Noah Williams`, `Olivia Park`) to test two-way reactive messaging locally.

### 2. 🎨 4-Color Accent Design System
- **Black (`#111827`):** HusH Soundwave brand mark, primary typography, active selection outlines.
- **Sky Blue (`#0EA5E9`):** Primary `Send` CTA, read receipts (`✓✓`), blue text option, and avatar accents.
- **Vibrant Orange (`#F97316`):** Unread message badges, pinned message indicators, orange text option, and avatar accents.
- **Rose Pink (`#EC4899`):** Reaction highlights, sticker accents, pink text option, and avatar accents.

### 3. 📊 Tabular Numeric Formatting
- Enforces `tabular-nums` (`font-variant-numeric: tabular-nums`) across all message bubbles, financial figures, counters, and timestamps for crisp numeric alignment.

### 4. ✨ Thiings.co 3D Stickers (Zero-Blob Architecture)
- Rich floating 3D stickers powered by **Thiings.co CDN** (`https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-{fileId}.png`).
- Stored as lightweight string metadata (`stickerId` + `fileId` + `name`) in PostgreSQL rather than heavy binary image blobs.
- Interactive sticker picker with category filtering (`Approval`, `Praise`, `Finance`, `Status`) and instant live search.

### 5. 📱 Responsive & Adaptive Viewport System
- **Dynamic Viewport (`100dvh`):** Automatically adapts when mobile browser address bars and virtual keyboards expand.
- **iPhone / Mobile Web (`< 768px`):** Single-pane drill-down (`Contacts` ↔ `Active Chat`), mobile back button with total unread badge, bottom-sheet drawers, tap-to-react, and `44×44px` touch targets.
- **iPad / Tablet (`768px – 1023px`):** Compact split-view (`280px` sidebar) with a toggle button to collapse/expand in portrait orientation.
- **Laptop & Desktop PC (`≥ 1024px`):** Full reference 2-pane layout (`320px–340px` sidebar) with instant hover action bars.

### 6. 🛡️ 90-Day Data Retention Policy
- Clear indicator banner: `"Auto-clears after 3 months (90-day retention)"`.
- Pre-designed automated TTL/cleanup logic for Neon Serverless PostgreSQL Free Tier optimization.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript |
| **Bundler & Dev Server** | Vite 8 |
| **Styling** | Tailwind CSS + Custom CSS Variables |
| **Icons** | Lucide React |
| **3D Stickers** | Thiings.co Vercel Blob Storage CDN |
| **Typography** | Plus Jakarta Sans, Inter |
| **Local State** | Reactive `localStorage` State Machine |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Installation
```bash
# Clone the repository
git clone https://github.com/NewNiThI2531/hush-chat.git
cd hush-chat

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

### Production Build & Type Check
```bash
# Run TypeScript type check and production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🗺️ Roadmap to Phase 2 (Production Backend)

- [ ] **Go WebSocket Gateway:** Real-time messaging service built with Go (Fiber + Gorilla WebSocket) deployed on Render.
- [ ] **Neon Serverless PostgreSQL:** Database persistence with connection pooling (`pgxpool`).
- [ ] **pgcrypto Authentication:** Server-side bcrypt authentication for pre-provisioned admin users.
- [ ] **pg_cron Auto-Purge:** Daily scheduled job to delete messages and reactions older than 90 days.
- [ ] **Vercel Cloud Deployment:** Automated CI/CD pipeline from GitHub `main` branch.

---

## 📄 License
Private & Confidential — Built for HusH Workspace Team.
