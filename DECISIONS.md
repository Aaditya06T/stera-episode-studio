```md
# Engineering Decisions — Stera Episode Studio

## Overview

This document explains the key engineering decisions, trade-offs, and system design choices made while building Stera Episode Studio. The focus is on **clear architecture, safe handling of large sensor data, and practical engineering judgment under constraints**, rather than over-engineering for scale.

---

## 1. Architecture Overview

The system follows a simple full-stack pipeline:

```

Frontend (React + Vite)
↓
FastAPI Backend (Python)
↓
Background Processing (Threaded Execution)
↓
Stera SDK Pipeline (MCAP → Processing → QC)
↓
Output Storage (/backend/output)
↓
FastAPI Static File Serving (/output)

```

### Key idea:
Keep the system **linear, debuggable, and locally reproducible**, avoiding distributed complexity.

---

## 2. Core Design Decisions (and Rejected Alternatives)

### 2.1 Backend Choice — FastAPI

**Chosen because:**
- Native Python integration with ML SDK
- Simple async + sync hybrid support
- Lightweight and fast to iterate

**Rejected alternatives:**
- Flask → Too minimal, required more manual structure
- Node.js → Poor fit for ML-heavy Python SDK pipeline

---

### 2.2 Frontend — React (Vite)

**Chosen because:**
- Fast iteration speed
- Component-based UI fits recording cards + process states
- Simple state management with hooks

**Rejected alternatives:**
- Redux → Overkill for this scope
- Next.js → Unnecessary SSR complexity

---

### 2.3 Processing Model — Synchronous SDK Execution in Background Thread

**Chosen approach:**
- SDK pipeline runs in a background thread inside FastAPI

**Why:**
- SDK is not guaranteed async-safe
- Keeps execution deterministic
- Avoids external infrastructure dependencies

**Rejected alternatives:**
- Celery + Redis → Too heavy for take-home scope
- Async event loop processing → Risky with blocking SDK calls

---

### 2.4 Progress Tracking — Polling

**Chosen because:**
- Simple and reliable
- No persistent connection management
- Easy to debug in interview setting

**Rejected:**
- WebSockets → unnecessary complexity for linear processing flow

---

### 2.5 Data Storage — Lightweight Persistence

**Approach:**
- Minimal state tracking (cached output directory existence)
- SQLite-ready design (optional extension)

**Rejected:**
- Full database schema design → not required for scope

---

### 2.6 File Handling Strategy (.mcap)

**Key rule:**
- `.mcap` files are NEVER loaded into frontend

**Backend-only processing ensures:**
- Memory safety
- Data integrity
- Separation of concerns

---

### 2.7 Output Handling — Static File Serving

**Approach:**
- FastAPI `StaticFiles` mounted at `/output`

**Why:**
- Direct access to processed assets
- No extra storage layer required

**Rejected:**
- S3 / external storage → unnecessary for local system
- Custom file server → redundant complexity

---

## 3. Data-Grounded Engineering Judgments

### 3.1 Malformed or Missing Recordings

**Strategy:**
- Validate `.mcap` existence before processing
- Skip or fail fast on invalid directories

**Why:**
- Prevents SDK crashes
- Keeps pipeline predictable

---

### 3.2 Large File & Memory Management

**Strategy:**
- Frame-by-frame processing via SDK iterator
- No full video buffering in memory
- Lazy directory scanning

**Why:**
- Prevents memory spikes with large recordings
- Supports arbitrarily large `.mcap` inputs

---

### 3.3 PII & Privacy Safety

**Strategy:**
- Face blurring occurs entirely on backend before export
- Raw frames are never exposed via API

**Why:**
- Prevents accidental leakage of sensitive visual data
- Ensures frontend only receives processed outputs

---

### 3.4 SDK Instability Handling

**Observed risk:**
- SDK is alpha and may behave inconsistently

**Mitigation:**
- Fail-fast error propagation
- No silent error suppression
- Output validation via file existence checks

---

### 3.5 File Ingestion Strategy

**Strategy:**
- Only scan metadata + file existence
- Do NOT parse `.mcap` during listing phase

**Why:**
- Avoids expensive IO operations
- Keeps dashboard responsive

---

## 4. AI Tool Usage & Verification

### Where AI tools were used:
- Boilerplate structure for FastAPI + React integration
- Debugging Git issues (large file contamination, SSH setup)
- README and documentation drafting
- Architectural refinement and trade-off articulation

### How outputs were verified:
- All AI-generated code was manually reviewed
- SDK pipeline tested independently using real `.mcap` files
- Backend endpoints validated via direct API calls
- Frontend behavior verified through browser dev tools (network + console)

---

## 5. What I Would Do With One More Day

- Add real progress streaming (instead of polling)
- Improve UI with loading skeletons and transitions
- Add retry mechanism for failed SDK runs
- Introduce structured logging for pipeline debugging
- Add basic test suite for API endpoints
- Improve type safety across frontend components

---

## 6. What Was Intentionally Cut

- No distributed job queue (Celery/Redis)
- No authentication system
- No cloud storage integration
- No advanced caching layer
- No real-time WebSockets implementation
- No production-grade observability stack

**Reason:** Scope was optimized for clarity, not production deployment.

---

## 7. Key Philosophy

> “Prioritize clarity and debuggability over scale and abstraction.”

This project emphasizes:
- Understandable system design
- Predictable execution flow
- Safe handling of large sensor data
- Minimal but intentional engineering decisions

---

## Conclusion

Stera Episode Studio demonstrates the ability to:
- Build a full-stack system from scratch
- Integrate external ML SDKs safely
- Handle large sensor data responsibly
- Make practical engineering trade-offs under constraints
- Maintain clean and explainable architecture
```
