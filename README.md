# The Urban Open — Full-Stack Tournament System
## Lab Task 13 | Web Application & Services

---

## ▶️ HOW TO RUN (2 steps)

### Step 1 — Install Python dependencies (one time)
```bash
pip install flask flask-cors
```

### Step 2 — Start the server
```bash
python server.py
```
Then open: **http://localhost:5000**

---

## 📋 DATABASE SCHEMA — SQLite (tournament.db)

**Table:** `registrations`

| Field           | Type    | Notes                          |
|----------------|---------|--------------------------------|
| id             | INTEGER | PRIMARY KEY AUTOINCREMENT      |
| player_name    | TEXT    | NOT NULL                       |
| game_id        | TEXT    | NOT NULL, must be unique       |
| team_name      | TEXT    | NOT NULL                       |
| wallet         | TEXT    | MetaMask wallet address        |
| payment_method | TEXT    | DEFAULT 'MetaMask'             |
| payment_status | TEXT    | DEFAULT 'Paid'                 |
| tx_hash        | TEXT    | Blockchain transaction hash    |
| registered_at  | TEXT    | ISO datetime string            |

---

## 🔗 API ENDPOINTS (CRUD)

| Method | Endpoint                      | Operation |
|--------|-------------------------------|-----------|
| POST   | /api/registrations            | CREATE — Register new player |
| GET    | /api/registrations            | READ ALL — Get all players   |
| GET    | /api/registrations/<id>       | READ ONE — Get single player |
| PUT    | /api/registrations/<id>       | UPDATE — Edit player details |
| DELETE | /api/registrations/<id>       | DELETE — Remove player       |
| GET    | /api/admin/stats              | ADMIN — Tournament stats     |

---

## 📄 PAGES

- `index.html` — Home page
- `registration.html` — Player registration (Fetch API → backend)
- `admin.html` — **Admin Panel** (full CRUD management)
- `leaderboard.html` — Leaderboard
- `players.html` — Player profiles
- `schedule.html` — Tournament schedule
- `contact.html` — Contact

---

## ⚙️ TECH STACK

- **Backend:** Python Flask
- **Database:** SQLite (tournament.db — auto-created)
- **Frontend:** HTML/CSS/JS with Fetch API
- **Web3:** MetaMask + ethers.js v6
- **Wallet:** MetaMask (Sepolia Testnet)

---

## 🚂 DEPLOYING TO RAILWAY

This project is Railway-ready. It includes:
- `requirements.txt` — Python dependencies (Flask, Flask-Cors, gunicorn)
- `Procfile` — tells Railway to run `gunicorn server:app`
- `server.py` — reads the `PORT` env var Railway injects automatically

**Note:** Railway's filesystem is ephemeral — the SQLite `tournament.db` file will reset on every redeploy. For persistent data across deploys, attach a Railway Volume mounted at the project directory, or migrate to Railway's managed PostgreSQL.
