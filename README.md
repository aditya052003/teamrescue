# TeamRescue

Find the right person to help with a service incident—and see the evidence.

TeamRescue is an AI incident-response assistant built with FalkorDB,
Google Gemini, React, and Express.

Built for Graph Hacks: Context for AI Agents.
Target track: Company Brain.

## The problem

When a service fails, teams need to know who owns it, whether that
person is available, and who has relevant experience if the owner
cannot help. Those answers depend on relationships across services,
people, and past incidents.

## What TeamRescue does

- Answers questions about recorded services using Gemini tool calling.
- Reads ownership, dependencies, availability, and resolved incidents
  from FalkorDB.
- Prefers available owners, then available people with relevant
  incident experience.
- Shows readable evidence cards and raw tool results.
- Updates employee availability in the graph.
- Saves handoff drafts with the recommendation, evidence, and timestamp.
- Provides a labelled direct graph fallback when the AI response
  is unavailable.

Saving a handoff does not notify anyone or assign work.

## Why a graph?

The demo connects these facts:

- Checkout depends on Payment Service.
- Priya owns Payment Service.
- Rahul resolved incident INC-001.
- INC-001 affected Payment Service.

When Priya is unavailable and Rahul is available, TeamRescue can follow
these connections to recommend Rahul. When Priya becomes available,
the owner-first recommendation changes to Priya.

FalkorDB shapes the recommendation and stores the handoff records.

## Stack

- Frontend: React and Vite
- Backend: Node.js and Express
- Context and storage: FalkorDB
- AI: Google Gemini through @google/genai
- Local database runtime: Docker

## Run locally

### 1. Clone the repository

```powershell
git clone https://github.com/aditya052003/teamrescue.git
cd teamrescue
```

Install Node.js and Docker Desktop first. Start Docker Desktop
with Linux containers enabled.

### 2. Start FalkorDB

For a new installation:

```powershell
docker run -d --name teamrescue-db -p 127.0.0.1:6379:6379 -p 127.0.0.1:3000:3000 -v teamrescue-data:/data -e "REDIS_ARGS=--appendonly yes" falkordb/falkordb:latest
```

If this container already exists:

```powershell
docker start teamrescue-db
```

The named volume stores database data between container restarts.
Keep the volume to retain saved records.

### 3. Add fictional demo data

Run this command once the database is ready:

```powershell
docker exec teamrescue-db redis-cli GRAPH.QUERY teamrescue "MERGE (p:Person {name:'Priya'}) SET p.available=false MERGE (r:Person {name:'Rahul'}) SET r.available=true MERGE (s:Service {name:'Payment Service'}) MERGE (c:Service {name:'Checkout'}) MERGE (i:Incident {id:'INC-001'}) SET i.title='Payment timeout', i.status='resolved' MERGE (p)-[:OWNS]->(s) MERGE (c)-[:DEPENDS_ON]->(s) MERGE (r)-[:RESOLVED]->(i) MERGE (i)-[:AFFECTED]->(s)"
```

Running this again resets Priya and Rahul to the availability values
above. It does not delete saved handoffs.

### 4. Start the backend

```powershell
cd backend
npm.cmd ci
```

Create `backend/.env`:

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=your_available_tool_calling_model
```

Replace both placeholders with your own configuration.
Never commit your API key.

Without an API key, direct graph fallback is available, but
AI tool calling is not enabled.

Start the backend:

```powershell
npm.cmd run dev
```

Backend: http://localhost:5000

### 5. Start the frontend

Open another terminal from the repository folder:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:5173.

Keep Docker, the backend, and the frontend running.

On systems where `npm` works directly, it can be used instead
of `npm.cmd`.

## Demo walkthrough

1. Set Priya to unavailable and Rahul to available.
2. Ask: "Checkout is failing. Who can help and why?"
3. Inspect the recommendation and graph evidence for Rahul.
4. Set Priya to available and ask the same question again.
5. Observe the owner-first recommendation for Priya.
6. Select Checkout in the handoff form and save a draft.
7. Refresh the page and confirm the saved draft remains.

Handoff saving rechecks the graph. Its recommendation may differ
from an earlier answer if availability has changed.

## Build the frontend

From the frontend folder:

```powershell
npm.cmd run build
```

Vite writes the output to `frontend/dist`.
Building the frontend does not deploy the backend or database.

## Current scope and limitations

- Uses a small fictional dataset.
- Checks the requested service and its direct dependencies.
- Dependencies indicate possible impact, not a proven root cause.
- AI wording may be imperfect; inspect the graph evidence.
- Gemini latency and availability depend on the provider.
- Fallback follows a predefined graph lookup and is labelled accordingly.
- Saved drafts are historical records, not live availability reports.
- The AI does not yet retrieve saved handoffs as conversational memory.
- No authentication, tenant isolation, or notification integrations.
- Configured for local use; public deployment needs additional work.

## Author

Aditya Raut
https://github.com/aditya052003