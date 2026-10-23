# Interview studio - module 3

A short course-linked interview: choose a topic, answer three questions, then review and improve an answer. Open `/interview/` using the repository's static server.

The three-stage path stays visible throughout. Each question states what to write and what the next button does. Optional scenario cards and activity editing stay collapsed until needed. Returning learners see the question they will resume. The review preserves the original answer, supports revisions and ends with a Done action and a saved-record confirmation.

## What works

- Three authored activities: software testing, requirements and AI code review.
- Optional strategy cards reveal a scenario consequence. The opening choice changes the next question.
- Guided or independent opening questions, per-turn hints and a three-step progress trail.
- Draft saving, resume, recent sessions, reflection and self-review checkboxes.
- Revisions preserve the first answer. The review shows the first and latest versions side by side, with intermediate revisions available when present.
- Editable activity drafts and JSON export of a practice record.
- Keyboard controls, small-screen layouts and reduced-motion support.

The page clearly labels **Sample mode**. Prompts and branches are authored, not AI-generated. Checkboxes are the student's self-review, not automated feedback or a mastery score. Activity settings are local drafts; there is no teacher authentication or course publication here yet.

## Files

| File             | Responsibility                                                      |
| ---------------- | ------------------------------------------------------------------- |
| `index.html`     | Setup, practice, review and activity dialog                         |
| `style.css`      | Interview-specific layout using the shared brand colours            |
| `data.js`        | Authored activities, hints, strategy branches and review criteria   |
| `model.js`       | Session validation, state transitions, revisions and source context |
| `script.js`      | Page rendering, events, persistence and export                      |
| `model.test.cjs` | Dependency-free session and integration-boundary checks             |
| `DESIGN.md`      | Award references and the interaction decisions they informed        |

## Connect to other modules

Link to `/interview/` with optional query parameters:

```text
/interview/?courseId=se101&activityId=act4&conceptId=requirements
```

- `conceptId` selects a matching sample focus; the older `topic` alias also works.
- `courseId` and `activityId` identify the source course activity. They are metadata; the page does not fetch a published activity based on these IDs yet.
- `graphId` (or `graph`) and `publicationVersion` (or `version`) are retained in the practice record for later knowledge-network integration.
- `returnTo` can preserve the exact source page, including graph and version parameters. Use a URL-encoded local path under `/knowledge-map/` or `/learning-path/`. External destinations are rejected. Without it, the lesson link uses the compatible `/knowledge-map/?topic=...` route.
- The current shared `profile.background` can initialise the support level. Module 2's newer private storage schema is not read; agree its public contract before adding an adapter.

The session snapshots its activity, so editing an activity cannot silently rewrite an existing conversation. The next backend should load and validate published activities, provide live questions and feedback, and save sessions with the team's shared authentication. Keep API credentials and role checks on the server. Do not treat URL IDs as proof of course access.

## Storage

Uses `SkillLoop.read/write('interviewStudio', ...)`, giving the browser key `skillloop.v1.interviewStudio`. Up to twelve sessions are kept, and the setup page shows the five most recently updated records. Each answer permits ten saved revisions and 5,000 characters; reflection permits 1,000 characters.

The original `interview` state remains untouched. Its saved draft is copied into a resumable session on first use. Other modules' records are not changed. Shared activity events contain IDs and event types, not answer text. No cross-device sync is provided. When storage is unavailable, the page labels its visit-only memory fallback.

## Check the module

```sh
node --test interview/model.test.cjs
python scripts/check_site.py
```

In the browser, try a strategy choice, request a hint, save a draft and reload. Complete all three answers, revise one, tick a review criterion and reload again. Confirm that both answer versions remain available. Test the activity dialog with a keyboard and check 390px and 320px widths.
