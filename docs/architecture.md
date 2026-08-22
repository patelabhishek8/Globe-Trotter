# GlobeTrotter — Architecture Documentation

## 1. Architectural Overview
GlobeTrotter is built with a decoupled, high-performance client-server architecture:
- **Frontend**: Single Page Application (SPA) built using React 18, TypeScript, Vite, Tailwind CSS, Lucide icons, and Recharts.
- **Backend**: Asynchronous REST API developed using Python 3.12, FastAPI, SQLAlchemy 2.0 ORM, and Pydantic v2 data contracts.
- **Database Layer**: Dual-mode engine supporting SQLite (zero-config local run) and MySQL 8.0 (production and Docker deployments).
- **Containerization**: Multi-stage Docker builds with Docker Compose orchestration.

## 2. Directory Structure
```
GlobeTrotter/
├── backend/
│   ├── app/
│   │   ├── api/          # REST route handlers (auth, trips, cities, etc.)
│   │   ├── auth/         # JWT and password hashing middleware
│   │   ├── database/     # Session management and seed engine
│   │   ├── models/       # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/      # Pydantic v2 schemas
│   │   ├── services/     # Budget, image, conflict & recommendation services
│   │   └── main.py       # FastAPI application entrypoint
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Atomic UI library and specialized cards
│   │   ├── context/      # AuthContext & NotificationContext
│   │   ├── layouts/      # AppLayout (Sidebar + Header) and responsive shell
│   │   ├── pages/        # 12+ required application screens
│   │   ├── services/     # Typed API client
│   │   ├── types/        # TypeScript interfaces
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── database/
│   └── schema.sql        # MySQL relational schema
├── docs/
│   ├── architecture.md
│   └── api.md
├── docker-compose.yml
├── README.md
└── .env.example
```

## 3. Core Engine Mechanics

### Dynamic Budget Engine
Calculates budget using the formula:
$$\text{Estimated Total} = \text{Transport} + \text{Accommodation} + \text{Activities} + \text{Food} + \text{Other Expenses}$$
- Accommodation and food computed dynamically based on the trip's `travel_style` tier (Budget, Standard, Premium, Luxury) and length of stay.
- Dynamic comparison against `overall_budget`, generating exact overbudget alert warnings and highlighting the primary category responsible.

### Time-Slot Conflict Detection
Scans scheduled activities within identical calendar dates and detects temporal overlaps:
$$\text{Start}_1 < \text{End}_2 \quad \text{and} \quad \text{Start}_2 < \text{End}_1$$
Emits structured human-readable warnings: e.g. *"These activities overlap from 2:00 PM to 3:00 PM."*

### Rule-Based Recommendation Engine
Scores destinations based on user interests, budget tier, and regional popularity, attaching explicit explanations to each card (e.g. *"Recommended because you selected History + Culture"*).
