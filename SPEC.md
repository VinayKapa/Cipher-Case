# CipherCase — Product and Engineering Specification

## 1. Product overview

**CipherCase: AI Detective Lab** is a responsive, single-player mystery investigation game. A player supplies a premise, chooses a difficulty, and receives a grounded case generated with Gemini. They inspect evidence, connect clues to suspects on an evidence board, question witnesses through branching follow-ups, keep a case journal and timeline, request graduated hints, then accuse a suspect. The server evaluates the accusation and returns a verdict and difficulty-aware score.

The experience should feel like a compact detective desk: atmospheric and editorial, but readable, accessible, and fast to use on desktop and mobile.

### Problem statement

AI-generated mysteries can be entertaining but often lack a fair, consistent answer, meaningful investigative interaction, or a way to track discoveries. CipherCase treats the mystery as a structured case: the server stores the canonical culprit and solution, gameplay actions are recorded, and scoring reflects both difficulty and investigative choices.

### Target users and experience

- Casual mystery, puzzle, and interactive fiction fans.
- Learners exploring deduction and evidence evaluation.
- Players should be able to start without an account, understand what to do next, and finish a case in roughly 10–20 minutes.
- Core flows must work with keyboard, touch, screen readers, and narrow screens.

## 2. Goals, non-goals, and deliverables

### Goals

- Create fair, internally consistent mysteries with multiple suspects and actionable clues.
- Keep the answer key and scoring decisions on the backend.
- Offer useful investigation interactions beyond reading a generated story.
- Require Gemini for every mystery; show retryable errors when Gemini is unavailable. MongoDB may use ephemeral in-memory development storage when unavailable.
- Make local development and Vercel/Render deployment straightforward.

### Non-goals and limitations

- No multiplayer, real-time collaboration, user accounts, or payments in the initial release.
- Generated content is fictional and should not be presented as factual advice.
- AI generation is probabilistic; the backend must validate the structure and reject cases that fail consistency checks.
- Anonymous case state is stored by opaque case ID; production should apply rate limits, retention limits, and abuse controls.
- This is a learning/demo application, not a production security audit or guaranteed uptime service.

### Deliverables

- This specification, `README.md`, `.env.example`, frontend and backend source, tests, and deployment configuration.
- Responsive home, case creation, investigation, accusation, and results views.
- API health endpoint, validation, safe error handling, server-side secret handling.
- Vercel frontend and Render backend configuration plus MongoDB Atlas setup instructions.
- A live deployment URL only after the deployed app is reachable and verified.

## 3. Core features

### Required

1. **Create a case:** premise (bounded text), difficulty (easy, medium, hard), generate button.
2. **Generated mystery:** title, setting, opening narrative, 3–5 suspects, 5–8 clues, sealed solution, three ordered hints, and consistent suspect interviews.
3. **Investigation room:** story, suspect cards, discoverable clue cards, progress, next-step guidance, and hint request.
4. **Evidence board:** link/unlink discovered clues to suspects and show the player's working theory. These are player annotations and do not expose the answer.
5. **Interrogation:** ask a suspect from curated follow-up choices. Questions branch based on prior questions/evidence, with response content served from the stored case.
6. **Case journal and timeline:** append discoveries, interview answers, hint use, and accusation as chronological events; allow private player notes.
7. **Accusation:** select one suspect, review submission, confirm once. A case can be accused only once.
8. **Results:** correct/incorrect verdict, culprit, explanation, score breakdown, and replay action.
9. **Daily challenge / shareable code:** daily case uses a deterministic UTC date seed and no custom premise; custom cases receive a short, non-secret share code. Shared URLs show a case preview and create a separate play session; never share progress or solution before an accusation.
10. **Difficulty-aware scoring:** server calculates score from correct accusation, difficulty, discovered clues, evidence links, question depth, hints used, and whether accusation was correct. The client never submits a score.
11. **Explicit practice demo:** the home page provides a clearly labeled, hand-crafted case that can be opened without Gemini. AI generation never silently substitutes this demo when Gemini is unavailable.

### Optional enhancement (post-MVP)

- Persist daily leaderboard with privacy-preserving display names.
- More languages and generated art.
- Export/share a spoiler-safe case summary.
- User accounts and cross-device history.

## 4. User journey and navigation

1. Player lands on Home and chooses **Create a case** or **Daily case**.
2. For a custom case, player enters a premise (20–500 chars) and chooses a difficulty.
3. Frontend sends a validated request. A progress view announces generation steps; duplicate submissions are disabled.
4. Backend asks Gemini for schema-constrained case content, validates it, and runs integrity checks. On failure, return a retryable error; never substitute a bundled mystery.
5. Player investigates: reveal clues, review suspects, link evidence, interview suspects, add notes, view timeline, and request hints.
6. Player opens the accusation sheet, chooses one suspect, and confirms.
7. Backend locks the case, scores the submitted activity against server state, and returns the verdict and explanation.
8. Results offer a new case and a spoiler-safe share option.

Navigation states: Home → Create/Daily → Investigation → Accusation → Results. Refreshing a case URL reloads public gameplay state. A result is immutable. Back navigation must not silently discard a case.

## 5. Screens and interaction specifications

### Home

- Brand mark/name, concise premise, feature overview, primary create action, daily challenge card.
- Explain that cases are fictional and hints affect score.
- Accessible focus order; no automatic audio or animation.

### Create case

- Premise textarea with character counter, difficulty cards with clear descriptions, generate action.
- Daily challenge path skips premise.
- Inline validation and a cancellable/retryable loading state.

### Investigation room

- Case header (title, difficulty, elapsed time), story, progress, suspect roster, evidence drawer/board, interview panel, hint control, journal/timeline.
- Show discovered vs locked clues without exposing locked text.
- Evidence board supports linking a discovered clue to a suspect; connections can be removed.
- Interview controls show available follow-ups and mark asked questions.
- Hints reveal one at a time and clearly show score cost.
- On mobile, panels become tabs/accordions; primary action remains easy to reach.

### Accusation

- Review discovered evidence and suspect list.
- Require explicit confirmation; explain that accusation is final and hints have a score cost.
- Submit only suspect ID; server uses stored state.

### Results

- Clear correct/incorrect verdict, actual culprit, evidence-based solution, score and breakdown, case summary, replay and spoiler-aware share actions.
- Show score as a game metric, not a measure of real-world skill.

### Global states

- Loading skeleton and progress status during generation.
- Empty state for no clues discovered, no journal entries, or no links.
- API errors include a plain-language message, retry action when safe, and no stack trace or secret.
- Offline/network failure preserves current UI state and gives a retry option.
- Respect reduced motion, visible focus, contrast, labels, and touch targets. Responsive breakpoints: narrow <640px, medium 640–1023px, wide ≥1024px.

## 6. Mystery data model and fairness

### Generated case (private server record)

- `caseId`, `shareCode`, `createdAt`, `expiresAt`, `difficulty`, `premise`, `title`, `setting`, `opening`.
- Suspects: stable ID, name, description, motive, opportunity, public alibi, optional portrait color.
- Clues: stable ID, title, visible text, location, related suspect IDs, relevance, unlock condition.
- Interviews: suspect ID, ordered question nodes with IDs, prompt, response, optional prerequisites, next question IDs.
- Hints: three ordered strings.
- Private solution: culprit ID, motive, method, timeline, explanation, clue-to-solution mapping.
- Server activity: discoveries, links, asked questions, hints, notes, accusation, score.

### Fairness requirements

- Exactly one culprit, present in suspects.
- At least three plausible suspects; red herrings must be explainable.
- Each clue references known suspects and contributes to or reasonably distracts from a deduction.
- The explanation must cite at least two discoverable clues.
- Hints must escalate from broad direction to a specific connection without stating the culprit prematurely.
- Interviews cannot contradict the canonical timeline or solution.
- Validate all references and lengths before storing. Retry generation once for invalid output; then return a clear error.

## 7. Architecture and technology

### Frontend

- React, Vite, TypeScript, Tailwind CSS.
- React Router for routes; TanStack Query or a small typed API client for requests.
- Zod shared contracts where practical; validate server responses at the boundary.
- Environment variable `VITE_API_BASE_URL`; no Gemini/database secrets in frontend variables.
- Routes: `/`, `/create`, `/daily`, `/case/:caseId`, `/case/:caseId/accuse`, `/case/:caseId/results`, `/share/:shareCode`.

### Backend

- Node.js, Express, TypeScript, Mongoose, MongoDB.
- `@google/genai` for Gemini with JSON-schema output, bounded timeout, and one repair attempt.
- Zod request validation and generated data validation.
- Service layers: case generation, case repository, investigation actions, scoring, daily challenge.
- Secrets read only from server environment: `GEMINI_API_KEY`, `MONGODB_URI`.
- Store solution and internal scoring metadata in private fields never serialized by public DTOs.
- API routes under `/api/v1`; health endpoint `/health`.

### Persistence strategy

- MongoDB Atlas is canonical in production.
- Support local MongoDB for development.
- If database is not configured, allow a clearly documented in-memory development mode; data is ephemeral and daily seed behavior remains deterministic.
- Persist only necessary activity; apply TTL expiry to anonymous cases.

## 8. API contract

All requests/responses use JSON. Errors use `{ error: { code, message, retryable } }`.

- `GET /health` — liveness, version, database status (no credentials).
- `POST /api/v1/cases` — `{ premise, difficulty }`; return public case and case ID.
- `POST /api/v1/daily` — `{}`; return today's public daily case/session.
- `GET /api/v1/cases/:caseId` — public case, player activity, phase; never solution.
- `POST /api/v1/cases/:caseId/discoveries` — `{ clueId }`; idempotent reveal.
- `POST /api/v1/cases/:caseId/links` — `{ clueId, suspectId, linked }`; validate both IDs.
- `POST /api/v1/cases/:caseId/interviews` — `{ suspectId, questionId }`; enforce node availability and return response plus choices.
- `POST /api/v1/cases/:caseId/hints` — `{}`; reveal next hint, at most three.
- `POST /api/v1/cases/:caseId/notes` — `{ text }`; bounded journal note.
- `POST /api/v1/cases/:caseId/accusations` — `{ suspectId }`; atomically finalize, return result.
- `GET /api/v1/share/:shareCode` — spoiler-safe case preview.
- `POST /api/v1/share/:shareCode/play` — create independent session from shared case if supported.

Apply CORS allowlist, request size limits, rate limiting on generation/interview endpoints, and generic production errors.

## 9. Scoring rules

The server computes a 0–100 score only after accusation:

- Base correct accusation: 60 points; incorrect accusation: 0 base points.
- Difficulty multiplier: easy 1.0, medium 1.15, hard 1.3, applied to earned non-hint points.
- Up to 20 investigation points for discovered clues (weighted by relevance, capped).
- Up to 10 points for evidence links that match the case's privately stored relevant mappings; incorrect links earn zero.
- Up to 10 points for meaningful interview branches completed.
- Hint penalties: 5 / 10 / 15 points cumulatively for first/second/third hint.
- Incorrect accusation applies a 15-point penalty after other components; final score clamped 0–100.
- Return transparent component breakdown. The client cannot alter activity, difficulty, correctness, or score.
- Tests must cover caps, penalty order, difficulty multiplier, hint usage, and incorrect accusation.

## 10. Security, privacy, and reliability

- Never return or log Gemini key, database URI, full private solution, raw provider response, or stack trace in production.
- Strict Zod validation and output encoding; bounded prompt and note sizes.
- Use opaque random case IDs and rate limits; share codes reveal only spoiler-safe content.
- Configure secure headers, CORS origins, JSON size limits, and safe error middleware.
- Do not put user premise into executable instructions; constrain generation to the case schema.
- Keep generation prompt server-side and tell the model not to expose chain-of-thought; request concise rationale fields only.
- Avoid collecting personal data; journal notes remain on the case record and are private.
- Set case retention/TTL, disclose ephemeral local mode, and provide user-triggered delete action if time allows.
- Production uses HTTPS and environment-managed secrets.

## 11. Testing and acceptance criteria

- Unit: Zod contracts, score calculations, output sanitization, case integrity.
- API integration: request validation, generation success/failure, discovery, branching interviews, hint limit, immutable accusation, secret-free DTOs.
- Frontend: core route rendering, create validation, loading/error state, investigation action feedback, result display.
- End-to-end smoke: create a case (stubbed AI acceptable), investigate, accuse, view results.
- Manual responsive/accessibility review at mobile and desktop sizes.

Acceptance criteria:

1. Custom and daily case flows can be completed.
2. No client bundle, API response before accusation, or public share response contains culprit/solution fields.
3. Every accepted action is validated against the selected case.
4. Accusation happens once and score is calculated server-side from stored activity.
5. Difficulty, hints, evidence links, and interviews affect a disclosed score breakdown as specified.
6. The UI handles generation failure and slow network with useful recovery actions.
7. Automated tests pass and README documents local setup and production deployment.

## 12. Deployment and operations

### Local development

- Node.js LTS and npm.
- `npm install`, copy `.env.example` to `.env`, configure optional Gemini key and MongoDB URI.
- `npm run dev` starts frontend/backend; `npm run test` runs automated checks.
- Require a Gemini API key to create custom or daily cases; never silently use a hand-authored replacement.

### Production

- **Frontend:** Vercel, build the Vite app from repository root or frontend workspace, SPA rewrite to `index.html`, set `VITE_API_BASE_URL`.
- **API:** Render web service, Node runtime, health check `/health`, set `GEMINI_API_KEY`, `MONGODB_URI`, `CLIENT_ORIGIN`, `NODE_ENV=production`.
- **Database:** MongoDB Atlas, restricted network access, least-privilege app user, URI in Render environment only.
- Configure CORS origins after frontend URL is known; verify health, case generation, gameplay, and result flow against production.
- Deployment is complete only when a live URL is tested end-to-end and reported with its verification date.

## 13. Implementation stages

1. Establish this specification and repository layout.
2. Implement shared schema, case model, and pure scoring service with tests.
3. Build API, persistence adapter, Gemini integration, and retryable error handling.
4. Build responsive frontend and typed API interactions.
5. Add deployment files, README, and environment template.
6. Run automated checks, fix failures, inspect the production build, and perform a local end-to-end smoke flow.
7. Deploy only when account credentials/permissions are available; verify the public flow before reporting completion.
