# JeevaLink V2 - Coding Standards & Guidelines

This document outlines coding standards, SOLID principles, security rules, and architectural patterns required for contributing to JeevaLink V2.

---

## 1. Core Architectural Principles

### SOLID Principles
- **Single Responsibility Principle (SRP)**: Each class/module must have only one reason to change. Controllers process HTTP requests, Services execute domain logic, Repositories execute database queries, Form Requests validate input data.
- **Open/Closed Principle (OCP)**: Software entities should be open for extension, but closed for modification. Extend services or repositories via interfaces rather than modifying core methods directly.
- **Liskov Substitution Principle (LSP)**: Derived repository classes must be substitutable for their interfaces without altering program correctness.
- **Interface Segregation Principle (ISP)**: Keep interfaces small, specialized, and focused on specific domains (e.g. `UserRepositoryInterface`).
- **Dependency Injection (DI)**: Inject dependencies through class constructors or method parameters rather than instantiating classes directly (`new Service()`).

### DRY, KISS, & YAGNI
- **DRY (Don't Repeat Yourself)**: Extract common logic into reusable custom hooks, helpers, or controller traits (`ApiResponse`).
- **KISS (Keep It Simple, Stupid)**: Avoid over-engineering complex patterns when a simple readable function suffices.
- **YAGNI (You Aren't Gonna Need It)**: Do not write speculation code or feature stubs until explicitly required.

---

## 2. Frontend Standards (React & Zustand)

### State Management & Components
1. **Local vs Global State**: Keep UI state (modal visibility, active tabs) inside component `useState`. Store global domain data (users, auth status, active requests) inside Zustand stores (`appStore`, `authStore`).
2. **Code-Splitting**: Always wrap new page routes in `React.lazy()` and `<Suspense fallback={<PageLoader />}>` inside `App.jsx`.
3. **Icons & Styling**: Use `lucide-react` icons. Do not leave unused icon imports in files; run `npm run lint` before committing.
4. **Form Handling**: Use `react-hook-form` paired with `zod` schema validation for user input forms.

---

## 3. Backend Standards (Laravel 12)

### API Responses & Controller Rules
1. **Response Traits**: Controllers MUST use `App\Traits\ApiResponse` for JSON returns:
   - Success: `$this->successResponse($data, $message, 200)`
   - Error: `$this->errorResponse($message, 400, $errors)`
   - Validation Error: `$this->validationError($errors, $message)`
2. **Form Validation**: Extract inline controller `$request->validate()` calls into dedicated Form Request classes under `App\Http\Requests\`.
3. **Database Queries**: Never execute raw SQL without parameter binding. Prefer Eloquent models or Repository classes to prevent SQL Injection.
4. **Error Handling**: Wrap external network calls (e.g. FCM push notifications, email dispatch) inside `try-catch` blocks and log failures gracefully using `Log::error()`.

---

## 4. Verification & Testing Checklist

Before submitting code, ensure:
1. `npm run lint` completes with **0 errors and 0 warnings**.
2. `npm run build` succeeds cleanly with optimal code-splitting chunks (< 500 kB per chunk).
3. All modified PHP files pass `php -l` syntax validation.
