"""
test_pipeline.py
----------------
Minimal end-to-end pipeline smoke test using only the API shown in the
official stera-sdk README (github.com/fpv-labs/stera-sdk).
 
Every SDK call here maps 1-to-1 to a line in the README example.
No inferred or guessed APIs are used.
 
Usage (from inside backend/):
    python test_pipeline.py
 
Expected layout:
    STERA-SDK/
    ├── backend/
    │   └── test_pipeline.py   ← this file
    ├── recordings/
    │   └── <session>/
    │       └── *.mcap
    └── output/
        └── test_run/          ← written by this script
"""
 
import sys
from pathlib import Path
 
# ---------------------------------------------------------------------------
# 0. Resolve paths before importing anything from the SDK.
#    This fails fast with a clear message if the layout is wrong.
# ---------------------------------------------------------------------------
 
BACKEND_DIR   = Path(__file__).resolve().parent
RECORDINGS_DIR = BACKEND_DIR.parent / "recordings"
OUTPUT_DIR     = BACKEND_DIR / "output" / "test_run"
 
if not RECORDINGS_DIR.is_dir():
    sys.exit(
        f"ERROR: recordings directory not found at {RECORDINGS_DIR}\n"
        f"       Run this script from inside backend/ or adjust the path."
    )
 
# Find the first .mcap file in any immediate sub-folder of recordings/
mcap_path = None
for entry in sorted(RECORDINGS_DIR.iterdir()):
    if entry.is_dir():
        candidates = sorted(entry.glob("*.mcap"))
        if candidates:
            mcap_path = candidates[0]
            break
 
if mcap_path is None:
    sys.exit(
        f"ERROR: No .mcap file found under {RECORDINGS_DIR}\n"
        f"       Ensure at least one recording folder contains a .mcap file."
    )
 
print(f"[pipeline] Found recording : {mcap_path}")
print(f"[pipeline] Output directory: {OUTPUT_DIR}")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
 
# ---------------------------------------------------------------------------
# 1. Import SDK — fail loudly if not installed, never silently.
#    Import names taken directly from the README:
#        from stera.data  import MCAPReader
#        from stera.models import FaceBlurrer
#        from stera.eval  import Evaluate
# ---------------------------------------------------------------------------
 
try:
    from stera.data import MCAPReader
except ImportError as exc:
    sys.exit(
        f"ERROR: Could not import stera.data.MCAPReader — {exc}\n"
        f"       Is stera-sdk installed in this environment?\n"
        f"       Run: pip install 'stera-sdk[all]'"
    )
 
try:
    from stera.models import FaceBlurrer
except ImportError as exc:
    sys.exit(
        f"ERROR: Could not import stera.models.FaceBlurrer — {exc}\n"
        f"       The 'mediapipe' optional dependency may be missing.\n"
        f"       Run: pip install 'stera-sdk[all]'"
    )
 
try:
    from stera.eval import Evaluate
except ImportError as exc:
    sys.exit(
        f"ERROR: Could not import stera.eval.Evaluate — {exc}\n"
        f"       Check your stera-sdk installation."
    )
 
# ---------------------------------------------------------------------------
# 2. Open the recording.
#    README: session = MCAPReader("recording.mcap")
# ---------------------------------------------------------------------------
 
print(f"[pipeline] Opening MCAPReader …")
try:
    session = MCAPReader(str(mcap_path))
except Exception as exc:
    sys.exit(
        f"ERROR: MCAPReader failed to open {mcap_path}\n"
        f"       {type(exc).__name__}: {exc}"
    )
print(f"[pipeline] MCAPReader opened successfully.")
 
# ---------------------------------------------------------------------------
# 3. Initialise FaceBlurrer.
#    README: blur = FaceBlurrer(model="mediapipe")
# ---------------------------------------------------------------------------
 
print(f"[pipeline] Initialising FaceBlurrer(model='mediapipe') …")
try:
    blur = FaceBlurrer(model="mediapipe")
except Exception as exc:
    sys.exit(
        f"ERROR: FaceBlurrer initialisation failed.\n"
        f"       {type(exc).__name__}: {exc}\n"
        f"       If this is a mediapipe import error, check:\n"
        f"       pip install mediapipe"
    )
print(f"[pipeline] FaceBlurrer ready.")
 
# ---------------------------------------------------------------------------
# 4. Process frames.
#    README:
#        for frame in session.frames():
#            blurred = blur.blur(frame)
#            session.add_rgb_frame(frame.index, blurred)
#
#    NOTE: HandTracker, MeshRefiner, and Visualizer are intentionally omitted.
#    The README shows them as optional parallel steps; omitting them is valid.
# ---------------------------------------------------------------------------
 
print(f"[pipeline] Starting frame processing …")
frame_count = 0
 
try:
    for frame in session.frames():
        # Blur faces — non-negotiable PII requirement.
        # README: blurred = blur.blur(frame)
        blurred = blur.blur(frame)
 
        # Write blurred frame back into the session.
        # README: session.add_rgb_frame(frame.index, blurred)
        session.add_rgb_frame(frame.index, blurred)
 
        frame_count += 1
        if frame_count % 50 == 0:
            print(f"[pipeline]   … {frame_count} frames processed")
 
except Exception as exc:
    # Surface the frame number so you know exactly where it broke.
    sys.exit(
        f"ERROR: Pipeline failed at frame {frame_count}.\n"
        f"       {type(exc).__name__}: {exc}"
    )
 
print(f"[pipeline] Frame processing complete — {frame_count} frames total.")
 
# Guard: if zero frames were yielded the session is likely malformed or empty.
if frame_count == 0:
    print(
        "WARNING: session.frames() yielded zero frames.\n"
        "         The .mcap file may be empty, corrupt, or missing an RGB stream.\n"
        "         Continuing to export so you can inspect what the SDK produces."
    )
 
# ---------------------------------------------------------------------------
# 5. Export the episode directory.
#    README: session.export("episodes/run_01")
#    We omit visualizer= and mesh= because we're not using those components.
# ---------------------------------------------------------------------------
 
print(f"[pipeline] Exporting episode to {OUTPUT_DIR} …")
try:
    session.export(str(OUTPUT_DIR))
except Exception as exc:
    sys.exit(
        f"ERROR: session.export() failed.\n"
        f"       {type(exc).__name__}: {exc}\n"
        f"       Common causes: ffmpeg not on PATH, no writable output directory."
    )
print(f"[pipeline] Export complete.")
 
# ---------------------------------------------------------------------------
# 6. Run the quality evaluation.
#    README: Evaluate(session).show()
#    .show() opens an interactive HTML report; behaviour may vary
#    (browser launch vs writing a file) depending on the SDK version.
# ---------------------------------------------------------------------------
 
print(f"[pipeline] Running Evaluate(session).show() …")
try:
    Evaluate(session).show()
except Exception as exc:
    # Non-fatal: evaluation failure should not discard a successful export.
    print(
        f"WARNING: Evaluate(session).show() raised an exception — "
        f"the export above is still valid.\n"
        f"         {type(exc).__name__}: {exc}"
    )
 
print(f"[pipeline] Done.")