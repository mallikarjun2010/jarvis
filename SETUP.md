# Setup and Operations Guide - Jarvis OS

Welcome to **Jarvis OS**—a cinematic, premium, and highly capable AI Operating System designed to organize and automate your digital life. 

This guide outlines setup requirements, environment parameters, and manual procedures for running your personal AI OS locally.

---

## 🛠️ Technology Stack

- **Frontend & Backend**: Next.js 14 App Router, React 18, TypeScript
- **Database Layer**: Prisma ORM, SQLite (local zero-configuration engine)
- **AI Engine**: Google Gemini API SDK (with multi-step function tool-calling)
- **Services Integration**: Google APIs Node SDK (`googleapis`)
- **Authentication & Security**: Custom JWT cookies + encrypted OAuth storage
- **Background Daemon**: Next.js instrumentation check loops

---

## 🔑 Prerequisites & Credentials Setup

Before running the application, you will need to gather credentials from Google AI Studio and the Google Cloud Developer Console.

### 1. Get Google Gemini API Key
1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Create and copy an **API Key**.

### 2. Configure Google Cloud OAuth Credentials
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `Jarvis OS`).
3. Set up the **OAuth consent screen**:
   - Select **External** user type.
   - Fill in basic app information.
   - In **Scopes**, add the following scopes:
     - `.../auth/userinfo.profile` (Profile view)
     - `.../auth/userinfo.email` (Email view)
     - `.../auth/gmail.modify` (Read, compose, delete, and archive emails)
     - `.../auth/calendar` (Manage Google Calendar events)
     - `.../auth/spreadsheets` (Read/write Google Sheets cells)
     - `.../auth/drive` (List and download Drive files)
     - `.../auth/documents` (Create and update Google Docs)
   - In **Test Users**, add your personal Google email address (required for apps in testing mode).
4. Create **Credentials** -> **OAuth 2.0 Client ID**:
   - Select **Web Application** type.
   - Under **Authorized redirect URIs**, add exactly:
     `http://localhost:3000/api/auth/google/callback`
   - Copy the generated **Client ID** and **Client Secret**.

---

## 🚀 Installation & Local Launch

### Step 1: Duplicate and fill out Environment Variables
Create a file named `.env` in the root of the workspace directory (`/jarvis`) and fill out the details using the template:

```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="AIzaSy..." # Your Gemini API key
GOOGLE_CLIENT_ID="12345-..." # Your Google Cloud client ID
GOOGLE_CLIENT_SECRET="GOCSPX-..." # Your Google Cloud client secret
JWT_SECRET="any-secure-string-at-least-32-chars-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 2: Push Database Schema
Initialize the local SQLite database and auto-generate the database client bindings:
```bash
npx prisma db push
```
This automatically creates the database file `prisma/dev.db` locally.

### Step 3: Run the Development Server
Start Next.js local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🕹️ Operations and User Guide

### 🧬 The Core Interface
- **Left Sidebar**: Tab navigation panel for specialized workspaces (Gmail, Calendar, Sheets, etc.).
- **Right Telemetry**: System feeds, active meeting lists, connected services check lights, and live AI thought stream logs showing Gemini's monologue.
- **Center desktop**: large glowing **AI Orb** reacting to idle, thinking, listening, and speaking states.

### ⌨️ Command Shortcut Palette (`Ctrl+K` / `Cmd+K`)
Pressing `Ctrl+K` (or `Cmd+K` on Mac) opens the Command Palette:
- Search and press **Enter** to instantly jump to different workspaces.
- Type any custom text that does not match a command and press **Enter** to instantly create a new task in your local database.
- Trigger manual digests (Morning OS briefing, Evening prep).

### 🎙️ Interactive Voice Mode
At the bottom right of the screen is the floating Voice Mode overlay:
- Click the **Microphone** icon to speak commands. Speak clearly; transcriptions will stream and auto-submit to the assistant when you pause speaking.
- Click the **Volume** icon to toggle speech synthesis feedback. When enabled, Jarvis OS will speak responses back to you in a natural system voice.

### 🤖 Automatic Background Automations
Jarvis OS is equipped with a background daemon (`src/instrumentation.ts`):
- It boots with the server and checks schedules every 5 minutes in a non-blocking thread.
- If **Automatic Morning Briefings** is enabled, it automatically reads your Gmail inbox and Calendar schedules at **8:00 AM** local time, compiles a daily focus plan, and logs it.
- At **9:00 PM** local time, it automatically compiles an evening review of completed tasks and previews tomorrow's meetings.
