# StudyFlow AI

## Quick start on Windows

The mobile app is pinned to Expo SDK 57 and React Native 0.86.3, matching the current Expo Go app shown in the Android error screen. Do not restore the deleted React Native internal patch.

1. Install Python 3.11+ from [python.org](https://www.python.org/downloads/) and select **Add Python to PATH**. The existing `backend/venv` references a removed Python installation, so recreate it.
2. In PowerShell, start the API:

```powershell
cd D:\studyflow-ai\studyflow-ai\backend
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

3. Open `backend/.env`. For the fastest no-setup demo, uncomment `DATABASE_URL=sqlite:///./studyflow.db`. To use XAMPP/MySQL instead, leave that line commented, start MySQL, and run `schema.sql` once.
4. Start the backend:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

5. In a second PowerShell window, configure the phone-to-backend address:

```powershell
cd D:\studyflow-ai\studyflow-ai\mobile
Copy-Item .env.example .env
ipconfig
```

Replace the sample IP in `mobile/.env` with your computer's Wi-Fi IPv4 address, for example `EXPO_PUBLIC_API_URL=http://192.168.1.42:8000`. Keep the phone and computer on the same Wi-Fi.
6. Run the app:

```powershell
npm install
npx expo start --clear
```

7. Open Expo Go, scan the QR code, register, create a roadmap, then use the **Materials** tab to upload a text-based PDF. It produces a summary, important topics, tappable flashcards, PDF-grounded tutor answers, and ten practice MCQs. Material quiz results feed the existing weak-area dashboard and prioritize the next roadmap day.

Expo Go SDK 53 cannot use remote push notification APIs. This project deliberately keeps reminders disabled in Expo Go so it does not crash. Build a custom development client later if you want remote push notifications.

An AI-powered daily study companion: pick a goal, get a personalized day-by-day
roadmap, take AI quizzes, get weak-area feedback, and build a streak.

**Design & UX highlights:** animated gradient backgrounds, an animated circular
progress ring (SVG-based), a confetti celebration on strong quiz scores, a
pulsing streak flame, unlockable achievement badges (3/7/14/30/60-day
milestones), password-visibility toggles on login/register, and a startup
bootstrap flow that resumes a logged-in user's active roadmap automatically
instead of always restarting at onboarding (this also fixes the crash some
users hit when relaunching the app with no roadmap in view).

**Dashboard & profile:** the app now has bottom-tab navigation — Roadmap,
Dashboard, and Profile. The Dashboard has bar charts of weekly study activity
and recent quiz scores plus the streak ring and achievements. Profile shows
the student's avatar/name/email, current plan (Free/Pro) with usage remaining,
a daily-reminder toggle, and logout.

**Note on notifications:** `expo-notifications`' Android functionality was
removed from Expo Go in SDK 53 — it only works in a custom development build.
The reminder toggle is wired up but shows a clear message in Expo Go instead
of crashing; a full working implementation is kept commented out in
`mobile/src/api/notifications.js`, ready to restore once you build with
`eas build --profile development`.

**Monetization:** a rewarded-ad style banner appears after a quiz for free
users ("watch an ad for 5 bonus questions") — the reward logic is real
(it fetches and runs a genuine bonus round), but the "ad" itself is a
placeholder delay; swap it for a real ad SDK call when you wire up AdMob.

**Performance tracking & AI assistant:** the Dashboard now aggregates missed
quiz topics across every attempt into a "where you need the most work" list —
real data, not a single quiz's snapshot. A new Assistant tab lets students ask
questions in plain language; it answers using their real weak-area and goal
data. With no AI_PROVIDER configured it uses a transparent rule-based
responder (not a fake "thinking" AI); set AI_PROVIDER in `.env` to upgrade it
to a real LLM with no code changes needed.

This repo has two parts:

```
studyflow-ai/
├── backend/   FastAPI + MySQL API (roadmap/quiz/progress generation)
└── mobile/    Expo React Native app (Android, iOS, Web)
```

The app works out of the box with **zero API keys** — the AI layer has an
offline generator so you can run a full demo immediately, then upgrade to a
real LLM later by setting one env var.

---

## 1. Prerequisites

Install these once:

- **Python 3.10+** — https://www.python.org/downloads/
- **Node.js 18+ (LTS)** — https://nodejs.org
- **XAMPP** (for local MySQL) — https://www.apachefriends.org — you already use this
- **Expo Go app** on your phone (free, from Play Store / App Store) — easiest way to test on a real device
- Optional: **Android Studio** (Android emulator) or **Xcode** (iOS simulator, macOS only)

---

## 2. Backend setup (FastAPI + MySQL)

### 2.1 Start MySQL

Open the XAMPP Control Panel → start **MySQL** (Apache is not needed).

### 2.2 Create the database

Open phpMyAdmin (`http://localhost/phpmyadmin`) → SQL tab → paste the contents
of `backend/schema.sql` and run it. (Or just skip this — the app will
auto-create the `studyflow` database's tables on first run via SQLAlchemy, as
long as the `studyflow` database itself exists. Easiest: run just this one
line in phpMyAdmin's SQL tab first: `CREATE DATABASE studyflow;`)

### 2.3 Install dependencies

```bash
cd studyflow-ai/backend
python -m venv venv

# Activate the virtual environment:
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

pip install -r requirements.txt
```

### 2.4 Configure environment

```bash
cp .env.example .env
```

Open `.env` and adjust if your XAMPP MySQL uses a password (default XAMPP has
no password on `root`, so the defaults usually work as-is).

### 2.5 Run the API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see `Application startup complete`. Now verify it's alive:

- Open **http://localhost:8000** → `{"status":"ok","service":"StudyFlow AI API"}`
- Open **http://localhost:8000/docs** → interactive Swagger UI where you can
  test every endpoint (register, login, generate roadmap, generate quiz,
  submit quiz, progress) directly in the browser — do this first, before
  touching the mobile app, to confirm the backend works end to end.

### 2.6 Quick backend test via Swagger UI

1. `POST /auth/register` with `{"name":"Test","email":"test@test.com","password":"test1234"}`
   → copy the `access_token` from the response.
2. Click **Authorize** (top right of `/docs`) → paste the token → Authorize.
3. `POST /roadmap/generate` with `{"goal_text":"Learn Python for a job interview","duration_days":10}`
   → you get back a full 10-day roadmap instantly (offline generator, no API key needed).
4. `POST /quiz/generate` with `{"roadmap_day_id": 1, "num_questions": 5}` → 5 MCQs.
5. `GET /progress` → your streak/stats.

If all 4 work, the backend is fully functional.

---

## 3. Mobile app setup (Expo / React Native)

### 3.1 Install dependencies

```bash
cd studyflow-ai/mobile
npm install
```

### 3.2 Point the app at your backend

Copy `mobile/.env.example` to `mobile/.env`. The defaults handle the common cases:

- **Android emulator** → `10.0.2.2:8000` (auto-configured)
- **iOS simulator** → `localhost:8000` (auto-configured)
- **Physical phone (Expo Go)** → set `EXPO_PUBLIC_API_URL` in `mobile/.env` to
  your computer's LAN IP, e.g. `http://192.168.1.42:8000`. Find your IP with
  `ipconfig` (Windows) or `ifconfig`/`ip a` (macOS/Linux). Your phone and
  computer must be on the same Wi-Fi network.

### 3.3 Run it

```bash
npx expo start
```

This opens Expo's terminal UI with a QR code. Choose how to test:

| Target | How |
|---|---|
| **Physical Android/iPhone** | Open **Expo Go** app → scan the QR code shown in the terminal |
| **Android emulator** | Press `a` in the terminal (needs Android Studio's emulator running) |
| **iOS simulator (macOS only)** | Press `i` in the terminal (needs Xcode installed) |
| **Web browser** | Press `w` in the terminal — runs the whole app at `localhost:8081` |

### 3.4 Full test walkthrough

1. App opens → **Onboarding** screen → tap **Get Started**.
2. **Register** with a name/email/password → you land on **Goal Setup**.
3. Type a goal (or tap a suggestion chip) → **Generate my roadmap**.
4. You land on the **Roadmap** screen with Day 1 unlocked (🔵) and the rest
   locked/pending (⚪).
5. Tap **Day 1** → **Lesson** screen → tap **Take today's quiz**.
6. Answer the 5 MCQs → see your score + any weak topics flagged.
7. Back on the Lesson screen, tap **Mark day complete** → Day 1 turns ✅,
   Day 2 unlocks, and your streak counter increments.
8. Tap **Progress** (top right) → see streak, quiz average, days completed.
9. Generate a 6th roadmap in one month on the Free plan → you'll hit the
   5-roadmaps/month cap and get routed to the **Paywall** screen (this
   demonstrates the HAMM/monetization flow — no real payment is wired up yet).

---

## 4. Making it a real installable app (Android / iOS / macOS / Windows)

### Android & iOS (the two that matter for the Shipaton)
Expo builds real, installable, store-ready binaries with **EAS Build** — no
native Android Studio/Xcode project setup required:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # produces an installable .apk / .aab
eas build --platform ios       # produces an .ipa (needs an Apple Developer account to sign)
```

EAS builds in the cloud and gives you a download link when done — install the
`.apk` directly on any Android phone, or submit the `.ipa` to TestFlight/App
Store with `eas submit`.

### Web (works today, zero extra setup)
```bash
npx expo export --platform web
```
This produces a static site in `dist/` you can host anywhere (Vercel,
Netlify, GitHub Pages) — installable as a PWA on desktop and mobile browsers.

### macOS & Windows desktop
Expo/React Native doesn't target desktop OSes directly. Two solid paths,
depending on how much native feel you need:

1. **Fastest — wrap the web build** (recommended for a hackathon deadline):
   run `npx expo export --platform web`, then wrap the output with
   [Tauri](https://tauri.app) (lightweight, Rust-based) or
   [Electron](https://www.electronjs.org) to get a double-click `.exe`
   installer for Windows and a `.dmg`/`.app` for macOS. This is by far the
   fastest way to check the "macOS + Windows" box.
2. **Fully native desktop** — add the out-of-tree platforms
   [`react-native-windows`](https://microsoft.github.io/react-native-windows/)
   and [`react-native-macos`](https://microsoft.github.io/react-native-windows/docs/rnm-getting-started)
   to this same codebase. This gives true native performance but adds real
   setup time (Visual Studio + Windows SDK for Windows; Xcode for macOS) and
   is worth it only if desktop is a core part of your submission, not a
   checkbox.

For the RevenueCat Shipaton specifically, judging centers on the mobile app
(Android/iOS) — treat the desktop build as a bonus "runs everywhere" polish
item rather than the main deliverable.

---

## 5. Wiring up RevenueCat (for the HAMM / Catvertising categories)

The `PaywallScreen.js` is fully built visually but doesn't process real
payments yet. To connect it:

```bash
npx expo install react-native-purchases
```

Then in `PaywallScreen.js`, replace the "Continue" button's `onPress` with a
call to `Purchases.purchasePackage(selectedPackage)` per RevenueCat's Expo
guide: https://www.revenuecat.com/docs/getting-started/installation/expo

For **Catvertising**, add a rewarded-ad SDK (e.g. Google AdMob via
`expo-ads-admob` successor `react-native-google-mobile-ads`) and gate it
behind a "Watch an ad for 20 extra practice questions" button on the Quiz or
Roadmap screen for free users.

---

## 6. Project structure reference

```
backend/
├── app/
│   ├── main.py            FastAPI app, CORS, router registration
│   ├── database.py        SQLAlchemy engine/session (MySQL)
│   ├── models.py          User, Roadmap, RoadmapDay, QuizAttempt
│   ├── schemas.py         Pydantic request/response models
│   ├── auth.py            JWT auth, password hashing
│   ├── ai_service.py      Roadmap/quiz generation (offline + pluggable LLM)
│   └── routers/
│       ├── auth_router.py
│       ├── roadmap_router.py
│       ├── quiz_router.py
│       └── progress_router.py
├── schema.sql
├── requirements.txt
└── .env.example

mobile/
├── App.js                 Navigation stack
├── app.json                Expo config (name, bundle IDs, icons)
├── src/
│   ├── api/client.js       Axios instance + token storage
│   ├── theme/colors.js     Design tokens
│   ├── components/         ProgressBar, StreakBadge, PrimaryButton
│   └── screens/            Onboarding, Register, Login, GoalSetup,
│                            Roadmap, Lesson, Quiz, Dashboard, Materials, Paywall
```

## 7. Troubleshooting

- **"Network Error" in the app** → backend isn't running, or
  `EXPO_PUBLIC_API_URL` in `mobile/.env` is pointing at the wrong host (see
  3.2 — physical devices need your LAN IP, not `localhost`).
- **MySQL connection refused** → XAMPP's MySQL isn't started, or `.env`
  credentials don't match your XAMPP setup.
- **`ModuleNotFoundError` on backend start** → you didn't activate the venv
  before `pip install`, or forgot `pip install -r requirements.txt`.
- **Expo Go can't find the app / times out on scan** → phone and computer
  must be on the *same* Wi-Fi network; some corporate/public Wi-Fi blocks
  this — use a personal hotspot instead.
