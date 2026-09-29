prd.md

# Product Requirements Document (PRD)

## ExamSetu AI: Intelligent On-Screen Marking & Evaluation Ecosystem

|                         |                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **Challenge**           | AI-Driven Examination & On-Screen Marking Transformation, MPOnline Idea & Innovation Hackathon 2026 |
| **Document status**     | Draft v1.1                                                                                          |
| **Date**                | 30 September 2026                                                                                   |
| **Companion documents** | techstack.md, backend.md, frontend.md, database.md (all technical detail lives there, not here)     |

---

## 1. Summary

ExamSetu AI is an AI-augmented On-Screen Marking (OSM) and digital evaluation
platform for university-scale examinations. Most OSM systems in use today only
digitize the answer sheet. ExamSetu AI adds an intelligence layer on top: it
assists the _judgment_ part of evaluation (reading, scoring support, anomaly
detection, moderation, analytics) while **the human examiner remains in final
control of every mark**.

**Product principle:** _AI suggests, the human decides, the system records
everything._

Written examinations have answers that can be expressed in many valid ways.
ExamSetu AI therefore **does not depend on a fixed model answer key**. It
supports the examiner's judgment rather than matching answers against a single
"correct" version.

## 2. Background and Problem

Universities run large-scale examinations covering answer-sheet evaluation,
moderation, result preparation and quality assurance. Manual evaluation is slow,
examiner-dependent and opaque, so quality is hard to hold steady as student
volumes grow and evaluation windows shrink.

| Pain point                | Root cause                                       | Consequence                                             |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Slow evaluation cycles    | Fully manual, sheet-by-sheet reading and marking | Delayed results; backlog before re-exams and admissions |
| Inconsistent marking      | No visibility into examiner-to-examiner variance | Student grievances; re-evaluation load                  |
| Missed or skipped answers | Examiner fatigue over long sessions              | Unfair scores; appeals                                  |
| Illegible handwriting     | No assistive reading tools                       | Misreading; wrong marks                                 |
| Malpractice / bias        | No systematic anomaly detection                  | Undetected favoritism, lenient or harsh graders         |
| Opaque progress           | No real-time visibility for controllers          | Issues found only after results are out                 |

## 3. Goals and Non-Goals

### 3.1 Goals

1. Cut per-sheet evaluation time without reducing examiner authority.
2. Improve marking consistency across examiners, with variance visible in real
   time.
3. Eliminate unintentionally unchecked or skipped answers before a sheet is
   marked complete.
4. Surface unusual scoring patterns and possible malpractice for review.
5. Give exam controllers live visibility of progress, load and deadline status.
6. Produce a tamper-evident, digitally signed audit trail for every mark and
   change.
7. Shorten the path from evaluation completion to result publication.
8. Support both English and Hindi answer scripts.

### 3.2 Non-Goals

- **Autonomous grading.** The AI never finalizes a mark; every mark requires
  examiner confirmation or override.
- **Requiring a model answer key.** Answers to written questions vary, so none
  is mandated.
- Physical scanning hardware and logistics (the platform works from scanned
  sheets).
- Replacing the university's existing student or result-publication systems.
- Proctoring or in-exam surveillance.

## 4. Users

| User                | Needs                                                                                                | How ExamSetu AI helps                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Examiner**        | Faster, less fatiguing, better-supported marking; ability to work comfortably from a tablet or phone | Evaluation support with suggested score bands, handwriting assistance, skipped-answer alerts, mobile use   |
| **Exam Controller** | Real-time visibility, quality assurance, early intervention, control over moderation                 | Live progress view, examiner analytics, anomaly and malpractice flags, moderation rules, result tabulation |
| **Admin**           | Manage users, roles, exams and system settings                                                       | Role and access management, exam/paper setup, configuration, audit access                                  |

A "second examiner" for moderation is simply another Examiner assigned by the
Controller's rules; it is not a separate user type.

## 5. Scope of Features

The ten capability areas requested in the challenge brief, mapped to ExamSetu AI
features:

| #  | Challenge feature                                  | ExamSetu AI feature                                                                      | Priority |
| -- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| 1  | AI-assisted answer evaluation                      | Suggested score band with confidence for each answer, without needing a model answer key | P0       |
| 2  | Detection of unchecked answers / marking anomalies | Detection of blank, skipped or unmarked answer areas and missing signatures              | P0       |
| 3  | Examiner performance analytics                     | Per-examiner speed, consistency and drift tracking                                       | P0       |
| 4  | Smart moderation workflows                         | Risk-based routing of borderline or high-variance sheets to a second examiner            | P0       |
| 5  | Handwriting recognition assistance                 | Enhanced reading and transcription of handwriting in English and Hindi                   | P0       |
| 6  | AI-generated evaluation summaries                  | Per-sheet and per-batch summaries                                                        | P1       |
| 7  | Real-time evaluation dashboards                    | Live completion, examiner load and deadline status                                       | P0       |
| 8  | Malpractice / unusual scoring detection            | Statistical detection of unusual examiner scoring patterns                               | P1       |
| 9  | Faster result processing                           | Digitally signed tabulation ready for result publication                                 | P1       |
| 10 | Mobile-enabled examiner interface                  | Evaluation on tablet and phone through a responsive interface                            | P1       |

## 6. Functional Requirements

### 6.1 Exam and Script Setup

- **FR-1.1** Admin creates exams, papers and examiner assignments.
- **FR-1.2** Scanned answer scripts are uploaded and organized by exam, paper
  and anonymized script ID.
- **FR-1.3** The question paper is attached to each paper. Reference material
  such as a marking scheme, rubric or key points is **optional** and may be
  added if the university has it; nothing else is required from the university
  to start evaluating.
- **FR-1.4** Each script is divided into answer regions per question so
  evaluation and checks work question by question.

### 6.2 Handwriting Assistance

- **FR-2.1** Handwritten answers in English and Hindi are converted to readable
  text as a reference for the examiner.
- **FR-2.2** The examiner can always view the original scan; the transcription
  is an aid, never the source of truth.
- **FR-2.3** Low-confidence readings are clearly flagged so the examiner knows
  where to look closely.

### 6.3 AI-Assisted Evaluation Support

- **FR-3.1** For each answer, the system suggests a **score band** (a range, not
  a single value) with a confidence indicator.
- **FR-3.2** Suggestions are based on the question itself and on any optional
  reference material. Where none is supplied, the system also draws on marks the
  examiner has already awarded on that paper, so support improves as evaluation
  progresses.
- **FR-3.3** Because written answers can be correct in many different ways, the
  AI does not treat any single answer as the only right one, and never penalizes
  an answer merely for being worded differently.
- **FR-3.4** Answers where the AI has low confidence are marked "manual
  evaluation recommended".
- **FR-3.5** **Diagram answers:** the system detects whether a diagram or figure
  is present in an answer and flags when the question calls for one and none is
  found. Judging the quality and correctness of a diagram remains entirely with
  the examiner.
- **FR-3.6** The examiner must explicitly confirm or override every suggestion.
  No mark is recorded without this action.
- **FR-3.7** Overrides capture a reason (mandatory when the final mark falls
  outside the suggested band).

### 6.4 Anomaly and Completeness Detection

- **FR-4.1** Detect blank, unchecked or skipped answer areas before a sheet can
  be marked complete.
- **FR-4.2** Detect missing signatures where required.
- **FR-4.3** A sheet with unresolved flags cannot be completed silently; the
  examiner must resolve or acknowledge each flag.

### 6.5 Smart Moderation

- **FR-5.1** Each sheet receives a risk score from factors such as borderline
  totals, unusual variance, divergence between AI suggestion and examiner mark,
  and raised flags.
- **FR-5.2** Sheets above the risk threshold are automatically assigned to a
  second examiner.
- **FR-5.3** Both evaluations and the reconciliation outcome are recorded.
- **FR-5.4** The Controller can configure thresholds and moderation rules.

### 6.6 Examiner Analytics and Malpractice Detection

- **FR-6.1** Track marking time, throughput, average marks awarded, spread of
  marks and drift over a session for each examiner.
- **FR-6.2** Compare each examiner against peers evaluating the same paper.
- **FR-6.3** Flag unusual patterns such as uniform marks, persistent leniency or
  harshness, or suspicious clustering, and explain why each flag was raised.
- **FR-6.4** Flags are advisory: they trigger human review, never automatic
  penalties.

### 6.7 Real-Time Monitoring

- **FR-7.1** Controllers see live completion percentage, examiner workload,
  pending moderation and deadline status per subject and college.
- **FR-7.2** Score distribution, timing and flag summaries are available by
  examiner, subject and batch.

### 6.8 Evaluation Summaries

- **FR-8.1** Generate a per-sheet summary: marks by question, flags raised,
  overrides and moderation outcome.
- **FR-8.2** Generate a per-batch or per-subject summary for Controllers:
  completion, consistency and anomalies.

### 6.9 Mobile Use

- **FR-9.1** Examiners can evaluate on a tablet or phone.
- **FR-9.2** Marks are saved automatically as the examiner works, so a dropped
  connection does not lose completed work.

### 6.10 Results and Audit

- **FR-10.1** Every mark, change, override, flag and moderation decision is
  recorded in a tamper-evident, digitally signed audit trail.
- **FR-10.2** Finalized marks are tabulated and exported in a digitally signed
  form for result publication.
- **FR-10.3** The audit trail can be searched by sheet, examiner and time
  period.

### 6.11 Roles and Access

- **FR-11.1** Three roles: Examiner, Exam Controller, Admin, each seeing only
  what its role needs.
- **FR-11.2** Examiners see anonymized scripts only; linking scripts to student
  identity is restricted to authorized roles.

## 7. Non-Functional Requirements

| Area                   | Requirement                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| **Security & privacy** | Scans and scores protected in storage and transit; least-privilege access; tamper-evident audit trail |
| **Data residency**     | Must be deployable on government-approved infrastructure with student data kept within it             |
| **Scalability**        | Handles state-level volumes; evaluation load must not degrade the examiner experience                 |
| **Performance**        | AI suggestions appear fast enough not to slow the examiner; live views refresh within seconds         |
| **Reliability**        | No lost marks; work is saved automatically as the examiner goes                                       |
| **Usability**          | Confirm/override is quick and low-effort; comfortable for long evaluation sessions on a tablet        |
| **Auditability**       | Every action is attributable and timestamped                                                          |
| **Language**           | English and Hindi answer scripts supported                                                            |

_Implementation choices (technology stack, services, data storage, interface
design) are covered in the companion files: techstack.md, backend.md,
frontend.md and database.md._

## 8. Success Metrics

| Metric                    | Definition                                                 | Target (pilot)                                                |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Evaluation time per sheet | Median examiner time vs. manual baseline                   | 30% or more reduction                                         |
| Suggestion agreement      | % of AI score bands that contain the examiner's final mark | 80% or more                                                   |
| Flag precision            | % of anomaly flags confirmed genuine on manual review      | 85% or more                                                   |
| Missed-answer incidents   | Sheets found with unmarked answers after completion        | Approaches zero                                               |
| Inter-examiner variance   | Spread of marks on shared calibration sheets               | Reduction vs. baseline                                        |
| Moderation efficiency     | % of second evaluations that changed the outcome           | Higher than random sampling                                   |
| Re-evaluation requests    | Requests per 1,000 students                                | Reduction vs. prior cycle                                     |
| Result turnaround         | Days from exam end to publication                          | Reduction vs. prior cycle                                     |
| Override rate             | % of AI suggestions overridden                             | Monitored, not minimized (guards against over-reliance on AI) |

_These are proposed pilot targets to be validated during the proof of concept,
not measured results._

## 9. Prototype (Hackathon MVP) Scope

**Working end-to-end on sample scripts:**

1. Upload a sample scanned script and question paper (marking scheme optional).
2. Handwriting in English and Hindi converted to readable text.
3. Suggested score band with confidence indicator, including diagram-presence
   check.
4. Examiner confirms or overrides; override and reason are logged.
5. Blank/skipped-answer detection on a test sheet with intentional gaps.
6. Flagged sheet automatically routed to a second examiner.
7. Analytics: score distribution, timing and flag summary per mock examiner.
8. Malpractice flag on a mock examiner with deliberately unusual marking.
9. Mobile view of the examiner workflow.
10. Digitally signed export of finalized marks.

**Demo walkthrough:**

| Step | What is shown                                                      |
| ---- | ------------------------------------------------------------------ |
| 1    | Controller view: scripts uploaded, live progress                   |
| 2    | Examiner view: scan, readable handwriting and suggested score band |
| 3    | Examiner overrides a suggestion; change logged with reason         |
| 4    | Skipped answer flagged on a test sheet                             |
| 5    | Flagged sheet routed to a second examiner                          |
| 6    | Analytics and malpractice flag for a mock examiner                 |
| 7    | Same examiner flow on a mobile device                              |
| 8    | Signed result export                                               |

**Validation approach:** compare AI-suggested bands with the marks human
examiners assign on a small anonymized sample; report agreement rate and flag
precision.

## 10. Prototype Coverage of Claimed Features

Three features claimed in the solution documents were not covered by the
original prototype plan: **malpractice detection, the mobile examiner interface,
and faster result processing**. They are now included in the prototype scope
above (items 8, 9 and 10), even if in minimal form, so that every headline claim
is backed by something demonstrable and the prototype score is not weakened by
missing features.

## 11. Risks and Mitigations

| Risk                                                            | Impact                            | Mitigation                                                                                                   |
| --------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Poor handwriting, in English or Hindi, reduces reading accuracy | Weaker suggestions; loss of trust | Original scan always visible; confidence flags; manual fallback                                              |
| Varied valid answers make suggestions unreliable                | Misleading score bands            | Bands rather than exact marks; low-confidence fallback; optional rubrics; learning from examiner's own marks |
| Diagram answers cannot be judged automatically                  | Missed quality issues             | AI only checks presence; examiner judges quality                                                             |
| Over-reliance on AI suggestions                                 | Reduced examiner independence     | Bands not points; override-rate monitoring; reasons required for deviations                                  |
| False-positive malpractice flags                                | Unfair scrutiny of examiners      | Advisory only; transparent reasons; human review                                                             |
| Examiner adoption resistance                                    | Low usage                         | Training; visible time savings; examiner stays the decision-maker                                            |
| Unstable connectivity at evaluation centres                     | Interrupted work                  | Automatic saving and retry as the examiner works                                                             |
| Data privacy or leakage                                         | Legal and reputational harm       | Anonymized scripts, strict role access, government-approved hosting                                          |
| Accuracy varies across subjects and years                       | Declining quality                 | Per-subject calibration and ongoing agreement monitoring                                                     |

## 12. Alignment with Judging Criteria

| Criterion                               | Weight | How this product addresses it                                                                                                              |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Innovation & Originality                | 20%    | Moves OSM from digitization to _assisted judgment_, with no answer-key dependency and a human-in-the-loop guarantee enforced in the system |
| Problem Understanding                   | 15%    | Six-part pain-point breakdown, each with a matching fix; clear user roles                                                                  |
| Technical Feasibility                   | 15%    | Practical approach detailed in techstack.md, backend.md, frontend.md and database.md                                                       |
| Prototype / MVP                         | 20%    | Working end-to-end evaluation-assist loop covering all headline features (§9, §10)                                                         |
| Impact on Higher Education / Governance | 15%    | Faster results, fairer marking, auditable evaluation; supports Digital India and Viksit Bharat 2047                                        |
| Scalability & Sustainability            | 10%    | Built for university- to state-level volumes and replication                                                                               |
| Presentation & Demo                     | 5%     | Eight-step scripted demo following an examiner's real workflow                                                                             |

## 13. Rollout Plan

| Phase                        | Scope                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| **0. Hackathon MVP**         | Core evaluation-assist loop on sample scripts (§9)                                            |
| **1. Pilot**                 | One university, one or two subjects (theory and diagram-based); calibrate; measure §8 metrics |
| **2. Institutional rollout** | More subjects; moderation, analytics and monitoring in production; mobile refinements         |
| **3. State-level scale**     | Multiple universities; shared analytics for the state Higher-Education Department             |

## 14. Scope Decisions

| Question                                      | Decision                                                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Which question types are in scope?            | Theory answers **and** diagram-based answers                                                                                             |
| Who supplies model answer keys?               | None required. Written answers vary, so evaluation support does not depend on a model answer key. A marking scheme or rubric is optional |
| Which languages are supported?                | English and Hindi                                                                                                                        |
| Integration with existing university systems? | No specific integration constraints at this stage                                                                                        |

## 15. Open Questions

1. What turnaround times (evaluation and result publication) does the university
   expect?
2. What legal or regulatory requirements apply to AI-assisted evaluation and to
   retaining scanned scripts?
3. Which digital-signature scheme is mandated for published results?

## 16. Glossary

- **OSM:** On-Screen Marking, evaluation of digitized answer sheets on a screen.
- **Score band:** A suggested range of marks rather than a single value.
- **Moderation:** Second evaluation or review of borderline or inconsistent
  sheets.
- **Rubric / marking scheme:** Optional guidance on what earns marks for a
  question; not a fixed model answer.
