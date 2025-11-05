# BITS Whispers - Anonymous Chat Platform

A production-ready, anonymous chat platform designed for students of BITS Goa. The app provides a safe space for **confessions, venting, and emotional support** with a strong focus on **simplicity, privacy, and trust**.

---

## 🚀 Features
- **Anonymous Posting** – Ephemeral usernames, no sign-up, no personal data collection
- **Real-time Chat** – Instant message updates across all channels
- **Multi-Channel Support**:
  - General (campus-wide discussions)
  - Confessions (venting & secrets)
  - Support (emotional/mental health support)
  - Location-based channels (Food outlets, Lecture halls, etc.)
- **Advanced Spam Protection**:
  - Message validation (length, repetition, line breaks)
  - Rate limiting with persistent cooldowns
  - Honeypot bot detection
  - Client-side and server-side validation
- **Message Features**:
  - Reply to messages
  - Report inappropriate content
  - Pagination (25 messages per load)
  - Auto-scroll to latest messages
- **Privacy & Security**:
  - No personal identifiers stored
  - Anonymous authentication
  - Firestore security rules
  - Isolated databases per channel type

---

## 🛠️ Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI Components:** Radix UI + Tailwind CSS
- **Database:** Firebase Firestore (multi-project architecture)
- **Real-time:** Firestore onSnapshot listeners
- **Authentication:** Firebase Anonymous Auth
- **Storage:** Firestore with persistent local cache

---

## 📦 Installation

```bash
npm install
```

## 🏃 Development

```bash
npm run dev
```

## 🏗️ Build

```bash
npm run build
```

## 📂 Project Structure
