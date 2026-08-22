# GlobeTrotter — Personalized Smart Travel Planning Platform

GlobeTrotter is a desktop-first smart travel planning platform built to simplify the complexity of planning multi-city journeys across India. It empowers travelers to discover destinations, construct day-by-day conflict-free itineraries, dynamically manage estimated budgets with category charts, and share or clone community trips with a single click.

---

## 🌟 Key Highlights & Features

- **India-First Verified Destination Data**: Pre-seeded with 30+ major Indian cities (Jaipur, Udaipur, Jodhpur, Jaisalmer, Ahmedabad, Mumbai, Delhi, Goa, Varanasi, Agra, Bengaluru, Srinagar, Amritsar, etc.) and 80+ realistic authentic activities with genuine Unsplash photography.
- **3-Pane Itinerary Builder (Screen 5)**:
  - *Left Pane*: Drag/reorder multi-city stops (e.g. Ahmedabad → Udaipur → Jaipur → Jodhpur → Jaisalmer) with transit modes (Train, Flight, Bus, Car) and costs.
  - *Center Pane*: Day tabs with scheduled activities, time slots, and smart time-conflict detection warnings.
  - *Right Pane*: Live budget summary gauge and category cost monitor.
- **Dynamic Budget Engine & Recharts Analytics (Screen 9)**:
  - Formula: $\text{Estimated Total} = \text{Transport} + \text{Accommodation} + \text{Activities} + \text{Food} + \text{Other}$
  - Interactive Donut category chart and Daily expenditure Bar chart.
  - Overbudget alerts attributing the primary contributing cost category.
- **Community Hub & 1-Click Trip Copy (Screen 10 & Public Route)**:
  - Discover public community travel plans.
  - Public read-only routes (`/shared-trip/:token`).
  - 1-click **"Copy Trip to My Account"** cloning full stop routes and day activities.
- **Smart Rule-Based Recommendations**:
  - Transparent explanations (e.g., *"Recommended because you selected History + Culture"*).
- **Admin Analytics Dashboard (Screen 12)**:
  - Metrics for Total Users, Trips, Cities, and Activities.
  - Interactive platform growth charts and CRUD management for cities & activities.

---

## 🚀 Quick Start (Local Development)

### 1. Start the Backend API (FastAPI)
```bash
# In the root folder:
pip install -r backend/requirements.txt
python -m backend.app.database.seed
python -m uvicorn backend.app.main:app --reload --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Start the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Open Web Application: [http://localhost:5173](http://localhost:5173)

---

## 🐳 Docker Deployment

To launch the complete production stack (MySQL 8.0 + FastAPI + Nginx React Frontend):

```bash
docker-compose up --build
```
- Web Application: [http://localhost](http://localhost) (or [http://localhost:5173](http://localhost:5173))
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 👤 Pre-Seeded Demo Accounts

| Role | Email | Password | Pre-seeded Features |
|---|---|---|---|
| **Demo Traveler** | `demo@globetrotter.local` | `Demo@12345` | Flagship **"Rajasthan Explorer"** 7-day trip (Ahmedabad → Udaipur → Jaipur → Jodhpur → Jaisalmer) with full schedule, stops, and budget analytics. |
| **Demo Admin** | `admin@globetrotter.local` | `Admin@12345` | Full administrative control, user directory, and destination management. |

---

## 📐 Project Structure

```
GlobeTrotter/
├── backend/
│   ├── app/
│   │   ├── api/            # REST route controllers
│   │   ├── auth/           # JWT & bcrypt security
│   │   ├── database/       # Session & rich seeder
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Dynamic budget & conflict services
│   │   └── main.py         # App entrypoint
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Design system & cards
│   │   ├── context/        # Auth & Notification providers
│   │   ├── layouts/        # AppLayout shell
│   │   ├── pages/          # All 12+ required screens
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript definitions
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── database/
│   └── schema.sql          # Relational MySQL schema
├── docs/
│   ├── architecture.md
│   └── api.md
├── docker-compose.yml
├── README.md
└── .env.example
```
