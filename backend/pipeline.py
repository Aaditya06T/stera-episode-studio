"""
pipeline.py
-----------
Reusable processing function for Stera recordings.
 
SDK calls are identical to the verified test_pipeline.py.
Nothing here has been changed from what is known to work.
 
Expected layout:
    STERA-SDK/
    ├── backend/
    │   ├── pipeline.py        ← this file
    │   └── output/
    │       └── <recording_id>/  ← written by process_recording()
    └── recordings/
        └── <recording_id>/
            └── *.mcap
"""
 
from pathlib import Path
 
from stera.data import MCAPReader
from stera.eval import Evaluate
from stera.models import FaceBlurrer
 
# Output root is always backend/output/, resolved relative to this file.
# pipeline.py lives in backend/, so .parent == backend/.
_OUTPUT_ROOT = Path(__file__).resolve().parent / "output"
 
 
def process_recording(recording_folder: Path) -> dict:
    """
    Run the full Stera processing pipeline on a single recording folder.
 
    Locates the first .mcap file inside `recording_folder`, blurs every RGB
    frame, exports the episode, and runs the QC evaluation.
 
    The recording_folder name is used as the recording ID, so the output
    lands at backend/output/<recording_id>/.
 
    Args:
        recording_folder: Absolute or relative Path to the recording directory.
                          Must contain exactly one .mcap file.
 
    Returns:
        {
            "success": True,
            "output_dir": str,      # absolute path to the exported episode
            "frames_processed": int
        }
 
    Raises:
        FileNotFoundError: If recording_folder doesn't exist or contains no .mcap.
        Any exception raised by the SDK propagates unchanged — do not silence it.
    """
    recording_folder = Path(recording_folder).resolve()
 
    if not recording_folder.is_dir():
        raise FileNotFoundError(
            f"Recording folder does not exist: {recording_folder}"
        )
 
    # ------------------------------------------------------------------
    # Locate the .mcap file — same logic as test_pipeline.py.
    # Raise early rather than passing a bad path to MCAPReader.
    # ------------------------------------------------------------------
    mcap_candidates = sorted(recording_folder.glob("*.mcap"))
    if not mcap_candidates:
        raise FileNotFoundError(
            f"No .mcap file found in {recording_folder}"
        )
 
    mcap_path = mcap_candidates[0]
 
    # recording_id is the folder name, e.g. "session_001"
    recording_id = recording_folder.name
    output_dir = _OUTPUT_ROOT / recording_id
    output_dir.mkdir(parents=True, exist_ok=True)
 
    # ------------------------------------------------------------------
    # SDK calls — verbatim from verified test_pipeline.py.
    # Do not change these without re-running the standalone test first.
    # ------------------------------------------------------------------
 
    session = MCAPReader(str(mcap_path))
 
    blur = FaceBlurrer(model="mediapipe")
 
    frame_count = 0
    for frame in session.frames():
        blurred = blur.blur(frame)
        session.add_rgb_frame(frame.index, blurred)
        frame_count += 1
 
    session.export(str(output_dir))
 
    Evaluate(session).show()
    
 
    # ------------------------------------------------------------------
 
    return {
    "success": True,
    "output_dir": str(output_dir),
    "frames_processed": frame_count,
    "outputs": {
        "rgb_mp4": (output_dir / "rgb.mp4").is_file(),
        "mesh_ply": (output_dir / "mesh.ply").is_file(),
        "thumbnail_jpg": (output_dir / "thumbnail.jpg").is_file(),
        "annotation_hdf5": (output_dir / "annotation.hdf5").is_file(),
        "calibrations_dir": (output_dir / "calibrations").is_dir(),
    },
}