# Correction lab - module 4

Work mainly in this folder.

- `index.html`: page layout, answer fields and reference panel.
- `cases.js`: authored cases. Each has code, a transcript or a message to review, a reference explanation, evidence or a better version, acceptance criteria and a related task.
- `script.js`: case switching, per-case drafts, reveal state, self-check and follow-up answers.
- `style.css`: styles unique to this module.

Open `/correction-lab/`, or `/correction-lab/?case=password-boundary` to open one case. Unknown case IDs fall back to the first case.

Cases follow the course topics in the project brief:

- **Software fundamentals**: edge cases, requirements versus code, tests that prove nothing.
- **AI coding agents**: a vague request (Description), an agent that edits a test to hide a bug (Discernment), an API key shipped to the browser (Diligence). The related task in the test case asks what to delegate (Delegation). These follow Anthropic's AI Fluency 4D framework.
- **Soft and product skills**: a vague status update, a user story with no real user, a harsh review comment.

Each case follows four steps: describe the problem and a fix, open the reference explanation, tick the acceptance criteria your answer covers, and answer a related task. Explanations and evidence are written by hand. Nothing is executed and answers are not auto-scored; the criteria are a self-check.

State uses the `correction` key. The top-level `{draft, revealed, nextSeen, caseId}` describe the open case and `cases` stores progress for every case. See [data contracts](../docs/DATA-CONTRACTS.md). Older saves with only the top-level fields are moved into `cases` on load.

To add a case, append an object to `cases.js` with a new stable `id`, a `topic` and a shared concept ID. Optional fields: `fluency`, `format: 'text'` for prose, and `reference.label` to rename "Evidence". Ask a teammate to review the explanation before merging.

The page links to the team's [Code Review Bureau prototype](https://sonic-fiddle-gzb7c64.vercel.app/bureau.html). Its source code is separate and has not been imported. When the source is available, integrate its cases here while preserving shared navigation and agreed data contracts.

Check empty-answer validation, saving a draft, switching cases, revealing the explanation, ticking criteria, the related task, clearing a case, reload persistence, the lesson link and the external demo link. See [team tasks](../docs/MODULE-TASKS.md).
