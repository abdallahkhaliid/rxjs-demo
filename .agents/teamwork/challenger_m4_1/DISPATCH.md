# Dispatch: Challenger M4-1 — HOO Concurrency & Subject Fleets Stress Challenger

## Mission
Adversarially challenge and stress-test the Milestone 4 implementations:
1. HOO Timeline Stress:
   - Challenge `mergeMap` with high concurrency vs `concurrency = 1` (verify identical behavior to `concatMap`).
   - Rapid emission burst: 50+ rapid clicks / emissions without dropped items or corrupted state.
   - Inner error handling: verify inner errors do not crash or permanently freeze outer streams when handled with `catchError`.
   - Cancellation stress: rapid preemption in `switchMap`.
2. Subject Fleet Stress:
   - Late subscriber replay verification: verify late observer subscriptions receive exact buffer items in `ReplaySubject` and latest value in `BehaviorSubject`.
   - Complete vs Error behavior: verify `AsyncSubject` only emits on complete, and stops gracefully.
   - Independent unsubscribe: verify unsubscribing observer 1 does not disrupt observers 2 and 3.
3. Test execution:
   - Run `npx ng test --watch=false --browsers=ChromeHeadless`
   - Run `node tests/e2e/run-all-tests.js --filter="Feature 36"` and `--filter="Feature 37"`

Deliver your verdict (`APPROVE` or `REJECT`) in `handoff.md`.

## 2026-11-06T15:37:37Z
You are challenger_m4_1 (Teamwork Challenger: Concurrency & Fleets Stress Challenger).
Working directory: c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\challenger_m4_1\
Parent conversation ID: eeaaecb4-0936-4b3f-96eb-a9d07aa8df89

MANDATORY USER REQUEST:
Read the authoritative user request at:
c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\ORIGINAL_REQUEST.md

DISPATCH INSTRUCTIONS:
Read c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\challenger_m4_1\DISPATCH.md
And worker handoffs at:
- c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m4_hoo\handoff.md
- c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m4_subjects\handoff.md

SCOPE & CRITERIA TO CHALLENGE:
1. HOO Concurrency & Stress:
   - Challenge `mergeMap` with concurrency limits (including `concurrency = 1` vs `concatMap`).
   - Stress test rapid emission bursts (50+ clicks / emissions).
   - Test inner error propagation and `catchError` resilience.
   - Test rapid preemption and cancellation in `switchMap`.
2. Subject Fleets Stress:
   - Challenge late subscriber replay in `ReplaySubject` and `BehaviorSubject`.
   - Verify `AsyncSubject` only emits on complete.
   - Challenge independent unsubscribes across the 3-observer fleet.
3. Test Execution:
   - Run `npx ng test --watch=false --browsers=ChromeHeadless`
   - Run `node tests/e2e/run-all-tests.js --filter="Feature 36"` and `--filter="Feature 37"`

DELIVERABLE:
Write `handoff.md` to `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\challenger_m4_1\handoff.md` with:
- Observation
- Logic Chain
- Stress Test Evidence
- Conclusion with explicit verdict: `APPROVE` or `REJECT`
- Verification commands and results
Send a message back to the orchestrator (`eeaaecb4-0936-4b3f-96eb-a9d07aa8df89`).
