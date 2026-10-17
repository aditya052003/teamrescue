import { useState } from "react";
import TeamAvailability from "./TeamAvailability";
import "./App.css";
import AskAI from "./AskAI";
import Handoffs from "./Handoffs";

export default function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function findExpert() {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch(
        "https://teamrescue-backend.onrender.com/api/recommend"
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not retrieve recommendations."
        );
      }

      setResults(data.results);
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

  function handleAvailabilityChange() {
    setResults(null);
    setError("");
  }

  return (
    <main className="dashboard">
      <p className="eyebrow">
        TEAMRESCUE · DEMO COMPANY
      </p>

      <h1>
        The right help.
        <br />
        With evidence.
      </h1>

      <p className="subtitle">
        Find an available teammate using service ownership,
        connected systems, and past incident experience.
      </p>

      <section className="panel">
        <span className="badge">Checkout incident</span>

        <h2>Payments are failing. Who can help?</h2>

        <p>
          Find the available service owner, or a backup with
          relevant incident experience.
        </p>

        <button
          type="button"
          onClick={findExpert}
          disabled={loading}
        >
          {loading
            ? "Checking company graph…"
            : "Find an available expert"}
        </button>
      </section>

      <fieldset
        disabled={loading}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        <TeamAvailability
          onAvailabilityChange={handleAvailabilityChange}
        />
      </fieldset>

      <div aria-live="polite" aria-busy={loading}>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {results !== null && results.length === 0 && (
          <section className="panel">
            <p className="eyebrow">NO AVAILABLE MATCH</p>
            <h2>No available expert found.</h2>
            <p>
              No available owner or experienced backup was found
              in the current company graph.
            </p>
          </section>
        )}

        {results?.map((result, index) => (
          <section
            className="panel result"
            key={`${result.recommended_person}-${index}`}
          >
            <p className="eyebrow">
              AVAILABLE EXPERT FOUND
            </p>

            <h2>{result.recommended_person}</h2>

            <p>
              <strong>{result.reason}</strong>
            </p>

            <p>
              Service: <strong>{result.service}</strong>
            </p>

            <p className="evidence">
              {result.evidence}
            </p>
          </section>
        ))}
      </div>

      <AskAI />
      <Handoffs />

      <footer>
        Powered by FalkorDB · Fictional demo data · Graph lookup prototype
      </footer>
    </main>
  );
}