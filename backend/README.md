# ProcuGuard — Smart Procurement & Vendor Monitoring System

> Full-stack web app: Node.js + Express + MongoDB + Plain HTML/CSS/JS

---

## Project Structure

```
procuguard/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Vendor.js
│   │   └── Request.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vendors.js
│   │   ├── requests.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── seed.js
│   ├── .env
│   └── package.json
└── frontend/
    └── index.html
```

---

## Setup & Run

### 1. Prerequisites
- Node.js v18+ installed
- MongoDB running locally (`mongod`) OR MongoDB Atlas URI

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/procuguard
JWT_SECRET=procuguard_super_secret_jwt_key_2024
JWT_EXPIRE=7d
```
For MongoDB Atlas, replace MONGO_URI with your cluster connection string.

### 4. Seed the database (optional but recommended)
```bash
cd backend
node seed.js
```
This creates sample admin, users, vendors, and requests.

### 5. Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

### 6. Open the app
Visit: **http://localhost:5000**

---

## Demo Credentials (after seeding)

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@procuguard.com   | admin123  |
| User  | jane@company.com       | user123   |
| User  | ravi@company.com       | user123   |

---

## API Endpoints

### Auth
| Method | Endpoint          | Access  | Description        |
|--------|-------------------|---------|--------------------|
| POST   | /api/auth/register | Public  | Register new user  |
| POST   | /api/auth/login    | Public  | Login, get JWT     |
| GET    | /api/auth/me       | Private | Get current user   |

### Vendors
| Method | Endpoint         | Access     | Description      |
|--------|------------------|------------|------------------|
| GET    | /api/vendors     | Private    | List all vendors |
| POST   | /api/vendors     | Admin only | Add vendor       |
| PUT    | /api/vendors/:id | Admin only | Edit vendor      |
| DELETE | /api/vendors/:id | Admin only | Delete vendor    |

### Requests
| Method | Endpoint                  | Access     | Description          |
|--------|---------------------------|------------|----------------------|
| GET    | /api/requests             | Private    | Get requests (role-filtered) |
| POST   | /api/requests             | Private    | Create new request   |
| PUT    | /api/requests/:id/approve | Admin only | Approve request      |
| PUT    | /api/requests/:id/reject  | Admin only | Reject request       |
| DELETE | /api/requests/:id         | Admin only | Delete request       |

### Users
| Method | Endpoint       | Access     | Description  |
|--------|----------------|------------|--------------|
| GET    | /api/users     | Admin only | List users   |
| DELETE | /api/users/:id | Admin only | Remove user  |

---

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT (jsonwebtoken) + bcryptjs password hashing
- **Security**: Role-based access control (RBAC), protected routes

---

## Features
- ✅ JWT Authentication (Login / Register)
- ✅ Role-based access: Admin vs User
- ✅ User can create procurement requests
- ✅ Admin can approve / reject requests
- ✅ Vendor management (add, view, delete)
- ✅ Admin user management
- ✅ Dashboard with stats
- ✅ Filter requests by status
- ✅ Toast notifications
- ✅ Responsive dark UI
