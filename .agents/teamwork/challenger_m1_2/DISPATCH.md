# DISPATCH — Challenger 2: Milestone 1

## Role
Backend & Edge-Case Challenger

## Working Directory
c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\challenger_m1_2\

## Authoritative Inputs
- User Request: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\ORIGINAL_REQUEST.md`
- Master Project Specification: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\PROJECT.md`
- Worker M1 Report: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m1\handoff.md`

## Adversarial Challenge Scope
Empirically stress-test the Express API endpoints and integration services:
1. `GET /api/slow`:
   - Boundary tests: `delay=-1000` (should clamp to >=0), `delay=99999` (should clamp to max 15000), `delay=abc` (NaN fallback), `delay=0` (immediate return).
   - Tag tracking: ensure custom tag is preserved in JSON response.
   - Concurrent calls: fire 5 simultaneous requests with varying delays to verify non-blocking event-loop execution.
2. `GET /api/simulate-error`:
   - Boundary tests: `rate=-0.5` (clamp to 0.0, 100% success), `rate=1.5` (clamp to 1.0, 100% failure), `rate=abc` (fallback to 0.3).
   - Statistical distribution test: Fire 100 requests at `rate=0.3` and measure empirical failure frequency (expected ~20%-40%).
   - Custom `statusCode` test: `statusCode=503` (verify response code is 503).
3. `GET /api/lessons`:
   - Query without `courseId`: `filter=Angular` (must return matching lessons across all courses).
   - Special characters: `filter=%20`, `filter=xyznonexistent` (should return 200 with empty array, not crash).
4. Existing routes regression test:
   - `GET /api/courses/1`, `PUT /api/courses/1` (must function without regressions).
5. Deliver empirical verdict: **APPROVE** or **REQUEST_CHANGES** based on concrete test evidence.
6. Write handoff report to `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\challenger_m1_2\handoff.md`.


## 2026-11-05T21:32:32Z
You are Challenger 2 for Milestone 1 (Backend & Edge-Case Challenger).
Your working directory is: c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\challenger_m1_2\
Read your dispatch at: c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\challenger_m1_2\DISPATCH.md
Read the authoritative user request at: c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\ORIGINAL_REQUEST.md
Read the master project specification at: c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\PROJECT.md
Read Worker M1 report at: c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m1\handoff.md

Challenge tasks:
1. Empirically stress-test Express server endpoints (`/api/slow`, `/api/simulate-error`, `/api/lessons` search filter, regression on existing `/api/courses/:id`).
2. Test parameter boundaries (negative, zero, extreme values, NaN), concurrency, and statistical distribution of simulated error rates.
3. Issue empirical verdict: APPROVE or REQUEST_CHANGES.
4. Write report to `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\challenger_m1_2\handoff.md` and send a message when done.
