import json
import os
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pipeline import process_recording
from fastapi.staticfiles import StaticFiles
app = FastAPI()
app.mount("/output", StaticFiles(directory="output"), name="output")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RECORDINGS_DIR = Path(__file__).resolve().parent.parent / "recordings"
OUTPUT_DIR = Path(__file__).resolve().parent / "output"

@app.get("/")
def root():
    return {
        "message": "Stera Episode Studio Backend Running 🚀"
    }


def _read_metadata(folder: Path) -> dict:
    metadata_path = folder / "metadata.json"

    if not metadata_path.is_file():
        return {}

    try:
        with metadata_path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except (json.JSONDecodeError, OSError):
        return {}


def _mcap_exists(folder: Path) -> bool:
    with os.scandir(folder) as entries:
        return any(
            e.is_file() and e.name.endswith(".mcap")
            for e in entries
        )


@app.get("/recordings")
def list_recordings():
    if not RECORDINGS_DIR.is_dir():
        raise HTTPException(
            status_code=500,
            detail=f"Recordings directory not found: {RECORDINGS_DIR}",
        )

    results = []

    for entry in sorted(os.scandir(RECORDINGS_DIR), key=lambda e: e.name):
        if not entry.is_dir():
            continue

        folder = Path(entry.path)
        metadata = _read_metadata(folder)

        results.append({
            "id": entry.name,
            "name": metadata.get("name", entry.name),
            "metadata": metadata,
            "thumbnail_exists": (folder / "thumbnail.jpg").is_file(),
            "mcap_exists": _mcap_exists(folder),
        })

    return results

@app.post("/process/{recording_id}")
def process_recording_endpoint(recording_id: str):
    recording_folder = RECORDINGS_DIR / recording_id

    if not recording_folder.is_dir():
        raise HTTPException(
            status_code=404,
            detail=f"Recording '{recording_id}' not found.",
        )

    output_dir = OUTPUT_DIR / recording_id

    # If outputs already exist, don't process again.
    if output_dir.is_dir():
        return {
            "success": True,
            "cached": True,
            "output_dir": str(output_dir),
            "outputs": {
                "rgb_mp4": (output_dir / "rgb.mp4").is_file(),
                "mesh_ply": (output_dir / "mesh.ply").is_file(),
                "thumbnail_jpg": (output_dir / "thumbnail.jpg").is_file(),
                "annotation_hdf5": (output_dir / "annotation.hdf5").is_file(),
                "calibrations_dir": (output_dir / "calibrations").is_dir(),
            },
        }

    try:
        result = process_recording(recording_folder)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"{type(exc).__name__}: {exc}",
        )

    result["cached"] = False
    return result