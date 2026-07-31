# Changelog & Version History

All notable architectural refactoring, bug fixes, and performance enhancements for **JeevaLink Blood Donation Management System** are documented in this file.

---

## [2.0.0-REFACTORED] - 2026-07-31

### Architectural Improvements & Refactoring
- **Clean Architecture Implementation**:
  - Introduced `App\Traits\ApiResponse` for standardized JSON contracts (`success`, `message`, `data`, `errors`).
  - Extracted inline controller validation into dedicated Form Request classes (`RegisterRequest`, `LoginRequest`, `CreateBloodRequest`).
  - Added Repository Pattern interfaces and Eloquent implementations (`UserRepositoryInterface`, `EloquentUserRepository`, `RepositoryServiceProvider`).

- **Frontend Bundle Optimization & Code Splitting**:
  - Implemented React dynamic route code-splitting with `React.lazy()` and `<Suspense fallback={<PageLoader />}>` in `App.jsx`.
  - Added Rollup `manualChunks` configuration in `vite.config.js` to split vendor libraries (`vendor-react`, `vendor-icons`, `vendor-motion`, `vendor-maps`, `vendor-charts`).
  - Reduced main bundle size from **1.73 MB** down to small page-specific chunks (**3 kB - 42 kB**), eliminating chunk size warnings.

- **ESLint Code Quality & Bug Fixes**:
  - Resolved **80 ESLint errors** down to **0 errors**.
  - Fixed runtime reference error `openEditModal is not defined` in `UserManagement.jsx`.
  - Fixed duplicate keys (`role`, `updateUnitSquadStatus`) in `appStore.js`.
  - Fixed undefined role booleans (`isVolunteer`, `isHospitalOrAdmin`) in `CompleteProfile.jsx`.
  - Removed unused imports, dead variables, and unused state declarations across all components.

- **Codebase Cleanup**:
  - Removed junk/debug scratch files in `backend/`: `check_admin.php`, `run_schema.php`, `test_login.php`, `getColumns('users'))`, `getContent())`, `test.png`, `.phpunit.result.cache`.

---

## [1.0.0] - Initial Release

- Initial baseline launch of JeevaLink Blood Donation Portal.
- Monolithic single bundle React client.
- Direct donor phone search and static request feed.
