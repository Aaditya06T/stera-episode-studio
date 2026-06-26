# Engineering Decisions — Stera Episode Studio

## Overview
This document explains the key engineering decisions, trade-offs, and design choices made while building the Stera Episode Studio full-stack application. The focus of this project was not feature completeness, but **clarity of architecture, robustness, and engineering judgment under constraints**.

---

## 1. Backend Framework Choice — FastAPI

FastAPI was chosen over Node.js or Flask due to:

- Native async support for handling long-running processing tasks
- Simple integration with Python-based ML/SDK pipeline
- Automatic API validation and type hints
- Lightweight setup suitable for take-home assignments

Trade-off:
- Less scalable than a full distributed system, but sufficient for local processing workflows.

---

## 2. Frontend Choice — React (Vite)

React with Vite was selected because:

- Fast development and hot module replacement
- Component-based architecture fits dynamic recording cards
- Easy state handling for process tracking UI

Trade-off:
- Minimal state management (no Redux) to avoid overengineering

---

## 3. Processing Architecture — Synchronous Backend Execution

The SDK pipeline runs synchronously inside the FastAPI endpoint.

Reasoning:
- SDK is not guaranteed to be async-safe
- Keeps implementation simple and deterministic for evaluation
- Avoids complexity of task queues (Celery, Redis)

Trade-off:
- Blocking behavior during processing
- Not suitable for production scale workloads

---

## 4. Progress Tracking — Polling (not WebSockets)

Polling was chosen instead of WebSockets because:

- Simplicity and reliability for take-home scope
- Avoids maintaining persistent connections
- Easier debugging and deterministic behavior

Trade-off:
- Slight delay in UI updates vs real-time streaming

---

## 5. Data Storage — SQLite (or minimal persistence approach)

SQLite was used for simplicity:

- Lightweight and file-based
- No external dependencies
- Sufficient for storing processing state and metadata

Trade-off:
- Not suitable for concurrent distributed writes at scale

---

## 6. Handling of `.mcap` Files

`.mcap` files are never loaded in the frontend.

They are:

- Processed entirely on backend via SDK
- Streamed internally by MCAPReader
- Kept out of memory-heavy frontend operations

Reasoning:
- Prevents browser overload
- Maintains privacy and performance boundaries

---

## 7. Privacy and PII Handling

All face blurring happens server-side before export.

- Raw frames are never sent to frontend
- Only processed (blurred) outputs are exposed

This ensures:
- No exposure of sensitive user data
- Compliance with expected privacy constraints

---

## 8. File Serving Strategy — FastAPI Static Mount

Processed outputs (video, mesh, thumbnails) are served via:

- FastAPI `StaticFiles` mounted at `/output`

Reasoning:
- Simple and direct file access
- No need for separate storage service

Trade-off:
- Not optimized for CDN or large-scale streaming

---

## 9. Caching Strategy — Prevent Reprocessing

If output directory already exists:

- The backend skips processing
- Returns cached result metadata

Benefit:
- Saves computation time
- Improves responsiveness

---

## 10. Error Handling Strategy

- Backend uses HTTP exceptions for controlled failures
- Frontend captures and displays error messages per recording

Trade-off:
- No global retry system or advanced recovery logic

---

## 11. Why No Job Queue System

A queue system (Celery / Redis) was intentionally avoided because:

- Scope is a take-home assignment
- SDK execution is sequential and not distributed
- Simplicity and readability were prioritized

---

## 12. Key Design Philosophy

The entire system follows:

> "Simple, explainable, and debuggable over complex and scalable"

Focus areas:
- Clear data flow
- Minimal abstraction layers
- Easy-to-review backend logic
- Transparent SDK integration

---

## Conclusion

This project prioritizes:
- Engineering clarity over optimization
- Practical trade-offs over theoretical scalability
- Debuggability over abstraction

It demonstrates the ability to:
- Integrate external SDKs
- Design a full-stack system
- Make informed trade-offs under constraints