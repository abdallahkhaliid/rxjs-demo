# Survey & Infrastructure Investigation Report (Explorer Survey 1)

## 1. Observation

### 1.1 Project Configuration and Dependencies
- **File**: `package.json` (lines 25-54)
  - Angular core packages: `"^20.3.0"` (`@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/forms`, `@angular/platform-browser`, `@angular/router`).
  - Angular build tools: `"@angular/build": "^20.3.4"`, `"@angular/cli": "^20.3.4"`, `"@angular/compiler-cli": "^20.3.0"`.
  - Reactive library: `"rxjs": "~7.8.0"`.
  - Backend dependencies: `"express": "^5.3.0"`, `"cors": "^2.8.6"`, `"@types/express": "^5.0.6"`, `"@types/cors": "^2.8.19"`, `"ts-node": "^10.9.2"`.
  - TypeScript: `"typescript": "~5.9.2"`.
  - Test tools: `"jasmine-core": "~5.9.0"`, `"karma": "~6.4.0"`, `"karma-chrome-launcher": "~3.2.0"`, `"karma-jasmine": "~5.1.0"`.
  - Scripts:
    - `"start": "ng serve"`
    - `"build": "ng build"`
    - `"watch": "ng build --watch --configuration development"`
    - `"test": "ng test"`
    - `"server": "ts-node -P server/server.tsconfig.json server/server.ts"`
- **Missing Dependency**:
  - `npm list highlight.js` returned code 1 (`-- (empty)`). `highlight.js` is not installed.
  - `@angular/common/http` is present as part of `@angular/common`, but `provideHttpClient()` is not yet configured in `src/app/app.config.ts`.

### 1.2 Angular Build Configuration
- **File**: `angular.json` (lines 17-56)
  - Builder: `@angular/build:application` (Vite/esbuild application builder).
  - Browser entry: `src/main.ts`.
  - Style preprocessor: SCSS (`"style": "scss"`, `"inlineStyleLanguage": "scss"`).
  - Global styles: `src/styles.scss` (currently contains only 1 comment line).
  - Assets: `"input": "public"` containing `favicon.ico`.
  - Production budgets: initial maximumWarning 500kB, maximumError 1MB.

### 1.3 TypeScript Configuration
- **File**: `tsconfig.json` (lines 5-17):
  - `"target": "ES2022"`, `"module": "preserve"`, `"strict": true`, `"isolatedModules": true`.
- **File**: `tsconfig.app.json`:
  - Extends `tsconfig.json`, includes `src/**/*.ts`, excludes `src/**/*.spec.ts`.

### 1.4 Angular Application Architecture & Zoneless Mode
- **File**: `src/app/app.config.ts` (lines 6-12):
  ```typescript
  export const appConfig: ApplicationConfig = {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideRouter(routes)
    ]
  };
  ```
  - `provideZonelessChangeDetection()` is enabled. `zone.js` is not installed or imported.
- **File**: `src/app/app.routes.ts`: `export const routes: Routes = [];` (empty routes).
- **File**: `src/app/app.ts`: Root component `App` (`selector: 'app-root'`), standalone, imports `[RouterOutlet]`.
- **File**: `src/app/app.html`: 343 lines of Angular CLI boilerplate welcome page.
- **File**: `src/about/about.ts`: Orphaned component outside `src/app/`, not routed or referenced in any file.
- **File**: `src/index.html`: Boilerplate HTML without Google Fonts (`Inter`, `JetBrains Mono`).

### 1.5 Express Server Implementation
- **File**: `server/server.ts` (lines 1-28):
  - Express 5.3 app on port 9000 (default fallback `process.env['PORT'] ?? 9000`).
  - Middleware: `app.use(cors())`, `app.use(express.json())`.
  - Endpoints:
    - `GET /` -> returns `{ message: 'REST API is running', endpoints: [...] }`
    - `GET /api/courses/:id` -> handled by `getCourse` (`server/get-course.route.ts`)
    - `PUT /api/courses/:id` -> handled by `saveCourse` (`server/save-course-route.ts`)
    - `GET /api/lessons` -> handled by `searchLessons` (`server/search-lessons.route.ts`)
- **File**: `server/db-data.ts`:
  - Contains `Lesson` interface, `Course` interface, `COURSES` array (3 items), `LESSONS` array (24 items).
- **File**: `server/search-lessons.route.ts` (lines 19-21):
  ```typescript
  const courseId = Number(req.query.courseId);
  ...
  const lessons = LESSONS.filter(
    (lesson) => lesson.courseId === courseId && lesson.description.toLowerCase().includes(filter),
  )
  ```
  - Notice: If `req.query.courseId` is omitted, `courseId` becomes `NaN`. `lesson.courseId === NaN` evaluates to `false`, returning 0 lessons when querying `GET /api/lessons?filter=...` without `courseId`.
- **File**: `server/server.tsconfig.json`:
  - Target `ES2022`, module `commonjs`, `strict: true`, `esModuleInterop: true`.

### 1.6 Verification Commands Executed
- Command: `npx ng build --configuration development`
  - Exit code: `0`.
  - Duration: `12.284s`.
  - Output: `Initial chunk files: main.js (1.38 MB), styles.css (96 bytes). Application bundle generation complete. Output location: dist/rxjs-demo`.
- Command: `npx ts-node --project server/server.tsconfig.json -e "console.log('ts-node works')"`
  - Exit code: `0`.
  - Output: `ts-node works`.
- Command: `npm run server`
  - Exit code: `0`.
  - Output: `REST API running on http://localhost:9000`.
- Command: `npx ng test --watch=false --browsers=ChromeHeadless`
  - Exit code: `1`.
  - Results: 2 passed (`src/app/app.spec.ts`), 1 failed (`src/about/about.spec.ts`).
  - Verbatim error in `src/about/about.spec.ts`:
    `Error: NG0908: In this configuration Angular requires Zone.js` because `src/about/about.spec.ts` did not provide `provideZonelessChangeDetection()` in `TestBed.configureTestingModule()`.

---

## 2. Logic Chain

1. **Build Environment Readiness**:
   - Observation 1.1 & 1.6: `npx ng build --configuration development` builds cleanly without warnings or errors.
   - Observation 1.1: `package.json` contains Angular 20.3.0 and RxJS 7.8.0.
   - Observation 1.1: `npm list highlight.js` confirms highlight.js is not yet installed.
   - *Deduction*: The project workspace is intact and functional, but `npm install highlight.js` must be run before implementing syntax-highlighted code blocks.

2. **Zoneless Change Detection Implications**:
   - Observation 1.4: `provideZonelessChangeDetection()` is configured in `app.config.ts`, and `zone.js` is absent from dependencies.
   - Observation 1.6: Tests missing `provideZonelessChangeDetection()` in `TestBed` trigger `NG0908: In this configuration Angular requires Zone.js`.
   - *Deduction*:
     - In zoneless Angular, standard RxJS async subscriptions (`interval()`, `timer()`, HTTP callbacks) do NOT automatically trigger change detection cycles if state is mutated directly on class properties without Signals.
     - All interactive components should either use Angular Signals (`signal()`, `toSignal(observable$, ...)`, `computed()`), the `async` pipe in templates, or inject `ChangeDetectorRef` and call `cdr.markForCheck()`.
     - All unit tests configuring `TestBed` must include `provideZonelessChangeDetection()` in their `providers` array.

3. **HTTP Client Configuration**:
   - Observation 1.4: `appConfig` provides only global error listeners, zoneless change detection, and router.
   - Observation 1.1: Module 7 and Module 8 require calling the Express backend.
   - *Deduction*: `provideHttpClient(withFetch())` must be added to `appConfig.providers` in `src/app/app.config.ts`.

4. **Express API Requirements & Bug Fix**:
   - Observation 1.5: Express server has endpoints `GET /api/courses/:id`, `PUT /api/courses/:id`, and `GET /api/lessons`.
   - Requirement R2: Preserves existing 3 endpoints, and requires `GET /api/slow?delay=2000` and `GET /api/simulate-error?rate=0.3`.
   - Requirement R4 Mini-Project 1: Search autocomplete queries `GET /api/lessons?filter=...` without necessarily specifying `courseId`.
   - Observation 1.5: `searchLessons` filters `lesson.courseId === courseId`. If `courseId` is missing, `courseId` is `NaN`, returning `[]`.
   - *Deduction*:
     - Add routes `app.get('/api/slow', getSlow);` and `app.get('/api/simulate-error', getSimulateError);` to `server/server.ts`.
     - In `server/search-lessons.route.ts`, check `(!req.query.courseId || isNaN(courseId) || lesson.courseId === courseId)` so searching by filter works globally across lessons when `courseId` is omitted.

5. **Structural Conventions & File Organization**:
   - Observation 1.4: `src/about` is an extraneous scaffolded directory outside `src/app`.
   - Observation 1.2: Global styling uses `src/styles.scss`, assets in `public/`.
   - *Deduction*: All application code belongs strictly under `src/app/`:
     - `src/app/layout/` (shell, sidenav, topbar)
     - `src/app/shared/components/` (reusable widgets: code-block, output-console, marble-diagram, operator-card, comparison-table, playground-wrapper, quiz-block)
     - `src/app/core/` (services: api, search, progress; models)
     - `src/app/features/` (modules 1 through 8 with sub-routes)
     - `src/styles/` (design tokens, color palette, dark theme, typography)

---

## 3. Caveats

- **External UI Libraries**: No third-party UI library (like Angular Material, Tailwind, or Bootstrap) is installed. Per R1, all UI must be hand-crafted with custom SCSS tokens.
- **Port Conflicts**: Express server defaults to port 9000 (`process.env.PORT || 9000`). Angular dev server runs on port 4200. Ensure both ports are free during local development.
- **CORS vs Proxy**: Express has `app.use(cors())`, so direct calls to `http://localhost:9000/api/...` work without browser CORS blocks. Alternatively, a dev proxy (`proxy.conf.json`) can be configured if relative path `/api/...` is preferred.
- **Orphaned `src/about` Directory**: `src/about` currently fails `ng test` due to missing `provideZonelessChangeDetection()`. It can either be updated or removed since it is not part of the R1-R5 platform requirements.

---

## 4. Conclusion

The Angular 20 + Express project is clean, modern, and in working order.

### Actionable Architecture Baseline:
1. **Dependency Installation**: Run `npm install highlight.js` (R1).
2. **HTTP Client Setup**: Register `provideHttpClient(withFetch())` in `src/app/app.config.ts`.
3. **Zoneless Discipline**: All interactive RxJS playgrounds must use `toSignal()`, `async` pipe, or `cdr.markForCheck()` for reactive view updates, and all test files must include `provideZonelessChangeDetection()`.
4. **Server Enhancements**:
   - Add `server/slow.route.ts` (`GET /api/slow?delay=2000`)
   - Add `server/simulate-error.route.ts` (`GET /api/simulate-error?rate=0.3`)
   - Patch `server/search-lessons.route.ts` to make `courseId` optional so autocomplete search functions properly.
5. **Layout & Shared UI**:
   - Load Inter & JetBrains Mono fonts in `src/index.html`.
   - Implement dark theme design system in `src/styles/` with SCSS tokens.
   - Build standalone shared components under `src/app/shared/components/`.
   - Implement shell layout with sidenav & topbar under `src/app/layout/`.
6. **Feature Modules 1-8**: Lazy load 8 feature modules under `src/app/features/` with routes defined in `src/app/app.routes.ts`.

---

## 5. Verification Method

To independently verify the observations and conclusions in this report:

1. **Verify Angular Development Build**:
   ```powershell
   npx ng build --configuration development
   ```
   *Expected result*: Compiles with code `0`, generating bundles in `dist/rxjs-demo`.

2. **Verify Express Server Compilation & Startup**:
   ```powershell
   npx ts-node -P server/server.tsconfig.json server/server.ts
   ```
   *Expected result*: Logs `REST API running on http://localhost:9000`.

3. **Verify Highlight.js Absence**:
   ```powershell
   npm list highlight.js
   ```
   *Expected result*: Empty / exit code 1.

4. **Verify Zoneless Mode in App Configuration**:
   Inspect `src/app/app.config.ts` line 9 to confirm `provideZonelessChangeDetection()`.

5. **Verify Autocomplete Query Issue in `server/search-lessons.route.ts`**:
   Inspect line 20: `lesson.courseId === courseId`. Test with `curl http://localhost:9000/api/lessons?filter=Observable` (returns `lessons: []` because `courseId` is `NaN`).
