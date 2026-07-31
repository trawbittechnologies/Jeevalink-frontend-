# JeevaLink V2 - Folder Structure Guidelines

This document provides a directory breakdown and file placement rules for developers extending JeevaLink V2.

---

## 1. Directory Tree & Placement Rules

### `src/` (Frontend React Architecture)
```
src/
├── assets/                  # Shared styling & design system tokens
│   ├── App.css              # Baseline resets
│   ├── index.css            # Tailwind CSS v4 root stylesheet
│   └── jl-landing.css       # Custom Landing page typography & gradients
├── components/              # UI Components
│   ├── admin/               # Reusable Admin components (Table, FilterBar, ConfirmModal)
│   ├── BottomNav.jsx        # Mobile bottom navigation bar
│   ├── CameraCapture.jsx    # WebRTC live camera photo capture
│   ├── DonorCard.jsx        # Donor profile card
│   ├── Footer.jsx           # Global footer component
│   ├── Header.jsx           # Public top header
│   ├── JeevaLinkLogo.jsx    # SVG / Image logo component
│   ├── MapContainer.jsx     # Leaflet map container component
│   ├── Navbar.jsx           # Global navbar with role badges
│   ├── PosterModal.jsx      # Canvas Blood Request poster builder
│   ├── RequestCard.jsx      # Blood Request card UI
│   ├── SOSButton.jsx        # One-Tap SOS action button
│   └── Toast.jsx            # Toast notification container
├── layouts/                 # Page Wrapper Layouts
│   ├── DashboardLayout.jsx  # Authenticated sidebar + topbar shell
│   └── PublicLayout.jsx     # Public navbar + footer shell
├── pages/                   # Page Components
│   ├── admin/               # Admin sub-dashboards (Technical, Super, Block)
│   ├── volunteer/           # Volunteer sub-pages (UserManagement, UnitCommittee)
│   └── [PageName].jsx       # Top-level lazy-loaded pages
└── store/                   # State Management
    ├── api.js               # Axios instance with JWT interceptor & storage URL builder
    ├── appStore.js          # Core domain Zustand state (requests, donors, users, toasts)
    └── authStore.js         # Authentication & user profile Zustand state
```

### `backend/` (Backend Laravel Architecture)
```
backend/
├── app/
│   ├── Helpers/             # Utility classes (JWT, Password generators)
│   ├── Http/
│   │   ├── Controllers/     # API Controllers (AuthController, RequestController, etc.)
│   │   ├── Middleware/      # JwtAuth & JwtRole Middlewares
│   │   └── Requests/        # Form Request validation classes
│   ├── Models/              # Eloquent models (User, BloodRequest, Complaint, etc.)
│   ├── Providers/           # Service providers (RepositoryServiceProvider)
│   ├── Repositories/        # Repository interfaces & Eloquent implementations
│   ├── Services/            # Business logic services (Firebase, FCM, Matching)
│   └── Traits/              # Shared traits (ApiResponse)
├── config/                  # App, Auth, Database, Mail configuration files
├── database/                # Migrations & Database Seeders
└── routes/
    └── api.php              # API route declarations grouped under /v1
```

---

## 2. File Naming Conventions

- **React Components / Pages**: Use `PascalCase` (e.g. `UserManagement.jsx`, `DonorCard.jsx`).
- **Store & Utility Files**: Use `camelCase` (e.g. `authStore.js`, `api.js`).
- **Laravel PHP Classes**: Use `PascalCase` (e.g. `AuthController.php`, `EloquentUserRepository.php`).
- **Laravel Database Tables / Models**: Singular `PascalCase` for Models (`User.php`), plural `snake_case` for database tables (`users`, `blood_requests`).
