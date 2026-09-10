# 2-Day Execution Plan: Full-Stack AI Interview Prep Kit Generator

## 1. System Design Architecture
The system is built as a set of decoupled, modular services to ensure resilience, strict schema compliance, and fast execution:
─────────────────────────────────────────────────────────────────────────────┐
│                           1. FRONTEND GATEWAY                               │
│                   Next.js App Router (Dashboard & Kit Builder)              │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
                        ▼                             ▼
┌──────────────────────────────────────┐    ┌──────────────────────────────────┐
│   SERVICE 1: AUTH & IDENTITY         │    │  SERVICE 2: INGESTION & CRAWLER  │
│ Session / JWT / User Kits Isolation  │    │ SSRF Guard, Cheerio, Link Ranker │
└──────────────────────────────────────┘    └──────────────────────────────────┘
                            │                             │
                            └──────────────┬──────────────┘
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SERVICE 3: LLM PIPELINE ENGINE                          │
│     Rate Limit Queue (p-queue) ──> Structured Extraction ──> Second Pass    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              SERVICE 4: DETERMINISTIC CORE (STRICT NO-AI ZONE)              │
│       Coverage Gap Array Matching  &  Arithmetic Schedule Allocation         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  SERVICE 5: PERSISTENCE & MERGE ENGINE                      │
│     MongoDB Storage + Section Regeneration Merge (Preserve Edited/Custom)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  SERVICE 6: BATCH CLI EVALUATOR (Headless)                  │
│       Executes Pipeline 2 ──> 3 ──> 4 for Appendix B (npm run evaluate)    │
└─────────────────────────────────────────────────────────────────────────────┘


---

## 2. STRICT AI CONSTRAINTS (What NOT to do with AI)

To pass automated evaluation and human review, the following responsibilities **MUST NOT** be delegated to the LLM model:

1. **Schedule Allocation Math (Section 3 & 8):**
   - **DO NOT** ask the LLM to generate schedules, map topics to days, or calculate duration minutes.
   - **MUST BE** calculated deterministically using pure TypeScript arithmetic based on priority, difficulty, and `days_available`.
2. **Coverage Gap Detection (Section 3 & 4):**
   - **DO NOT** use an LLM prompt to check if requirements are missing.
   - **MUST BE** computed using pure array filtering that compares `must` requirement IDs against question `requirement_ids`.
3. **Requirement Invention on Thin Input (Section 10):**
   - **DO NOT** let the LLM hallucinate requirements when given a short or 2-line job description.
   - **MUST** strictly instruct the LLM to report thin descriptions honestly.
4. **Data Formatting & Durations (Section 5 & Appendix A):**
   - **DO NOT** allow the LLM to return float durations or text strings for `minutes` (e.g., "1.5 hours" or "about 60 mins").
   - **MUST** enforce schema validation using `Zod` to guarantee integer minutes and `difficulty` values between `1` and `3`.

---

## 3. Granular 48-Hour Implementation Plan

### Phase 1: Core Backend Services & CLI Evaluator (Hours 0 – 12)

#### Task 1.1: Project Setup & Types
- Initialize a Node.js + Express + TypeScript workspace.
- Define strict TypeScript interfaces matching **Appendix A** and **Appendix B** schemas exactly.
- Set up `.env.example` with `MONGODB_URI`, `GEMINI_API_KEY`, `PORT`, `JWT_SECRET`, and `NODE_ENV`.

#### Task 1.2: Service 2 — Ingestion & SSRF-Safe Web Scraper (`src/services/scraper.ts`)
- Implement SSRF URL protection that blocks private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`), with an explicit bypass when `NODE_ENV === 'test'` to support local evaluation hosts (e.g., `http://localhost:8099/acme/`).
- Use `cheerio` + `axios` to crawl the landing page and rank internal links by relevance (`/careers`, `/jobs`, `/about`, `/handbook`, `/culture`, `/engineering`).
- Support relative URL resolution and relative link navigation.
- Implement exponential backoff for rate limits; handle `404` or unreachable sites by recording the error gracefully rather than throwing a fatal crash.

#### Task 1.3: Service 3 — LLM Pipeline Engine (`src/services/llm.ts`)
- Wrap Gemini API SDK using `p-queue` to control Token Per Minute (TPM) rates and auto-retry on HTTP `429`.
- Enclose untrusted user inputs (JD and scraped pages) within strict XML delimiter tags (`<job_description>`, `<scraped_text>`) to prevent prompt injection attacks.
- Implement step-by-step sequential prompts:
  1. Extract structured requirements (`r1`, `r2`) marked as `must` vs `nice` and `technical` vs `behavioural`.
  2. Generate questions categorized into `technical`, `behavioural`, `system-design`, and `company-fit`.
  3. Generate flashcards linked to requirement IDs.

#### Task 1.4: Service 4 — Deterministic Core (`src/services/deterministic.ts`)
- **Coverage Gap Checker:** Compare `must` requirement IDs against question `requirement_ids`. If uncovered IDs exist, trigger a second pass to generate targeted missing questions until full coverage or maximum loop threshold is met.
- **Arithmetic Schedule Allocator:** Sort questions by priority (`must` > `nice`) and difficulty (`3` > `2` > `1`). Distribute them across `days_available` so that higher priority topics land in earlier days. Ensure durations are strictly integer minutes.

#### Task 1.5: Service 6 — Batch CLI Evaluator (`npm run evaluate`)
- Create CLI script accepting `--input <cases.json>` and `--output <kits.json>`.
- Run cases in parallel using `p-queue` (max concurrency: 2).
- Complete 5 test cases in under 15 minutes.
- Catch errors per case, record `status: "failed"` with structured `error` objects in Appendix B format, and continue processing remaining cases.

---

### Phase 2: Persistence, APIs & State Management (Hours 12 – 24)

#### Task 2.1: Authentication & Data Persistence
- Implement MongoDB Mongoose schemas for `User` and `Kit`.
- Add authentication endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`) with JWT/session validation.
- Secure endpoints so users can read/modify only their own kits.

#### Task 2.2: REST APIs & Single-Section Regeneration
- Create API routes: `POST /api/kits`, `GET /api/kits`, `GET /api/kits/:id`, `PUT /api/kits/:id`, and `POST /api/kits/:id/regenerate`.
- **State Merge Logic:** Tag kit items with metadata (`is_edited`, `is_custom`). When regenerating a single section (e.g., technical questions), delete only unedited generated items, execute the LLM pass, and merge new questions while preserving all edited (`is_edited: true`) and manually added (`is_custom: true`) items.

---

### Phase 3: Frontend Interface & Practice Mode (Hours 24 – 36)

#### Task 3.1: Dashboard & Generation Progress UI
- Build form accepting pasted Job Description, Company URL, and Days slider.
- Support multi-role setup via CSV/JSON file upload.
- Display generation steps with visible progress indicators and explicit error handling states.

#### Task 3.2: Kit Builder Interface
- Build interactive sections for Company Brief, Requirements, Questions, Flashcards, and Schedule.
- Implement inline text editing, item reordering, item deletion, and hand-adding questions/flashcards.
- Provide a "Regenerate Section" button for isolated section refreshes without wiping external edits.

#### Task 3.3: Flashcard Practice Mode
- Create an interactive card-flip interface.
- Add self-assessment confidence scoring ("Low", "Medium", "High").
- Sort the next review queue dynamically based on lowest confidence score.

---

### Phase 4: Automated Testing, Deployment & Deliverables (Hours 36 – 48)

#### Task 4.1: Automated Unit & Integration Tests
- Write Jest tests for:
  1. **Schedule Allocator Math:** Verifies exact integer minute totals and day spans.
  2. **Coverage Gap Checker:** Verifies detection of unmapped `must` requirements.
  3. **Schema Validator:** Verifies Appendix A output compliance.

#### Task 4.2: Edge Case Auditing
- Validate 2-line stub JDs (ensure thin kit output without hallucination).
- Validate unreachable URLs / 404s (ensure clean error tracking).
- Validate 1-day vs 60-day schedules.

#### Task 4.3: Deployment & Walkthrough Video
- Deploy Frontend (Next.js) and Backend (Express + MongoDB) to public platforms (Vercel / Railway / Render).
- Record a 3–4 minute walkthrough video covering:
  1. Kit generation from JD + URL.
  2. Research pipeline & second-pass coverage resolution.
  3. Inline editing, reordering, and section regeneration with state preservation.
  4. Flashcard practice mode & schedule.
  5. Key system design decision explanation.
- Document deployment URLs, setup steps, and architecture details in `README.md`.