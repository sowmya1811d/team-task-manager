# TaskFlow — Team Task Manager

TaskFlow is a full-stack web application that helps teams organize and 
manage their work efficiently. Users can sign up, create projects, and 
collaborate with team members. Admins have full control to create tasks, 
assign them to members, set priorities and deadlines, and manage the team. 
Members can view and update the status of their assigned tasks. The 
dashboard provides a real-time overview of task progress, overdue items, 
and workload distribution across the team.

---

## 🚀 Live Demo

> **Deployed URL:** `https://team-task-manager-production-7501.up.railway.app`


---

## 📸 Features

- **Authentication** — JWT-based signup/login with password hashing
- **Projects** — Create projects; creator auto-becomes Admin; add/remove members
- **Tasks** — Create tasks with title, description, due date, priority; assign to members; track with Kanban board
- **Dashboard** — Total tasks, tasks by status, tasks per user, overdue count
- **Role-Based Access** — Admins manage everything; Members update only their assigned tasks
- **Responsive UI** — Works on desktop and mobile

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite, Axios |
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deployment | Railway |

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── config/database.js      # DB init & schema
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   └── taskController.js
│   │   ├── middleware/auth.js       # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   └── tasks.js
│   │   └── index.js                # Express server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   └── ProjectDetail.jsx
│   │   ├── components/layout/
│   │   ├── utils/api.js
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
├── railway.toml
├── nixpacks.toml
└── README.md
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/sowmya1811d/team-task-manager.git
cd team-task-manager
```

### 2. Set up the Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set your JWT_SECRET
npm install
npm run dev
# Server starts at http://localhost:5000
```

### 3. Set up the Frontend

```bash
cd frontend
npm install
npm run dev
# App starts at http://localhost:5173
```

The frontend Vite dev server proxies `/api` requests to `localhost:5000`.

---

## 🚢 Deployment on Railway

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/sowmya1811d/team-task-manager.git
git push -u origin main
```

### Step 2 — Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository

### Step 3 — Configure Environment Variables

In Railway Dashboard → your service → **Variables**, add:

| Variable | Value |
|---|---|
| `JWT_SECRET` | `your-random-secret-here-make-it-long` |
| `NODE_ENV` | `production` |
| `DB_PATH` | `/data` |
| `PORT` | `5000` |

### Step 4 — Add Persistent Storage (for SQLite)

1. In Railway, go to your service → **Volumes**
2. Click **"Add Volume"**
3. Mount path: `/data`

### Step 5 — Deploy

Railway auto-deploys on every push. The `nixpacks.toml` handles:
- Building the React frontend
- Starting the Express backend (which serves the frontend in production)

Your app will be available at `https://your-service.railway.app`

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | List all users |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List my projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| DELETE | `/api/projects/:id` | Delete project (admin) |
| POST | `/api/projects/:id/members` | Add member (admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (admin) |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/dashboard` | Dashboard stats |
| POST | `/api/tasks` | Create task (admin) |
| GET | `/api/tasks/project/:id` | Get project tasks |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (admin) |

---

## 🔐 Role-Based Access

| Action | Admin | Member |
|---|---|---|
| Create/delete tasks | ✅ | ❌ |
| Update task details | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks only) |
| Add/remove members | ✅ | ❌ |
| View all project tasks | ✅ | ❌ (own only) |
| Delete project | ✅ | ❌ |

---

## 🗃️ Database Schema

```sql
users          (id, name, email, password, created_at)
projects       (id, name, description, created_by, created_at)
project_members(id, project_id, user_id, role, joined_at)
tasks          (id, title, description, status, priority, due_date,
                project_id, assigned_to, created_by, created_at, updated_at)
```

---

## 👤 Author

**Manasa Sowmya Dasari**

Built as a full-stack coding assignment demonstrating:
- RESTful API design
- JWT authentication
- SQLite with proper foreign keys
- React with Context API
- Role-based access control
- Railway deployment
