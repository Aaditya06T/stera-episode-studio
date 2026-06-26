````md
# Stera Episode Studio

A full-stack video processing system that processes iPhone sensor recordings (.mcap files) using an ML SDK pipeline for face blurring, episode export, and quality control evaluation.

---

## 🚀 Problem Statement

Researchers work with complex iPhone recordings containing:
- RGB video
- LiDAR depth data
- Camera pose
- IMU data stored in `.mcap` files

This system enables users to:
- Browse available recordings
- Trigger processing pipelines
- Monitor processing status
- View generated outputs (video, metadata, QC reports)

---

## 🧠 System Architecture

Frontend (React + Vite) → FastAPI Backend → Background Worker → Stera SDK Pipeline → Output Storage + SQLite

---

## ⚙️ Tech Stack

### Frontend
- React (Vite)
- Functional components with Hooks
- Fetch API
- Polling-based updates

### Backend
- FastAPI
- Uvicorn
- Python threading (background jobs)
- SQLite (state persistence)
- Static file serving

### Processing
- Stera SDK (ML pipeline)
- MCAPReader
- FaceBlurrer (MediaPipe)
- Evaluate (QC module)

---

## 📂 Features

### 1. Browse Recordings
- Lists all available `.mcap` sessions
- Reads metadata without loading large files
- Shows:
  - Name
  - Duration
  - Resolution
  - Asset availability

---

### 2. Processing Pipeline
Triggered via:

POST `/process/{recording_id}`

Steps:
- Load MCAP file
- Extract RGB frames
- Apply face blurring
- Export processed video
- Run QC evaluation

---

### 3. Async Processing
- Uses background threads
- Prevents blocking API requests
- Keeps UI responsive during heavy processing

---

### 4. Progress Tracking
- Frontend polls backend for status updates
- States:
  - idle
  - processing
  - completed
  - error

---

### 5. Output Serving
Processed outputs are served via:

`/output/{recording_id}/`

Includes:
- rgb.mp4
- mesh.ply
- thumbnail.jpg
- annotation files
- calibration data

---

## 🔌 API Endpoints

### Get recordings
GET `/recordings`

### Process recording
POST `/process/{recording_id}`

### Health check
GET `/`

### Static output access
GET `/output/{file_path}`

---

## 🔄 End-to-End Flow

1. User opens dashboard
2. Backend lists recordings
3. User clicks "Process Recording"
4. Backend triggers SDK pipeline in background
5. Processing runs:
   - Face blur
   - Video export
   - QC evaluation
6. Outputs saved in `/output`
7. Frontend polls status endpoint
8. UI updates with results and video link

---

## 🧩 Key Engineering Decisions

- Background threading used instead of external job queue for simplicity
- Polling used instead of WebSockets to reduce complexity
- SQLite used for lightweight persistence
- No raw frames exposed to frontend for privacy
- Lazy loading of `.mcap` files for performance
- Static file serving used for generated outputs

---

## ⚠️ Known Limitations

- Single-worker processing (no distributed queue)
- SDK is alpha and may behave inconsistently
- Polling introduces slight delay vs real-time updates
- Static file path configuration must be correct

---

## 📦 Setup Instructions

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
````

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 What This Project Demonstrates

* Full-stack system design
* Integration with external ML SDKs
* Async processing architecture
* Practical engineering trade-offs
* Clean separation of frontend and backend responsibilities

```
```
