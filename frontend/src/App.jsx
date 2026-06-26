
import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

// ---------------------------------------------------------------------------
// Formatters — kept outside components so they're not re-created on render
// ---------------------------------------------------------------------------

/** Convert seconds to a human-readable duration string, e.g. "1h 04m 32s" */
function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/** Normalise resolution from whatever shape the metadata gives us */
function formatResolution(metadata) {
  if (!metadata) return null;
  if (metadata.width && metadata.height) return `${metadata.width}×${metadata.height}`;
  if (typeof metadata.resolution === "string") return metadata.resolution;
  if (metadata.resolution?.width && metadata.resolution?.height)
    return `${metadata.resolution.width}×${metadata.resolution.height}`;
  return null;
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

function StatusBadge({ present, label }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Mono', monospace",
        fontSize: "0.7rem",
        fontWeight: 500,
        letterSpacing: "0.04em",
        padding: "0.2rem 0.5rem",
        borderRadius: "0.25rem",
        background: present ? "hsl(142 40% 92%)" : "hsl(220 10% 92%)",
        color: present ? "hsl(142 45% 28%)" : "hsl(220 10% 46%)",
        border: `1px solid ${present ? "hsl(142 35% 80%)" : "hsl(220 10% 82%)"}`,
        userSelect: "none",
      }}
    >
      <span aria-hidden="true">{present ? "●" : "○"}</span>
      {label}
    </span>
  );
}

function MetaRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "hsl(220 10% 52%)",
          minWidth: "5.5rem",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "0.8rem",
          color: "hsl(220 12% 22%)",
          fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Mono', monospace",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecordingCard
// ---------------------------------------------------------------------------

function RecordingCard({ recording }) {
  const { id, name, metadata, thumbnail_exists, mcap_exists } = recording;

  // "idle" | "processing" | "done" | "error"
  const [jobStatus, setJobStatus] = useState("idle");
  const [jobError, setJobError] = useState("");
  const [processResult, setProcessResult] = useState(null);

  const duration = formatDuration(metadata?.duration_seconds ?? metadata?.duration);
  const resolution = formatResolution(metadata);

  function handleProcess() {
    setJobStatus("processing");
    setJobError("");

    fetch(`${API_BASE}/process/${id}`, { method: "POST" })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => {
            throw new Error(body.detail ?? `Server responded ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        setProcessResult(data);
        setJobStatus("done");
      })
      .catch((err) => {
        setJobError(err.message);
        setJobStatus("error");
      });
  }

  const buttonLabel =
    jobStatus === "processing" ? "Processing…" :
    jobStatus === "done"       ? "Processed ✓" :
                                 "Process Recording";

  const buttonDisabled = jobStatus === "processing" || jobStatus === "done";

  const buttonStyle = {
    marginTop: "0.25rem",
    width: "100%",
    padding: "0.5rem 0",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
    borderRadius: "0.375rem",
    ...(jobStatus === "done" ? {
      border: "1px solid hsl(142 35% 75%)",
      background: "hsl(142 40% 95%)",
      color: "hsl(142 45% 28%)",
      cursor: "default",
    } : jobStatus === "processing" ? {
      border: "1px solid hsl(220 12% 82%)",
      background: "hsl(220 12% 97%)",
      color: "hsl(220 10% 55%)",
      cursor: "not-allowed",
    } : {
      border: "1px solid hsl(220 12% 82%)",
      background: "hsl(220 12% 97%)",
      color: "hsl(220 10% 40%)",
      cursor: "pointer",
    }),
  };

  return (
    <article
      style={{
        background: "hsl(0 0% 100%)",
        border: "1px solid hsl(220 12% 88%)",
        borderRadius: "0.5rem",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px hsl(220 12% 80% / 0.5)";
        e.currentTarget.style.borderColor = "hsl(220 12% 78%)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "hsl(220 12% 88%)";
      }}
    >
      {/* Thumbnail placeholder — intentionally inert until serve is wired */}
      <div
        aria-label="Thumbnail not yet loaded"
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          background: "hsl(220 12% 94%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="hsl(220 10% 70%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <path d="M10 8l6 4-6 4V8z" />
        </svg>
      </div>

      {/* Card body */}
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>

        <h2
          style={{
            margin: 0,
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "hsl(220 12% 12%)",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
          title={name}
        >
          {name}
        </h2>

        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          <StatusBadge present={mcap_exists} label="MCAP" />
          <StatusBadge present={thumbnail_exists} label="Thumbnail" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <MetaRow label="Duration" value={duration} />
          <MetaRow label="Resolution" value={resolution} />
        </div>

        <div style={{ flex: 1 }} />

        {jobStatus === "error" && (
          <p
            role="alert"
            style={{
              margin: 0,
              fontSize: "0.72rem",
              lineHeight: 1.4,
              color: "hsl(0 55% 38%)",
              background: "hsl(0 60% 97%)",
              border: "1px solid hsl(0 55% 88%)",
              borderRadius: "0.25rem",
              padding: "0.35rem 0.5rem",
              wordBreak: "break-word",
            }}
          >
            {jobError}
          </p>
        )}

<button
  onClick={buttonDisabled ? undefined : handleProcess}
  disabled={buttonDisabled}
  aria-label={`Process recording ${name}`}
  style={buttonStyle}
>
  {buttonLabel}
</button>

{processResult && (
  <div
    style={{
      marginTop: "0.5rem",
      paddingTop: "0.75rem",
      borderTop: "1px solid hsl(220 12% 90%)",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}
  >
    <p
      style={{
        margin: 0,
        fontSize: "0.75rem",
        color: "hsl(220 12% 32%)",
        fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Mono', monospace",
      }}
    >
      Frames processed: {processResult.frames_processed}
    </p>

    <p
      style={{
        margin: 0,
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "hsl(220 10% 52%)",
      }}
    >
      Generated outputs
    </p>

    {Object.entries(processResult.outputs).map(([key, present]) => (
      <div
        key={key}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.75rem",
          fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Mono', monospace",
          color: present ? "hsl(142 45% 28%)" : "hsl(0 55% 40%)",
        }}
      >
        <span aria-hidden="true">{present ? "✓" : "✗"}</span>
        {key}
      </div>
    ))}
      {processResult.outputs.rgb_mp4 && (
        <a
          href={`${API_BASE}/output/${id}/rgb.mp4`}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: "0.75rem",
            color: "hsl(220 70% 50%)",
            textDecoration: "none",
            fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Mono', monospace",
          }}
        >
          View Video →
        </a>
      )}
  </div>
)}

</div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [recordings, setRecordings] = useState([]);
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setStatus("loading");

    fetch(`${API_BASE}/recordings`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setRecordings(data);
        setStatus("idle");
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "hsl(220 14% 96%)",
        fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
        margin: 0,
        padding: 0,
      }}
    >
      <header
        style={{
          borderBottom: "1px solid hsl(220 12% 88%)",
          background: "hsl(0 0% 100%)",
          padding: "0 2rem",
          height: "3.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="hsl(220 12% 22%)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" />
        </svg>
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "hsl(220 12% 12%)",
          }}
        >
          Stera Episode Studio
        </span>

        {status === "idle" && recordings.length > 0 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.75rem",
              color: "hsl(220 10% 52%)",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            {recordings.length} recording{recordings.length !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      <main style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem" }}>

        {status === "loading" && (
          <div
            role="status"
            aria-live="polite"
            style={{
              textAlign: "center",
              padding: "4rem 0",
              color: "hsl(220 10% 52%)",
              fontSize: "0.875rem",
            }}
          >
            Scanning recordings…
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            style={{
              background: "hsl(0 60% 97%)",
              border: "1px solid hsl(0 55% 88%)",
              borderRadius: "0.5rem",
              padding: "1rem 1.25rem",
              color: "hsl(0 55% 35%)",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            }}
          >
            <strong>Could not load recordings.</strong>
            <br />
            {errorMsg}. Check that the backend is running on{" "}
            <code style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
              {API_BASE}
            </code>
            .
          </div>
        )}

        {status === "idle" && recordings.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 0",
              color: "hsl(220 10% 52%)",
              fontSize: "0.875rem",
            }}
          >
            No recordings found in the recordings directory.
          </div>
        )}

        {status === "idle" && recordings.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {recordings.map((rec) => (
              <RecordingCard key={rec.id} recording={rec} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
