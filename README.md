# BITS Goa Anonymous Chat

A lightweight, anonymous chat platform designed for students of BITS Goa — but open to everyone. The app provides a safe space for **confessions, venting, and emotional support** with a strong focus on **simplicity, privacy, and trust**.

---

## 🚀 Features
- **Anonymous Posting** – Ephemeral usernames, no sign-up, no personal data collection.
- **Text-Only Content** – No images or links to keep the platform safe and lightweight.
- **Channels at Launch**:
  - General (campus-wide discussions)
  - Confessions (venting & secrets)
  - Support (emotional/mental health support)
- **Hybrid Moderation System**:
  - Automated profanity & spam filters
  - Community flagging & reporting
  - Lightweight admin review tools
- **Strong Privacy Model**:
  - No personal identifiers stored
  - Ephemeral message storage (auto-purged)
  - HTTPS for secure delivery
- **Spam Protection**:
  - Min/max message length
  - Line-break & repetition filters
  - Rate limiting per session
  - Honeypot bot detection

---

## 🎨 UI Design Principles
- **Simplicity:** Minimal clicks, one-tap post & browse experience.
- **Color Palette:**
  - Background: `#121212` (Rich Black)
  - Accent/Buttons: `#4CAF50` (Emerald Green)
  - Primary Text Background: `#FFFFFF` (Pure White)
  - Highlights/Headers: `#3F51B5` (Indigo)
- **Style:** Clean typography, mobile-first, dark theme with high contrast for readability.

---

## 🛠️ Tech Stack
- **Frontend:** React (or Vue) – mobile-first responsive design
- **Backend:** Node.js with WebSockets (or Supabase + Redis for realtime & ephemeral storage)
- **Database:** Redis (ephemeral TTL) + Supabase for metadata & reports
- **Hosting:** Vercel/Netlify (frontend), Railway/Render (backend)
- **Security:** TLS/HTTPS, ephemeral logs, automated moderation

---

## 📂 Project Structure (suggested)
