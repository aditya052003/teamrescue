import { useEffect, useState } from "react";

const API = "https://teamrescue-backend.onrender.com";

export default function TeamAvailability({ onAvailabilityChange }) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTeam() {
      try {
        const response = await fetch(`${API}/api/team`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load team.");
        }

        if (!cancelled) setTeam(data.team);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTeam();

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleAvailability(person) {
    setSaving(person.name);
    setError("");

    try {
      const response = await fetch(`${API}/api/team/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: person.name,
          available: !person.available,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update availability.");
      }

      setTeam((current) =>
        current.map((member) =>
          member.name === data.employee.name
            ? data.employee
            : member
        )
      );

      onAvailabilityChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving("");
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">TEAM AVAILABILITY</p>
      <h2>Who is available to help?</h2>
      <p>Changes are saved in FalkorDB.</p>

      {loading && <p>Loading team…</p>}
      {error && <p role="alert">{error}</p>}

      {team.map((person) => (
        <div className="team-row" key={person.name}>
          <div>
            <strong>{person.name}</strong>
            <span className="team-status">
              {person.available ? "Available" : "Unavailable"}
            </span>
          </div>

          <button
            disabled={Boolean(saving)}
            onClick={() => toggleAvailability(person)}
          >
            {saving === person.name
              ? "Saving…"
              : person.available
                ? "Mark unavailable"
                : "Mark available"}
          </button>
        </div>
      ))}
    </section>
  );
}