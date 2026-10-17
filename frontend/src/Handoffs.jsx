import { useEffect, useState } from "react";

const API = "https://teamrescue-backend.onrender.com";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 14,
  marginTop: 8,
  marginBottom: 16,
  borderRadius: 12,
  border: "1px solid #42546b",
  background: "#0b1321",
  color: "#f1f5f9",
  font: "inherit",
};

async function request(path, options) {
  const response = await fetch(`${API}${path}`, options);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export default function Handoffs() {
  const [services, setServices] = useState([]);
  const [service, setService] = useState("");
  const [note, setNote] = useState("");
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [serviceData, historyData] = await Promise.all([
          request("/api/handoffs/services"),
          request("/api/handoffs"),
        ]);

        if (cancelled) return;

        setServices(serviceData.services);
        setService(serviceData.services[0]?.name || "");
        setHandoffs(historyData.handoffs);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load handoffs.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveHandoff(event) {
    event.preventDefault();

    if (!service || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const data = await request("/api/handoffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, note }),
      });

      setHandoffs((previous) =>
        [data.handoff, ...previous].slice(0, 30)
      );
      setNote("");
      setMessage(
        `Draft saved for ${data.handoff.person}. No notification was sent.`
      );
    } catch (err) {
      setError(err.message || "Could not save the handoff.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">PERSISTENT GRAPH RECORDS</p>
      <h2>Save a handoff</h2>

      <p>
        Recheck current availability and save the recommended person,
        service, and supporting evidence in FalkorDB.
      </p>

      {loading ? (
        <p>Loading saved handoffs…</p>
      ) : (
        <form onSubmit={saveHandoff}>
          <label htmlFor="handoff-service">Service</label>
          <select
            id="handoff-service"
            style={inputStyle}
            value={service}
            onChange={(event) => setService(event.target.value)}
            disabled={saving || !services.length}
            required
          >
            {!services.length && (
              <option value="">No services available</option>
            )}

            {services.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <label htmlFor="handoff-note">Your note (optional)</label>
          <textarea
            id="handoff-note"
            style={inputStyle}
            rows={3}
            maxLength={1000}
            placeholder="Example: Customers report checkout timeouts."
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={saving}
          />

          <button type="submit" disabled={saving || !service}>
            {saving ? "Saving…" : "Save current recommendation"}
          </button>

          <p style={{ color: "#a9b7cc", fontSize: 14 }}>
            Saves a draft record only. Nobody is notified or assigned.
          </p>
        </form>
      )}

      <div aria-live="polite">
        {error && (
          <p role="alert" style={{ color: "#ff9b9b" }}>
            {error}
          </p>
        )}

        {message && (
          <p style={{ color: "#70e0c4" }}>{message}</p>
        )}
      </div>

      <h3>Saved handoffs</h3>

      {!loading && !error && handoffs.length === 0 && (
        <p>No handoffs saved yet.</p>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {handoffs.map((handoff) => (
          <article
            key={handoff.id}
            style={{
              background: "#0b1321",
              border: "1px solid #2b3c53",
              borderRadius: 12,
              padding: 18,
            }}
          >
            <strong style={{ color: "#70e0c4" }}>
              {handoff.service} · Draft
            </strong>

            <h3>Recommended: {handoff.person}</h3>
            <p>{handoff.evidence}</p>

            {handoff.note && (
              <p style={{ whiteSpace: "pre-wrap" }}>
                <strong>Your note:</strong> {handoff.note}
              </p>
            )}

            <p style={{ color: "#a9b7cc", fontSize: 14 }}>
              Saved {new Date(handoff.created_at).toLocaleString()}
              <br />
              Historical recommendation; availability may have changed.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}