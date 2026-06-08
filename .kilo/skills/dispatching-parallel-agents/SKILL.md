---
name: dispatching-parallel-agents
description: Dispatch agents for concurrent work on independent problems
---

Use when facing 2+ independent tasks without shared state or sequential dependencies.

Criteria:
- **Independent** — Tasks don't call each other's code or modify same files
- **No shared state** — Each can run in isolation
- **Different domains** — Each tackles a distinct problem area

Workflow:
1. Identify independent tasks in your plan
2. Dispatch one agent per problem domain concurrently
3. Each agent works on their slice independently
4. Consolidate results when all complete

Example independent tasks:
- Fix frontend bug in ImageStudio.js
- Update API route for /api/workflow
- Add new icons to components folder
- Write unit tests for models.js

Don't parallelize:
- Tasks that share files
- Sequential migrations
- Related UI/backend changes without clear contracts