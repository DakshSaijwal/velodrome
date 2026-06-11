# Deploying Velodrome to Production

You'll deploy the backend to Railway and frontend to Vercel. Both have free tiers and take ~15 minutes total.

---

## Prerequisites

- GitHub account (for deploying)
- All local tests passing (run through SETUP.md first)

---

## Part 1: Deploy Backend to Railway

### 1. Push code to GitHub

```bash
cd typeracer
git init
git add .
git commit -m "initial velodrome commit"
git remote add origin https://github.com/YOUR_USERNAME/velodrome.git
git push -u origin main
```

(Create the repo on github.com first if you haven't)

### 2. Sign up on Railway

Go to [railway.app](https://railway.app), sign up with GitHub, authorize it.

### 3. Create a new project

- Click **New Project**
- Select **Deploy from GitHub repo**
- Authorize and pick your `velodrome` repo

### 4. Configure the service

Railway will auto-detect and ask what to deploy. Tell it to deploy from the `/backend` folder:
- In the Railway dashboard, go to your service
- **Settings** → **Root Directory** → set to `backend`

### 5. Set environment variables

In Railway dashboard → your backend service → **Variables** tab:

```
PORT=3001
CLIENT_URL=https://velodrome.vercel.app
NODE_ENV=production
```

(You'll fill in the vercel URL in Part 2 — for now, just put a placeholder)

### 6. Get your backend URL

Railway → your service → **Networking** → **Generate Domain**

Copy the URL (looks like `velodrome-backend.up.railway.app`). You'll need this for the frontend.

---

## Part 2: Deploy Frontend to Vercel

### 1. Go to Vercel

Visit [vercel.com](https://vercel.com), sign up with GitHub, authorize it.

### 2. Import your repo

- Click **Add New Project**
- Select your GitHub repo
- Vercel auto-detects it's a monorepo

### 3. Configure the build

In the import dialog:
- **Framework Preset:** Vite (auto-detected)
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 4. Add environment variable

Before deploying, click **Environment Variables**:

```
VITE_SERVER_URL=https://velodrome-backend.up.railway.app
```

(Use the Railway backend URL from Part 1, Step 6)

### 5. Deploy

Click **Deploy**. Vercel builds and deploys. You'll get a URL like `velodrome.vercel.app`.

### 6. Update Railway's CLIENT_URL

Go back to Railway → backend service → **Variables**:

Change:
```
CLIENT_URL=https://velodrome.vercel.app
```

**Redeploy** the backend (Railway does this automatically, or manually trigger from **Deployments** tab).

---

## Part 3: Test the live game

1. Open https://velodrome.vercel.app in your browser
2. **Time Trial** → run a solo race
3. **Grand Prix** → generate a room code and share with a friend
4. Both of you join the same code and race live

---

## Customization

### Custom domain

On Vercel → your project → **Settings** → **Domains**, add your own domain (e.g., `typeracer.com`).

### Database (leaderboard persistence)

Right now the leaderboard is in-memory, so it resets when the backend restarts. To add MongoDB:

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. In Railway → Variables, add: `MONGODB_URI=mongodb+srv://...`
4. Redeploy

---

## Your resume link

Once deployed, your live game is at: **https://velodrome.vercel.app**

Add this to your GitHub README and resume under "Projects":

```
**Velodrome** — Multiplayer typing race game  
[Live Demo](https://velodrome.vercel.app) | [GitHub](https://github.com/YOUR_USERNAME/velodrome)  
Real-time multiplayer with Socket.io, ghost racer replays, per-key analytics. React + Node.js + Canvas.
```

---

## Monitoring

- **Frontend:** Vercel Dashboard → Deployments (redeploys on push to main)
- **Backend:** Railway Dashboard → Logs tab (see server output)

Both auto-redeploy when you push to GitHub.

---

## Updating after deploy

Make a change locally, test it, then:

```bash
git add .
git commit -m "my change"
git push origin main
```

Both Vercel and Railway automatically detect the push and redeploy.
