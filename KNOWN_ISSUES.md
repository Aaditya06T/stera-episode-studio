# Known Issues — Stera Episode Studio

This document lists known limitations and trade-offs in the current implementation.

These are intentional or scope-related and do not affect core functionality.

---

## 1. No Background Job Queue

Processing runs synchronously inside the FastAPI endpoint.

Impact:
- API is blocked while processing runs
- Not suitable for concurrent users or production scale

Reason:
- Kept simple for take-home assignment scope
- SDK is not guaranteed async-safe

---

## 2. Large File Handling

Some `.mcap` files and ML dependencies are large and not optimized for Git or deployment.

Impact:
- Repository size can be large if not properly ignored
- Initial push required cleanup of `venv/` and datasets

Mitigation:
- `.gitignore` excludes `venv/`, `recordings/`, and outputs

---

## 3. No Authentication System

The application has no login or user management.

Impact:
- All recordings are publicly accessible in the app

Reason:
- Not required for assignment scope
- Focus is on processing pipeline and architecture

---

## 4. Basic UI / Minimal Styling

Frontend UI is functional but not heavily styled.

Impact:
- No advanced UX animations or dashboards

Reason:
- Prioritized engineering clarity over UI polish

---

## 5. No Real-Time Progress Streaming

Processing status is updated via request-response (no WebSockets).

Impact:
- UI updates only after polling or request completion

Reason:
- Simplified architecture for reliability and easier debugging

---

## 6. SDK Dependency Constraints

The processing pipeline depends on an external alpha-stage SDK.

Impact:
- Behavior may vary depending on SDK version
- Limited control over internal processing steps

Mitigation:
- Wrapped SDK calls in a controlled pipeline function

---

## 7. Static File Serving Limitations

Processed outputs are served via FastAPI static mounting.

Impact:
- Not optimized for CDN or large-scale streaming
- Basic file serving only

---

## 8. No Distributed Scaling

The system runs as a single backend instance.

Impact:
- Not horizontally scalable

Reason:
- Scope is a local full-stack engineering assignment

---

## 9. Error Handling is Minimal

Errors are handled at endpoint level and displayed in UI.

Impact:
- No retry mechanism or centralized logging system

---

## 10. Git Workflow Limitation (Submission Constraint)

During development, due to initial environment and dependency issues (large SDK artifacts, venv contamination, and Git authentication/setup problems), the repository could not be incrementally pushed in a clean step-by-step commit flow as originally intended.

Impact:
- Final commit history is less granular than ideal
- Some early work appears consolidated rather than incremental

Mitigation:
- Codebase was still developed incrementally locally with verified step-by-step testing
- Final repository reflects cleaned and functional state of the system
- Architecture and decision-making are documented separately in `DECISIONS.md`

---

## Summary

These limitations are intentional and reflect design decisions made to:

- Keep the system simple and reviewable
- Focus on SDK integration and full-stack flow
- Prioritize engineering clarity over production complexity
