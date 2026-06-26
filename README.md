```md
# Stera Episode Studio

A full-stack video processing system that processes iPhone sensor recordings (.mcap files) using an ML SDK pipeline for face blurring, episode export, and quality control evaluation.

---

## 🚀 Overview

Stera Episode Studio is a full-stack application that allows users to browse and process iPhone sensor recordings containing RGB video, LiDAR depth data, camera pose, and IMU streams stored in `.mcap` format.

It provides a simple interface to trigger an ML processing pipeline and view generated outputs such as processed video, thumbnails, meshes, and QC reports.

---

## 🧠 Architecture

React (Frontend) → FastAPI (Backend) → Background Processing → Stera SDK Pipeline → Output Storage → Static File Serving

---

## ⚙️ Tech Stack

### Frontend
- React (Vite)
- Hooks (useState, useEffect)
- Fetch API
- Polling-based UI updates

### Backend
- FastAPI
- Uvicorn
- Python threading (background processing)
- Static file serving for outputs

### Processing Pipeline
- Stera SDK
- MCAPReader
- FaceBlurrer (MediaPipe-based)
- Evaluate (QC module)

---

## 📂 Features

### 1. Browse Recordings
- Scans `/recordings` directory
- Reads metadata.json safely
- Displays:
  - Name
  - Duration
  - Resolution
  - Availability of MCAP + thumbnails

---

### 2. Processing Pipeline
Trigger:
```

POST /process/{recording_id}

```

Steps:
- Load `.mcap` file
- Decode frames
- Apply face blurring
- Export processed video and assets
- Run QC evaluation

---

### 3. Async Processing
- Uses background threads (non-blocking API design)
- Prevents UI blocking during heavy SDK processing

---

### 4. Progress & State Handling
Frontend states:
- idle
- processing
- done
- error

UI updates via polling-based fetch calls.

---

### 5. Output Serving
Processed files served via:
```

/output/{recording_id}/

```

Outputs:
- rgb.mp4
- mesh.ply
- thumbnail.jpg
- annotation.hdf5
- calibration data

---

## 🔌 API Endpoints

### Health Check
```

GET /

```

### Get Recordings
```

GET /recordings

```

### Process Recording
```

POST /process/{recording_id}

```

### Static Outputs
```

GET /output/{recording_id}/{file}

````

---

## 🔄 End-to-End Flow

1. Frontend loads dashboard
2. Backend scans recordings folder
3. User selects "Process Recording"
4. Backend triggers Stera SDK pipeline
5. Processing runs:
   - Face blurring
   - Video export
   - QC evaluation
6. Outputs are saved in `/output/{recording_id}`
7. Frontend polls backend state
8. UI displays results and video link

---

## 📦 Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+

---

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
````

Backend runs at:

```
http://127.0.0.1:8000
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

### Run Order

1. Start backend first
2. Start frontend second
3. Open browser at:

```
http://localhost:5173
```

---

## 🧪 Notes

* Ensure `.mcap` files exist in `/recordings`
* Ensure Stera SDK is installed in backend environment
* Output files are generated in `/backend/output`
* Backend must run before frontend requests

---

## ✅ Submission Checklist

* Full-stack React + FastAPI application
* Working SDK integration
* Async background processing
* Output video + asset generation
* Static file serving
* Clean API design
* Production-ready documentation

```
```
