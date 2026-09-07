# LANDIA
### National Land Acquisition Intelligence Platform

*Powered by Lanzer AI &nbsp;|&nbsp; Built by ByteXSquad &nbsp;|&nbsp; Smart India Hackathon 2026 — Problem ID: SIH26016*

![Build Status](https://img.shields.io/badge/build-in%20progress-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)
![React](https://img.shields.io/badge/Frontend-React%20%2F%20Next.js-61DAFB?logo=react)
![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F?logo=spring)
![FastAPI](https://img.shields.io/badge/AI%20Service-FastAPI-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-336791?logo=postgresql)
![Python](https://img.shields.io/badge/AI-Python%20%2B%20Scikit--learn-3776AB?logo=python)

---

## The Problem

Land acquisition in India is a critical bottleneck for infrastructure delivery, plagued by four systemic failures:

1. **Fragmented Data** — Land records, cadastral maps, ownership registrations, compensation data, and R&R records exist in isolated departmental silos with no unified view across agencies.
2. **Manual Parcel Identification** — Identifying which land parcels intersect a proposed infrastructure corridor is done manually, making the process slow, error-prone, and impossible to scale.
3. **No Pre-Acquisition Simulation** — Authorities have no way to model or compare the impact of different corridor alignments before committing to one, leading to costly post-decision disputes and reversals.
4. **Inconsistency and Delays** — Mismatches in ownership, area measurements, and payment records across systems cause legal challenges, project stalls, and administrative overhead that can delay projects by years.

---

## Solution

LANDIA is a National Land Acquisition Intelligence Platform that transforms fragmented, multi-agency land data into a unified, GIS-powered intelligence layer. It automates parcel identification via PostGIS spatial queries, simulates acquisition corridor scenarios as a real-time Digital Twin, and provides evidence-backed decision support through Lanzer AI — enabling faster planning, transparent acquisition workflows, and early detection of data inconsistencies before they become disputes.

The platform's operational backbone is **GAMS (Geospatial Acquisition Management System)** — a 7-phase lifecycle tracking system that moves a project from initial corridor planning through R&R completion, with role-based dashboards, automated alerts, and a full audit trail at every stage.

---

## Core Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Multi-Source Integration** | Ingest and unify land records from DILRMP, municipal, revenue, cadastral, and satellite sources into a single data layer |
| 2 | **GIS Parcel Identification** | PostGIS-powered spatial queries automatically identify all land parcels intersecting a proposed corridor — with affected area, land type, and ownership data |
| 3 | **Pre-Acquisition Impact Analysis** | Calculate R&R impact, displaced family count, estimated compensation, utility disruption, and environmental screening before any commitment is made |
| 4 | **Acquisition Digital Twin** | Real-time corridor simulation — adjust width, alignment, or route and instantly see the effect on land area, cost, families displaced, and acquisition complexity |
| 5 | **Data Reconciliation** | Automated cross-system conflict detection for ownership mismatches, area discrepancies, and payment inconsistencies across all integrated data sources |
| 6 | **End-to-End Monitoring (GAMS)** | 7-phase acquisition lifecycle tracking with role-based dashboards, document versioning, deadline alerts, and full audit trails |
| 7 | **Lanzer AI** | Embedded NLP-based intelligence engine — answers natural-language queries ("Which parcels are at risk?", "Why is Phase 3 delayed?"), performs risk scoring, and generates explainable decision-support reports |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Next.js, Leaflet / OpenLayers (interactive maps) |
| Backend | Spring Boot (core services), Node.js (auth, notifications), FastAPI (AI service) |
| Database | PostgreSQL + PostGIS (land records, cadastral GIS data, project data) |
| AI / Analytics | Python, Scikit-learn — Lanzer AI engine, risk and delay prediction models |
| Maps / GIS | OpenStreetMap tiles, QGIS export support, PostGIS spatial queries |
| Document Management | Secure versioned storage with audit trail |
| Integrations | Government APIs, DILRMP, land registries, financial systems |
| DevOps | GitHub, Docker (planned) |

---

## GAMS — Acquisition Lifecycle

```
Phase 1          Phase 2          Phase 3          Phase 4
Plan Project  →  Identify Land →  Analyze Impact → Decision
                                                       ↓
Phase 7          Phase 6          Phase 5
Predict       ←  Monitor       ←  Acquisition
```

| Phase | Name | What Happens |
|-------|------|-------------|
| 1 | **Plan Project** | Define project scope, draw proposed corridor, set buffer zone and acquisition width |
| 2 | **Identify Land** | PostGIS spatial query returns all candidate parcels — affected area, land type, owner records |
| 3 | **Analyze Impact** | Calculates R&R cost, displaced families, utility impact, environmental screening, risk scores |
| 4 | **Decision** | Compare route options (A vs B), officer reviews Lanzer AI recommendations for lower-impact/lower-cost routes |
| 5 | **Acquisition** | Legal lifecycle: Proposal → Verification → Approval → Notification → Award → Compensation → Possession → R&R → Closure |
| 6 | **Monitor** | Real-time progress tracking, deadline alerts, document versioning, inter-department approvals |
| 7 | **Predict** | Lanzer AI forecasts delays, bottlenecks, risk escalation — answerable via natural-language queries |

---

## Architecture Overview

LANDIA is organized into four logical modules that communicate via REST APIs and WebSocket:

```
+-------------------------------+    +--------------------------------+
|  Frontend (Next.js / React)   |    |  Lanzer AI Service (FastAPI)   |
|  Leaflet / OpenLayers Maps    |    |  NLP Engine + Risk Scorer      |
+---------------+---------------+    +----------------+---------------+
                |   REST API / WebSocket               |
+---------------v----------------------------------------------v------+
|                        Backend Services                             |
|     Spring Boot (Core)      |      Node.js (Auth / Notifications)  |
+---------------+----------------------------------------------+------+
                |
+---------------v----------------------------------------------+
|         PostgreSQL + PostGIS                                  |
|   Parcel Data | Project Data | Compensation | Documents       |
+---------------------------------------------------------------+
```

**Modules:**
1. **Data Ingestion & Reconciliation** — multi-source import, schema mapping, conflict detection
2. **GIS & Spatial Analysis** — PostGIS parcel queries, Digital Twin corridor simulation
3. **Decision & Workflow (GAMS)** — 7-phase lifecycle engine, role-based dashboards, alerts
4. **Lanzer AI Intelligence** — NLP query engine, risk scoring, explainable decision support

---

## User Roles

| Role | Access & Responsibilities |
|------|--------------------------|
| **Project Authority** | Create projects, initiate acquisition corridors, view Digital Twin simulations, submit route decisions |
| **District Officer** | Manage parcel records for their district, update acquisition phase status, handle objections and documents |
| **State / Central Officer** | Cross-district dashboard oversight, inter-department approvals, audit trail review, performance monitoring |

---

## Getting Started

> **Note: Code modules are under active development. The steps below are placeholder setup instructions and will be finalized as each module is built. See [CONTRIBUTING.md](CONTRIBUTING.md) for the git workflow.**

### Prerequisites

- Node.js 20+
- Java 21+ (for Spring Boot)
- Python 3.11+
- PostgreSQL 15+ with PostGIS extension
- Git

### Clone

```bash
git clone https://github.com/victorsimon25/landia.git
cd landia
```

### Database Setup

```bash
psql -U postgres -c "CREATE DATABASE landia;"
psql -U postgres -d landia -c "CREATE EXTENSION postgis;"
```

### Environment

```bash
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, OPENSTREETMAP_TILE_URL
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```

### AI Service (Lanzer AI)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Team — ByteXSquad

| Name | Role | GitHub |
|------|------|--------|
| — | — | — |
| — | — | — |
| — | — | — |
| — | — | — |
| — | — | — |
| — | — | — |

*Team members to be listed here.*

---

## SDGs Addressed

- **SDG 9 — Industry, Innovation and Infrastructure:** AI-driven infrastructure planning reduces project delays and enables data-backed route decisions.
- **SDG 11 — Sustainable Cities and Communities:** Transparent, simulation-first acquisition planning enables more equitable and lower-impact land use decisions.
- **SDG 16 — Peace, Justice and Strong Institutions:** Unified digital records, full audit trails, and automated reconciliation reduce disputes and improve accountability in public land acquisition.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.
