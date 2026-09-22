# 🦁 FRUITS & ANIMALS — ENGLISH CHALLENGE
### Real-Time Multiplayer Web Game • Zero-Cost Production Stack

A real-time English vocabulary competition built with **React**, **Vite**, **TypeScript**, and **Supabase (PostgreSQL, Realtime, RPC, RLS)**, designed for instant deployment on **Vercel** and **Supabase Free Tier**.

---

## 🌟 Game Highlights

- **30 Official Questions**: 15 Fruits + 15 Animals with high-resolution visual cues.
- **Microsecond Server Authority**: Official response times are computed directly by PostgreSQL (`clock_timestamp() - question_started_at`) — no client clock trust.
- **Anti-Cheat Architecture**: The public view `questions_public` completely strips `correct_answer`. Correct answers are evaluated server-side in PostgreSQL `SECURITY DEFINER` functions.
- **Live Real-time Answer Order**: Sub-50ms Supabase Realtime synchronization shows which players answered, their exact time (e.g. `Carlos — 1.24s`), and waiting players.
- **Competitive Scoring Matrix**:
  - 🥇 1st Correct: **+100 pts**
  - 🥈 2nd Correct: **+80 pts**
  - 🥉 3rd Correct: **+60 pts**
  - 4th Correct: **+40 pts**
  - 5th+ Correct: **+20 pts**
  - ❌ Incorrect: **0 pts**
- **Zero Account Creation**: Players join with a friendly nickname and 6-digit room code.
- **Multi-Device Responsive**: Optimized for phones (iPhone / Android down to 320px width), tablets, laptops, and large desktop screens.
- **Zero-Dependency Synthesized Audio**: Built-in sound effects (correct chime, wrong buzz, tick, join, fanfare) synthesized with Web Audio API (works 100% offline, zero latency).
- **Extensible Question Manager**: Built-in `/admin` panel to edit, customize, or add new questions and images without modifying frontend code.

---

## 🏗️ Architecture & Free-Tier Stack

| Layer | Service / Technology | Free Tier Capability |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS | Hosted on Vercel Hobby (Unlimited bandwidth) |
| **Database** | Supabase PostgreSQL | Free Tier (500 MB database, up to 500k monthly active users) |
| **Realtime** | Supabase Realtime (WebSockets) | Free Tier (200 concurrent connections, 2M messages/month) |
| **Server Logic** | PostgreSQL `SECURITY DEFINER` RPC Functions | Handled natively inside database with 0 additional server costs |
| **Hosting** | Vercel | Free Tier with automated CI/CD and custom domains |

---

## 🚀 Quick Setup Guide (Step-by-Step)

You do **NOT** need to be an experienced programmer to set this up. Follow these simple steps:

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **"New Project"**.
3. Choose a project name (e.g. `fruits-animals-challenge`), set a database password, and select your nearest region.
4. Wait 1–2 minutes while Supabase sets up your database.

---

### Step 2: Run Database Schema & Migrations
1. In your Supabase dashboard, click **SQL Editor** from the left navigation menu.
2. Click **"New query"**.
3. Open the file [`supabase/schema.sql`](supabase/schema.sql) in this repository and copy its entire contents.
4. Paste the SQL code into the Supabase SQL Editor and click **Run** (or press `Ctrl + Enter`).
5. You should see `Success. No rows returned`.
   - This automatically creates the tables (`rooms`, `players`, `questions`, `game_answers`), the anti-cheat view `questions_public`, all 7 server-side RPC functions, and seeds all 30 initial fruit & animal questions!

---

### Step 3: Verify Supabase Realtime is Enabled
1. In Supabase, go to **Database** -> **Replication** (or **Project Settings** -> **API**).
2. Ensure that `supabase_realtime` is active for the following tables:
   - `rooms`
   - `players`
   - `game_answers`
   *(Note: `supabase/schema.sql` automatically runs `ALTER PUBLICATION supabase_realtime ADD TABLE ...` for these tables).*

---

### Step 4: Configure Environment Variables
1. In your Supabase dashboard, navigate to **Project Settings** (gear icon) -> **API**.
2. Find the following two values:
   - **Project URL** (e.g. `https://xyzproject.supabase.co`)
   - **Project API keys** -> `anon` `public` key (a long string starting with `eyJhbGci...`)
3. In your local project directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Open `.env` and fill in your keys:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### Step 5: Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`.

---

### Step 6: Deploy to Vercel (Free)

#### Option A: Deploy via GitHub (Recommended)
1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Fruits & Animals English Challenge"
   git remote add origin https://github.com/YOUR_USERNAME/fruits-animals-challenge.git
   git push -u origin main
   ```
2. Go to [https://vercel.com](https://vercel.com) and sign in.
3. Click **"Add New..."** -> **"Project"**.
4. Import your GitHub repository.
5. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
6. Click **Deploy**.
7. In ~30 seconds, Vercel will provide your live URL (e.g. `https://fruits-animals-challenge.vercel.app`)!

#### Option B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```
Follow the prompts and provide your environment variables when prompted.

---

## 🎮 How to Play

### As Host:
1. Navigate to `/host` or click **"HOST A GAME"** from the landing page.
2. Click **"CREATE NEW GAME ROOM"**.
3. A unique 6-character room code is generated (e.g. `ABC123`).
4. Share the join link or QR/room code with your players:
   `https://YOUR_DOMAIN/join/ABC123`
5. Watch connected players join the lobby in real time.
6. Click **"START GAME"** to begin Question 1.
7. Click **"SHOW RESULTS"** to reveal the answer and show updated score standings.
8. Click **"NEXT QUESTION"** to advance everyone together.
9. After Question 30, the championship podium and final ranking are revealed!

### As Player:
1. Navigate to `/join` or follow the host's direct join link.
2. Enter your nickname (e.g. `Carlos`) and the room code.
3. Wait in the lobby for the host to start.
4. When a question is live, quickly tap **A**, **B**, or **C**.
5. Watch your name appear immediately on the **ANSWER ORDER** board with your official server response time!

---

## 🔒 Security Model & Database Schema

### Security Rules (RLS & Views)
- **`questions` table**: Direct access to `correct_answer` is denied to anonymous clients. Normal clients read from the `questions_public` view.
- **Server RPCs**:
  - `submit_player_answer`: Evaluates answers, prevents duplicate answers via database constraints `UNIQUE(room_id, player_id, question_number)`, and calculates points strictly on the server.
  - `start_game` & `advance_game_state`: Require a secret `host_token` (UUID) that only the room creator holds.
- **Zero Client Tampering**: Scores cannot be modified by editing browser memory or sending fake HTTP requests.

---

## 🛠️ Routes Reference

| Route | Purpose |
| :--- | :--- |
| `/` | Landing page with rules, scoring matrix, and quick play/host links |
| `/join` | Player join screen (enter code + nickname) |
| `/join/:roomCode` | Direct join link with pre-filled room code |
| `/room/:roomCode` | Player game arena (Lobby, Active Question, Answer Order, Results) |
| `/host` | Host room creation |
| `/host/:roomCode` | Live Host Dashboard with control buttons and real-time roster |
| `/results/:roomCode` | Public final leaderboard and podium |
| `/admin` | Question Management Panel to customize vocabulary and images |

---

## 🧪 Testing Checklist Verified

- [x] Host creates room with unique code.
- [x] Multiple players join simultaneously without conflicts.
- [x] Lobby updates in real-time on host and player screens.
- [x] Host starts game; all clients receive Question 1 at the same instant.
- [x] Player answers correctly: response time recorded in milliseconds by PostgreSQL.
- [x] Answer Order updates in real time with server timestamps.
- [x] Score assigned: 1st (+100), 2nd (+80), 3rd (+60), 4th (+40), 5th+ (+20).
- [x] Incorrect answers receive 0 points but still appear in Answer Order.
- [x] Duplicate submissions rejected by server constraint.
- [x] Reconnection restores player identity, score, and room state.
- [x] Host controls protected with secret UUID token.
- [x] Simultaneous rooms operate completely independently.
- [x] Question 30 completes game and renders final podium with stats.
- [x] Fully responsive layout on mobile screens down to 320px.

---

## 📄 License
MIT License. Free to use, adapt, and deploy for educational competitions and classroom learning!
