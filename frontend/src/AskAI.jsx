import { useState } from "react";

export default function AskAI() {
  const [question, setQuestion] = useState(
    "Checkout is failing. Who can help and why?"
  );
  const [answer, setAnswer] = useState("");
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setEvidence([]);

    try {
      const response = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not answer your question.");
      }

      setAnswer(data.answer);
      setEvidence(data.evidence || []);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot reach the backend. Check that it is running on port 5000."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">ASK TEAMRESCUE</p>
      <h2>Who can help—and why?</h2>
      <p>
        Ask about a service. The AI checks ownership, availability,
        and previous incidents in FalkorDB.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="ai-question">Your question</label>

        <textarea
          id="ai-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Checkout is failing. Who can help?"
          rows={3}
          maxLength={2000}
          required
          disabled={loading}
          style={{
            display: "block",
            boxSizing: "border-box",
            width: "100%",
            margin: "10px 0 16px",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #42546b",
            background: "#0b1321",
            color: "#f1f5f9",
            font: "inherit",
            resize: "vertical",
          }}
        />

        <button type="submit" disabled={loading || !question.trim()}>
          {loading ? "Checking the graph…" : "Ask AI"}
        </button>
      </form>

      <div aria-live="polite" aria-busy={loading}>
        {error && (
          <p role="alert" style={{ color: "#fda4af" }}>
            {error}
          </p>
        )}

        {answer && (
          <div style={{ marginTop: "24px" }}>
            <h3>TeamRescue recommendation</h3>

            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {answer}
            </div>

            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              Based on availability at the time of this lookup.
              Ask again after changing availability.
            </p>

            <div style={{ marginTop: 24 }}>
  <h3>Why this person?</h3>

  {evidence
    .filter(
      (item) =>
        item.tool === "get_service_context" &&
        item.result?.found
    )
    .map((item, index) => {
      const context = item.result;

      const cardStyle = {
        background: "#0b1321",
        border: "1px solid #2b3c53",
        borderRadius: 12,
        padding: 16,
      };

      return (
        <div key={index}>
          <p style={{ color: "#a9b7cc" }}>
            Checked: {context.service} and its direct dependencies.
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={cardStyle}>
              <strong style={{ color: "#70e0c4" }}>
                Service connections
              </strong>

              {context.dependencies?.length ? (
                context.dependencies.map((dependency, i) => (
                  <p key={i}>
                    {dependency.source} depends on{" "}
                    <strong>{dependency.dependency}</strong>.
                  </p>
                ))
              ) : (
                <p>No direct dependencies recorded.</p>
              )}
            </div>

            <div style={cardStyle}>
              <strong style={{ color: "#70e0c4" }}>
                Service owners
              </strong>

              {context.owners?.length ? (
                context.owners.map((owner, i) => (
                  <p key={i}>
                    <strong>{owner.person}</strong> owns {owner.service}
                    {" — "}
                    {owner.available === true
                      ? "Available"
                      : owner.available === false
                        ? "Unavailable"
                        : "Availability unknown"}
                  </p>
                ))
              ) : (
                <p>No owners recorded in the checked services.</p>
              )}
            </div>

            <div style={cardStyle}>
              <strong style={{ color: "#70e0c4" }}>
                Past experience
              </strong>

              {context.incidents?.length ? (
                context.incidents.map((incident, i) => (
                  <p key={i}>
                    <strong>{incident.person}</strong> resolved{" "}
                    <strong>{incident.incident_id}</strong>
                    {" — "}
                    {incident.past_incident}, which affected{" "}
                    {incident.service}. This is a past resolved incident.
                  </p>
                ))
              ) : (
                <p>No resolved incidents recorded in the checked services.</p>
              )}
            </div>

            <div
              style={{
                ...cardStyle,
                borderColor: "#70e0c4",
              }}
            >
              <strong style={{ color: "#70e0c4" }}>
                Graph recommendation
              </strong>

              <p>
                {context.recommendation
                  ? context.recommendation.evidence
                  : "No available expert found in the checked services."}
              </p>
            </div>
          </div>

          <p style={{ color: "#a9b7cc", fontSize: 14 }}>
            Dependencies show possible impact, not a confirmed root cause.
            Availability reflects the time of this lookup.
          </p>
        </div>
      );
    })}

  <details style={{ marginTop: 16 }}>
    <summary style={{ cursor: "pointer", color: "#70e0c4" }}>
      View raw graph evidence
    </summary>

    <pre
      style={{
        overflowX: "auto",
        background: "#0b1321",
        padding: 16,
        borderRadius: 12,
        fontSize: 13,
      }}
    >
      {JSON.stringify(evidence, null, 2)}
    </pre>
  </details>
</div>
          </div>
        )}
      </div>
    </section>
  );
}