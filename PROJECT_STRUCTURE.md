# JeevaLink V2 - Enterprise Project Structure & Architectural Overview

## 1. High-Level Architecture

JeevaLink V2 is built as a modern full-stack web application with a decoupled Architecture:
- **Frontend Layer**: Built with React 19, Vite, Tailwind CSS, Framer Motion, Recharts, Leaflet Maps, and Zustand State Management.
- **Backend Layer**: Built with Laravel 12, PHP 8.2+, MySQL, JWT Authentication, and RBAC Middleware.
- **API & Data Access**: Clean Architecture following Repository Pattern, Service Pattern, and Form Request Validation.

```
                  +-----------------------------------+
                  |         Client Tier               |
                  |  React 19 / Vite / Tailwind CSS   |
                  +-----------------+-----------------+
                                    |
                                    | REST API / JWT
                                    v
                  +-----------------+-----------------+
                  |         Backend Tier              |
                  |     Laravel 12 API Gateway        |
                  +-----------------+-----------------+
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
            v                       v                       v
  +------------------+    +------------------+    +-------------------+
  | Controller Layer |    |   Service Layer  |    |  Repository Layer |
  +------------------+    +------------------+    +-------------------+
                                                            |
                                                            v
                                                  +-------------------+
                                                  |   MySQL Database  |
                                                  +-------------------+
```

---

## 2. Directory Architecture Map

```
jeevalink/
├── backend/                        # Laravel 12 Core Backend
│   ├── app/
│   │   ├── Helpers/                # Custom helper classes (JWT, Password generators)
│   │   ├── Http/
│   │   │   ├── Controllers/        # API Controllers (AuthController, RequestController, etc.)
│   │   │   ├── Middleware/         # JWT Auth & Role Authorization Middlewares
│   │   │   └── Requests/           # Form Request Validation Classes
│   │   ├── Models/                 # Eloquent Models (User, BloodRequest, Complaint, etc.)
│   │   ├── Providers/              # Service Providers (RepositoryServiceProvider, etc.)
│   │   ├── Repositories/           # Repository Interfaces & Eloquent Implementations
│   │   ├── Services/               # Business Logic Services (FCM, Notification, etc.)
│   │   └── Traits/                 # Shared Controller Traits (ApiResponse)
│   ├── config/                     # Application & Package Configurations
│   ├── database/                   # Migrations & Seeders
│   ├── routes/                     # API routes (v1 prefix with JWT RBAC groups)
│   └── storage/                    # Uploads, Posters, and Certificates Storage
│
├── public/                         # Public Static Web Assets (Logos, Icons)
├── src/                            # React 19 Frontend Codebase
│   ├── assets/                     # Styles, CSS Tokens, Custom Landing CSS
│   ├── components/                 # Atomic & Molecule UI Components
│   │   ├── admin/                  # Admin Table, FilterBar, ConfirmModal
│   │   ├── DonorCard.jsx           # Donor Card UI Component
│   │   ├── RequestCard.jsx         # Emergency/Standard Blood Request Card
│   │   ├── PosterModal.jsx         # Canvas Blood Request Poster Generator
│   │   └── SOSButton.jsx           # One-Tap Emergency SOS Trigger
│   ├── layouts/                    # Layout Shells (PublicLayout, DashboardLayout)
│   ├── pages/                      # Application Page Components (Lazy Loaded)
│   │   ├── admin/                  # Technical, Super, & Block Admin Sub-dashboards
│   │   └── volunteer/              # Volunteer Management & Unit Committee Pages
│   ├── store/                      # Zustand State Stores (authStore, appStore, api)
│   └── App.jsx                     # Root Router with Code-Splitting & Suspense
│
├── package.json                    # Frontend Package Configuration & Scripts
├── vite.config.js                  # Vite Config with Rollup Manual Chunk Splitting
└── composer.json                   # Backend PHP Dependencies
```

---

## 3. Core Architectural Patterns

### A. Clean Architecture & Separation of Concerns
- **Controllers** handle HTTP request parsing and response formatting via the `ApiResponse` trait.
- **Form Requests** validate incoming input payloads before hitting business logic.
- **Services** encapsulate multi-step domain logic (e.g., matching donors, calculating distance, generating credentials).
- **Repositories** abstract raw Eloquent database operations into reusable interfaces.

### B. Role-Based Access Control (RBAC) Hierarchy
- **Level 1: Technical Admin** — System metrics, Super Admin management, activity logs.
- **Level 2: Super Admin** — District-wide scope, Block Admin creation, district reports.
- **Level 3: Block Admin** — Block-wide scope, Volunteer management, feedback handling.
- **Level 4: Volunteer** — Meghala-wide scope, User verification, blood request approval.
- **Level 5: Unit Squad** — Unit-wide scope, member creation, local donor coordination.
- **Level 6: User / Donor** — Profile editing, blood request submission, complaint reporting.
