# TIL Distribution Network

> **Grid monitoring & loss analytics**  
> Sotex Solutions Hackathon 2026 · 🏆 1st place · Team TIL (Teodora Aleksic & Lenka Nikolic)

A full-stack platform for monitoring an electricity distribution network — built on top of a real-world dataset from the Federal Capital Territory (FCT), Abuja, Nigeria. The system detects energy losses, identifies theft suspects, maps dead zones, and provides dispatchers with a live operational dashboard.

---

## What It Does

| Feature | Description |
|---|---|
| **Network map** | All 11kV feeders rendered as color-coded polylines on a Leaflet map (green / yellow / red / grey by status) |
| **Theft detection** | Automatic scoring of distribution substations by current imbalance across 3 phases — HIGH / MEDIUM / LOW risk |
| **Dead zone detection** | Substations with no meters or meters that stopped reporting — instantly visible on the map |
| **Network metrics** | Total consumption (MW), losses (%), imbalance, offline feeders, registered vs. unregistered consumers |
| **24h charts** | Per-feeder hourly time series of voltage, current and active meter count — opens on click |
| **Auto-refresh** | APScheduler refreshes all staging tables every 5 minutes — no manual intervention needed |

---

## Architecture

```
┌─────────────────────┐     HTTP / REST      ┌──────────────────────┐
│   Angular 21        │ ◄──────────────────► │   FastAPI (Python)   │
│   Leaflet maps      │                      │   6 endpoints        │
│   Canvas charts     │                      │   APScheduler        │
└─────────────────────┘                      └──────────┬───────────┘
                                                        │ SQLAlchemy
                                             ┌──────────▼────────────┐
                                             │   SQL Server (MSSQL)  │
                                             │   4 staging tables    │
                                             │   4 stored procedures │
                                             │   5 critical indexes  │
                                             └───────────────────────┘
```

---

## Repository Structure

```
├── back/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py          # App entry point, CORS, lifespan
│   │   ├── config.py        # Settings from .env
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── scheduler.py     # APScheduler — 5 min refresh
│   │   ├── models/          # ORM models (staging tables)
│   │   ├── repositories/    # DB queries
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── schemas/         # Pydantic response schemas
│   │   └── services/        # Business logic & mappings
│   └── requirements.txt
│
├── front/                   # Angular 21 frontend
│   └── src/app/
│       ├── components/      # map, sidebar, header, chart, feeder-panel
│       ├── services/        # NetworkService (RxJS BehaviorSubjects)
│       └── models/          # TypeScript interfaces
│
└── db/
    └── migrations/
        ├── 001_indexes.sql            # Critical indexes (26M+ rows)
        ├── 002_staging_tables.sql     # 4 staging tables
        ├── 003_refresh_procedures.sql # Stored procedures
        └── 004_exec_query.sql         # Utility
```

---

## Prerequisites

- **Python** 3.11+
- **Node.js** 20+ and **npm** 11+
- **SQL Server** (MSSQL) with the source dataset loaded
- **ODBC Driver 17 (or 18) for SQL Server** installed on the machine running the backend

---

## Database Setup

Run the migration scripts **in order** against your SQL Server instance:

```bash
sqlcmd -S <server> -d <database> -i db/migrations/001_indexes.sql
sqlcmd -S <server> -d <database> -i db/migrations/002_staging_tables.sql
sqlcmd -S <server> -d <database> -i db/migrations/003_refresh_procedures.sql
```

Or open them in SSMS and execute manually.

---

## Backend Setup

```bash
cd back
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the `back/` directory:

```env
DB_CONNECTION_STRING=mssql+pyodbc://<user>:<password>@<server>/<database>?driver=ODBC+Driver+17+for+SQL+Server
```

For Windows Authentication:

```env
DB_CONNECTION_STRING=mssql+pyodbc://@<server>/<database>?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

- API: `http://localhost:8000/api`
- Interactive docs: `http://localhost:8000/docs`

---

## Frontend Setup

```bash
cd front
npm install
npm start
```

App runs at `http://localhost:4200`.

> If you change the backend port, update the base URL in `front/src/app/services/network.service.ts`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/feeders/status` | All feeders with status and Angular CSS class |
| `GET` | `/api/feeders/metrics` | Aggregated network metrics for the sidebar |
| `GET` | `/api/feeders/alerts` | Prioritized alert list with human-readable messages |
| `GET` | `/api/feeders/{id}/chart` | 24h hourly time series for a single feeder |
| `GET` | `/api/map/` | All map points — dead zones + theft suspects with GPS |
| `GET` | `/api/theft-alerts/` | HIGH-risk substations for the inspection list |

---

## Theft Detection Logic

Current imbalance between phases A, B, and C is computed as:

```
Imbalance = (max(Ī_A, Ī_B, Ī_C) - min(Ī_A, Ī_B, Ī_C)) / avg(Ī_A, Ī_B, Ī_C) × 100%
```

Risk classification:
- **HIGH** — imbalance > 50%
- **MEDIUM** — imbalance > 25%
- **LOW** — everything else

Only substations with all 3 phases active and more than 50 readings are included, filtering out noise from inactive meters.

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) 0.136
- [SQLAlchemy](https://www.sqlalchemy.org/) 2.0
- [APScheduler](https://apscheduler.readthedocs.io/) 3.11
- [pyodbc](https://github.com/mkleehammer/pyodbc) 5.3
- [Pydantic](https://docs.pydantic.dev/) 2.13

**Frontend**
- [Angular](https://angular.dev/) 21
- [Leaflet](https://leafletjs.com/) 1.9
- [RxJS](https://rxjs.dev/) 7.8
- Canvas API (charts — no external charting library)

**Database**
- Microsoft SQL Server (MSSQL)

---

## License

Built for Sotex Solutions Hackathon 2026. Not intended for production use without additional security hardening.
