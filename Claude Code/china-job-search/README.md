[中文](./README.zh-CN.md)

# China Job Search

China Job Search is a local-first Claude Code plugin for the complete Mainland China job-search cycle: candidate profiling, job discovery, qualification and fit analysis, tailored application materials, interview preparation, offer comparison, follow-up, and outcome tracking.

It carries forward the strongest workflow ideas from [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search)—structured local data, reusable evidence, job-specific documents, independent review, and continuous feedback—while replacing Denmark-specific assumptions with Mainland China recruitment tracks, channels, privacy considerations, document conventions, and risk checks.

The plugin supports social recruitment, campus recruitment, internships, and market-based SOE recruitment. It is not designed for civil-service or public-institution examinations.

## How the workflow fits together

```text
Set up workspace and profile
          ↓
Find or import jobs → Normalize and deduplicate → Check eligibility and rank fit
                                                        ↓
Track outcomes ← Prepare interviews ← Review and produce application materials
       ↓
Follow up, compare offers, identify skill gaps, and refine the next search
```

All personal data and generated artifacts stay in a local `job-search-cn/` workspace. The plugin prepares decisions and drafts; you remain responsible for final review, submission, and communication.

## Core features

- **Evidence-based candidate profile:** imports a resume, profile URL, or guided answers; records the source and confidence of important claims; keeps sensitive application-only fields out of the public resume.
- **China-specific job discovery:** handles employer career sites, public institution and university employment pages, public search results, and user-supplied links or job descriptions. It distinguishes social, campus, internship, and market-based SOE tracks.
- **Normalized local job store:** converts varied job descriptions into a consistent schema, preserves source URLs and timestamps, and detects duplicates or stale listings.
- **Eligibility before fit:** checks graduation window, degree, major, work authorization, location, experience, language, certificates, and other hard requirements before assigning a fit score.
- **Explainable ranking:** separates must-haves from preferences, highlights evidence and gaps, and avoids false precision when salary or requirements are undisclosed.
- **Application package generation:** drafts Chinese or bilingual resumes, application-form answers, email bodies, platform opening messages, and optional cover letters without inventing facts.
- **Independent review:** a separate reviewer checks factual support, tailoring, clarity, risk, and delivery readiness before the final package is accepted.
- **PDF and ATS checks:** the bundled XeLaTeX templates support Chinese text; optional Poppler checks page count and extractable text.
- **Interview and assessment preparation:** generates role-specific question banks, STAR evidence maps, company research tasks, written-test plans, and questions to ask the employer.
- **Closed-loop tracking:** records stages and outcomes, drafts follow-ups, compares offers, aggregates skill gaps, and generates a local HTML report.

## Safety and access boundaries

The plugin does not bypass logins, CAPTCHAs, robots rules, anti-bot controls, paywalls, or private APIs. For platforms that restrict automated access, use public search results, open the site manually, or paste the job URL/text into Claude Code. It never submits an application, accepts an offer, or sends a message automatically.

Treat requests for deposits, paid training, equipment purchases, account lending, identity-document originals, bank credentials, or off-platform transfers as high-risk signals. Always verify the employer and recruiter through official channels.

## Requirements

- Claude Code with plugin support
- Python 3.10+
- XeLaTeX with CTeX for the bundled PDF templates
- Optional but recommended: Poppler (`pdfinfo` and `pdftotext`) for PDF/ATS checks

The discovery and analysis workflow still works without XeLaTeX or Poppler; only the corresponding document checks are unavailable.

## Installation

### Install from this marketplace

Run these commands in a terminal:

```bash
claude plugin marketplace add greluoqixi/Skills
claude plugin install china-job-search@greluoqixi-skills
```

Then start Claude Code in the directory where you want to work.

### Run directly from a local clone

```bash
git clone https://github.com/greluoqixi/Skills.git
cd Skills
claude --plugin-dir "./Claude Code/china-job-search"
```

## Detailed usage: an end-to-end run

Commands below are deterministic entry points. You can also describe the same task in natural language. The reusable prompt examples deliberately use placeholders such as `<city>` and `<role>`—replace them with your situation.

### Step 1: create the workspace and candidate profile

Run:

```text
/china-job-search:setup
```

You can optionally provide a workspace path:

```text
/china-job-search:setup /absolute/path/to/job-search-cn
```

General prompt example:

```text
Help me create a local job-search workspace. Use my resume at <resume path> as the initial source, ask me only for missing high-value information, distinguish public resume facts from private application fields, and let me confirm the profile before saving it.
```

During onboarding, choose one of three routes: import an existing resume/document, import a public profile URL, or complete a guided interview. The result is a structured candidate profile, preferences, search configuration, and privacy-safe local workspace.

### Step 2: refresh the profile when your evidence changes

Run:

```text
/china-job-search:profile-refresh <resume path or public profile URL>
```

General prompt example:

```text
Refresh my candidate profile from <document or public URL>. Show additions, conflicts, and lower-confidence claims first. Do not overwrite confirmed facts until I approve the changes.
```

This step is optional on the first run, but useful after a new project, certificate, internship, performance result, or resume revision.

### Step 3: discover or import jobs

Run a broad or targeted search:

```text
/china-job-search:search <keywords, city, or recruitment track>
```

Examples:

```text
/china-job-search:search 北京 后端开发 社招
/china-job-search:search 2027届 算法工程师 校招 上海
```

General prompt example:

```text
Find currently open <social/campus/internship/SOE market-based> roles for <role family> in <cities>. Prioritize official employer pages, keep source links and publication or deadline dates, flag access restrictions, and do not bypass login or anti-bot controls.
```

If you already found a role, paste its URL or job description instead of searching. The plugin normalizes the result and asks before saving it to the local job store.

### Step 4: check eligibility and rank opportunities

Run:

```text
/china-job-search:rank all
```

Or rank selected saved job IDs:

```text
/china-job-search:rank <job-id-1> <job-id-2>
```

General prompt example:

```text
Evaluate my saved roles. Check hard eligibility before fit, separate must-haves from preferences, explain every important score with profile evidence, and return a shortlist grouped into apply now, verify first, and skip.
```

Review unknown requirements rather than treating them as passed. For campus roles, pay particular attention to graduation windows and student-status rules; for social recruitment, verify experience and role scope; for SOE market hiring, verify announcement-specific eligibility and deadlines.

### Step 5: create and review an application package

Run with a saved job ID, URL, local file, or pasted job description:

```text
/china-job-search:apply <job source>
```

General prompt example:

```text
Prepare an application package for <job URL or pasted JD>. First show eligibility, fit, gaps, and risk flags. After I confirm, tailor my resume and draft the required application fields and outreach message. Use only supported facts, then run an independent review and compile the final PDF if the toolchain is available.
```

The application workflow is deliberately gated:

1. Parse and normalize the job.
2. Check hard eligibility and identify missing information.
3. Explain fit, evidence, gaps, and risk signals.
4. Ask for confirmation before generating final materials.
5. Draft only the artifacts required by the channel.
6. Run an independent factual and quality review.
7. Compile and mechanically inspect the PDF when possible.
8. Archive the package and update the tracker only after your approval.

The plugin never fabricates experience or keywords and never submits the application for you.

### Step 6: prepare for assessments and interviews

Run:

```text
/china-job-search:interview <application-id> <stage>
```

Example:

```text
/china-job-search:interview app-20260801-001 technical
```

General prompt example:

```text
Prepare me for the <written test/HR/technical/manager/final> stage of application <application ID>. Base questions on the JD and my actual evidence, map reusable STAR stories, identify weak areas, include company-research tasks, and create a realistic practice plan for the next <number> days.
```

### Step 7: record outcomes, follow up, and compare offers

Record a stage or status:

```text
/china-job-search:outcome <application-id> <status>
```

Import a message or screenshot transcript:

```text
/china-job-search:outcome <application-id> import
```

Draft a follow-up:

```text
/china-job-search:outcome <application-id> followup
```

General prompt example:

```text
Update application <application ID> from this recruiter message: <paste text>. Extract only explicit facts, separate confirmed information from inference, identify the next action and deadline, and draft a concise follow-up for my approval without sending it.
```

For offers, ask Claude to compare fixed and variable compensation, statutory benefits, probation terms, overtime expectations, location, role scope, contract entity, non-compete terms, and unresolved questions—not merely the headline monthly salary.

### Step 8: learn from the search and review progress

Aggregate skill gaps:

```text
/china-job-search:upskill all
```

Generate the local report:

```text
/china-job-search:report
```

General prompt example:

```text
Analyze skill gaps across my active shortlist. Separate genuine must-have gaps from optional keywords, rank learning actions by job relevance and time-to-evidence, and propose small portfolio outputs I can truthfully add to my profile after completion.
```

Report prompt example:

```text
Generate my offline job-search report, summarize funnel conversion and pending actions, highlight overdue follow-ups and recurring rejection patterns, and avoid exposing private application fields in the report.
```

## Command reference

| Command | Purpose | Example |
|---|---|---|
| `/china-job-search:setup` | Create or reconnect the workspace and onboard the profile | `/china-job-search:setup /path/to/job-search-cn` |
| `/china-job-search:profile-refresh` | Merge new profile evidence with conflict review | `/china-job-search:profile-refresh /path/to/resume.pdf` |
| `/china-job-search:search` | Find, normalize, deduplicate, and save jobs | `/china-job-search:search 深圳 数据分析 社招` |
| `/china-job-search:rank` | Re-check eligibility and rank saved jobs | `/china-job-search:rank all` |
| `/china-job-search:apply` | Analyze a job and prepare a reviewed package | `/china-job-search:apply <job URL>` |
| `/china-job-search:interview` | Build a stage-specific preparation pack | `/china-job-search:interview <application-id> technical` |
| `/china-job-search:outcome` | Record status, import an outcome, or draft follow-up | `/china-job-search:outcome <application-id> followup` |
| `/china-job-search:upskill` | Aggregate gaps and plan evidence-producing learning | `/china-job-search:upskill all` |
| `/china-job-search:report` | Generate an offline dashboard | `/china-job-search:report` |
| `/china-job-search:add-template` | Register a custom document template | `/china-job-search:add-template /path/to/template.tex` |
| `/china-job-search:add-source` | Register a public job source | `/china-job-search:add-source https://example.com/careers` |
| `/china-job-search:reset` | Reset selected local data after explicit confirmation | `/china-job-search:reset search` |

## Workspace layout and privacy

The setup command creates a workspace similar to:

```text
job-search-cn/
├── profile/          # structured candidate facts and private application fields
├── jobs/             # normalized job records and search state
├── applications/     # one archive per application
├── templates/        # active and custom document templates
├── reports/          # offline reports
├── tracker.json      # application stages and actions
└── .gitignore        # excludes personal job-search data by default
```

Keep this workspace private. Review generated documents for names, contact details, dates, metrics, and employer-specific answers before sharing them. Do not store government-ID images, banking credentials, or account passwords unless absolutely necessary; prefer entering highly sensitive fields directly into the employer's verified form.

## Customization

Use `/china-job-search:add-template` to add a resume or letter template. The plugin validates placeholders and stores a copy in the workspace rather than mutating the installed plugin.

Use `/china-job-search:add-source` to add an official employer, university, or public recruitment page. A source is configuration, not permission to crawl it: the same access checks still apply.

## Validation for contributors

From the repository root:

```bash
python -m unittest discover -s "Claude Code/china-job-search/tests" -v
python /home/hong/.codex/skills/.system/skill-creator/scripts/quick_validate.py "Claude Code/china-job-search/skills/china-job-search"
claude plugin validate "Claude Code/china-job-search"
```

## Upstream and license

This plugin is derived from the MIT-licensed `ai-job-search` project. The implementation baseline was commit `1cdaf9497f0026fb4de877b80a439af184bce145`. The adapted workflow retains attribution while replacing Denmark-specific portals and assumptions with Mainland China sources, privacy rules, hiring tracks, and application practices. See [LICENSE](./LICENSE).
