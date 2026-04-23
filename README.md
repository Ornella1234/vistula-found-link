# FoundIt — Vistula University Lost & Found System

> An AI-powered Lost & Found platform built exclusively for Vistula University students and staff.

![FoundIt](src/assets/logo.png)

## 🔍 What it does

- Students and staff post **lost** or **found** items with a photo
- **AI Scanner** — take a photo and it auto-fills title, description & category
- **AI Search** — find items using plain language (e.g. "black laptop near the library")
- Email contact revealed only to verified Vistula university members
- Items can be marked **resolved** when returned

## 🔐 Access

Only `@stu.vistula.edu.pl` (students) and `@vistula.edu.pl` (staff) emails can register.

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | TanStack Start (React 19 + Vite 7) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Backend | Supabase (Postgres + Auth + Storage) |
| AI | Google Gemini 2.5 Flash |
| Hosting | Cloudflare Pages |

## 🚀 Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/YOUR-USERNAME/foundit-vistula.git
cd foundit-vistula
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the project root:
