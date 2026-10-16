import { randomUUID } from "node:crypto";

export function registerHandoffRoutes(app, query, getServiceContext) {
  app.get("/api/handoffs/services", async (req, res) => {
    try {
      const services = await query(`
        MATCH (s:Service)
        RETURN DISTINCT s.name AS name
        ORDER BY name
      `);

      res.json({ success: true, services });
    } catch {
      res.status(500).json({
        success: false,
        message: "Could not load services.",
      });
    }
  });

  app.get("/api/handoffs", async (req, res) => {
    try {
      const handoffs = await query(`
        MATCH (h:Handoff)-[:FOR_SERVICE]->(s:Service),
              (h)-[:RECOMMENDS]->(p:Person)
        RETURN h.id AS id,
               h.created_at AS created_at,
               h.note AS note,
               h.evidence AS evidence,
               h.status AS status,
               s.name AS service,
               p.name AS person
        ORDER BY created_at DESC
        LIMIT 30
      `);

      res.json({ success: true, handoffs });
    } catch {
      res.status(500).json({
        success: false,
        message: "Could not load saved handoffs.",
      });
    }
  });

  app.post("/api/handoffs", async (req, res) => {
    const { service, note = "" } = req.body ?? {};

    if (
      typeof service !== "string" ||
      !service.trim() ||
      service.length > 150 ||
      typeof note !== "string" ||
      note.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Choose a service and keep the note under 1000 characters.",
      });
    }

    try {
      // Recheck the graph when saving instead of trusting frontend data.
      const context = await getServiceContext(service.trim());

      if (!context.found) {
        return res.status(404).json({
          success: false,
          message: "Service not found.",
        });
      }

      const recommendation = context.recommendation;

      if (!recommendation) {
        return res.status(409).json({
          success: false,
          message:
            "No available expert found. Update team availability before saving.",
        });
      }

      const id = randomUUID();
      const createdAt = new Date().toISOString();

      const rows = await query(
        `MATCH (s:Service {name: $service}),
               (p:Person {name: $person}),
               (related:Service {name: $relatedService})
         WHERE p.available = true
         CREATE (h:Handoff {
           id: $id,
           created_at: $createdAt,
           note: $note,
           evidence: $evidence,
           context_json: $contextJson,
           status: 'draft'
         })
         CREATE (h)-[:FOR_SERVICE]->(s)
         CREATE (h)-[:RECOMMENDS]->(p)
         CREATE (h)-[:BASED_ON_SERVICE]->(related)
         RETURN h.id AS id,
                h.created_at AS created_at,
                h.note AS note,
                h.evidence AS evidence,
                h.status AS status,
                s.name AS service,
                p.name AS person`,
        {
          id,
          createdAt,
          service: context.service,
          person: recommendation.recommended_person,
          relatedService: recommendation.service,
          note: note.trim(),
          evidence: recommendation.evidence,
          contextJson: JSON.stringify(context),
        }
      );

      if (!rows.length) {
        return res.status(409).json({
          success: false,
          message: "Availability changed. Try saving again.",
        });
      }

      return res.status(201).json({
        success: true,
        handoff: rows[0],
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Could not save the handoff.",
      });
    }
  });
}