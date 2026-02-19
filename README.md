# Follow Activities

Activity tracking system to register and monitor project activities with user management and analytics dashboard.

## Features
- User authentication and registration (JWT-based)
- Multi-role user management (many-to-many)
- Project-based activity tracking
- Hours and task registration
- KPI Dashboard (hours by team, project, and role) with weekly/monthly filters

## Technology Stack
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Angular 17 (standalone) + Tailwind CSS + Chart.js
- **Database**: AWS RDS PostgreSQL

## Prerequisites
- Node.js 18+
- PostgreSQL (AWS RDS or local)
- npm 9+

## Setup Instructions

### Database

1. Create a PostgreSQL database named `follow_activities`
2. Run the migration script:
   ```bash
   psql -U <user> -d follow_activities -f backend/migrations/001_initial_schema.sql
   ```

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and JWT secret.

4. Start the development server:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000`.

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:4200`.

4. Build for production:
   ```bash
   npm run build
   ```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Users (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create a user |

### Projects (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create a project |

### Activities (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activities` | List all activities |
| POST | `/api/activities` | Create an activity |

### Dashboard (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/hours-by-team?period=week\|month` | Hours per team |
| GET | `/api/dashboard/hours-by-project?period=week\|month` | Hours per project |
| GET | `/api/dashboard/hours-by-role?period=week\|month` | Hours per role |

## Environment Variables

See `backend/.env.example` for all required environment variables.

## Project Structure

```
follow-activities/
├── backend/           # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/    # Database connection
│   │   ├── controllers/
│   │   ├── middleware/ # Auth & validation
│   │   ├── models/    # TypeScript interfaces
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.ts
│   ├── migrations/    # Database migration SQL
│   └── .env.example
└── frontend/          # Angular 17 standalone app
    └── src/
        └── app/
            ├── core/  # Guards, interceptors, services
            ├── features/ # Login, register, activities, projects, dashboard
            └── shared/ # Models, navbar, layout
```
