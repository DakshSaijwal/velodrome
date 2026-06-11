# Running Velodrome Locally

## Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org))
- **npm** v9+ (comes with Node.js)
- **Git** (optional, for version control)

Verify installation:
```bash
node --version    # v18.17.0 or higher
npm --version     # 9.8.1 or higher
```

---

## Step 1: Extract & navigate

```bash
# Unzip the velodrome.zip file you downloaded
unzip velodrome.zip
cd typeracer

# Or if you cloned from GitHub
git clone https://github.com/yourusername/velodrome.git
cd velodrome
```

---

## Step 2: Start the backend (terminal 1)

```bash
cd backend

# Copy the example environment file
cp .env.example .env

# Install dependencies (first time only)
npm install

# Start the server
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
```

The backend is now listening on port 3001.

---

## Step 3: Start the frontend (terminal 2)

Open a **new terminal** in the project root:

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

You should see something like:
```
VITE v5.x.x  ready in 123 ms

➜  Local:   http://localhost:5173/
```

---

## Step 4: Open in browser

Click or paste: **http://localhost:5173**

You should see the Velodrome home screen with options for **Time Trial** (solo) and **Grand Prix** (multiplayer).

---

## Testing Solo Mode

1. Click **Time Trial**
2. Optionally pick a difficulty: words, +punctuation, or +numbers
3. Click **Start engine →**
4. Countdown from 3…2…1…GO
5. Type the passage as fast & accurately as you can
6. 60 seconds, race ends, see your stats + WPM chart

---

## Testing Multiplayer (Same Computer)

1. **Window 1:** Home → Grand Prix → Host Room → *copy the 4-letter code*
2. **Window 2:** Open new private browser window or incognito, go to http://localhost:5173
3. Home → Grand Prix → Join Room → *paste the code* → Join
4. Window 1: once both players are in the lobby, click **Start Race →**
5. Both see the same countdown, same passage, and watch each other's cars move in real-time

---

## Testing Multiplayer (With a Friend)

You'll need to expose your local server to the internet. The easiest ways:

### Option A: ngrok (5 minutes)

1. **Install ngrok:** https://ngrok.com/download
2. **Expose backend:**
   ```bash
   ngrok http 3001
   ```
   You'll get a URL like: `https://abc123-45-67-89.ngrok.io`

3. **Expose frontend:**
   Open another terminal:
   ```bash
   ngrok http 5173
   ```
   You'll get another URL

4. **Configure frontend** to point to the ngrok backend URL:
   - Edit `frontend/.env` (or create it):
     ```
     VITE_SERVER_URL=https://abc123-45-67-89.ngrok.io
     ```
   - Restart the frontend dev server

5. **Share with friend:** Give them the ngrok frontend URL from step 3. They open it, you both play.

### Option B: Same Local WiFi (requires same network)

1. Find your local IP:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```
   Look for something like `192.168.1.100`

2. Edit `frontend/.env`:
   ```
   VITE_SERVER_URL=http://192.168.1.100:3001
   ```

3. Restart frontend dev server

4. Friend connects to: `http://192.168.1.100:5173`

---

## Stopping the servers

Press `Ctrl+C` in each terminal.

---

## Troubleshooting

### Port already in use
If you get "EADDRINUSE" error:
- **Port 3001 taken?** Change in `backend/.env`: `PORT=3002`
- **Port 5173 taken?** Change in `frontend/vite.config.js`: `port: 5174`

### "Cannot find module" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend can't reach backend
- Make sure backend is running on http://localhost:3001
- Check `frontend/.env` has `VITE_SERVER_URL=http://localhost:3001`
- Restart frontend after editing `.env`

### Stats/leaderboard not persisting
They're stored in localStorage by default. Open DevTools (F12 → Application/Storage → Local Storage). If it's empty, you need to complete at least one race.

---

## Next: Deploy to production

Once everything works locally, follow [DEPLOY.md](./DEPLOY.md) to put it on Railway + Vercel.
