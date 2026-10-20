# Module and data contracts

## Public page routes

| Route              | Owner       |
| ------------------ | ----------- |
| `/`                | Shared home |
| `/knowledge-map/`  | Module 1    |
| `/learning-path/`  | Module 2    |
| `/interview/`      | Module 3    |
| `/correction-lab/` | Module 4    |

`/knowledge-map/` opens the personal network. Existing links such as `/knowledge-map/?topic=software-testing` redirect to the corresponding sample knowledge page. New direct links use `/knowledge-map/graph.html?graph=<graphId>`, `/knowledge-map/concept.html?graph=<graphId>&topic=<conceptId>`, `/knowledge-map/question.html?graph=<graphId>&question=<questionId>` and `/knowledge-map/case.html?graph=<graphId>&case=<caseId>`. A `version=` parameter opens a historical publication. Unknown IDs show an unavailable page. No SPA router or catch-all rewrite is needed.

## Concept IDs

`foundations`, `requirements`, `code-reading`, `software-testing`, `communication`, `ai-code-review`, `edge-cases`.

Titles may change without changing these IDs. Discuss ID changes with the learning-path owner. Map content is in `knowledge-map/data.js`; other modules link to concepts rather than importing that module's UI code.

## Browser-local storage

`shared/storage.js` exposes:

```js
const profile = SkillLoop.read('profile', {});
SkillLoop.write('profile', { background: 'beginner', goal: 'internship', diagnostic: 'no' });
SkillLoop.appendEvent({
  module: 'learning-path',
  type: 'path-created',
  conceptIds: ['foundations'],
});
SkillLoop.icons(); // after inserting a data-lucide placeholder
```

Storage keys are prefixed with `skillloop.v1.`. Use one key per module so pages do not overwrite each other's data.

| Key          | Shape                                                     | Writer                          |
| ------------ | --------------------------------------------------------- | ------------------------------- |
| `profile`    | `{background, goal, diagnostic}`                          | learning-path                   |
| `knowledge`  | `{selected, completed: conceptId[], references?: Reference[]}` | knowledge-map              |
| `knowledgeV2` | `{nodes: PersonalNode[], edges: PersonalEdge[]}` | knowledge-map |
| `knowledgeStudyV2` | `graphId:conceptId[]` for browser-local study marks | knowledge-map |
| `interview`  | `{draft, events: [{label, detail}], hintUsed, hasAnswer}` | interview                       |
| `correction` | `{draft, revealed, nextSeen, caseId}`                     | correction-lab                  |
| `activity`   | `[{module, type, at, conceptId?, conceptIds?, caseId?}]`  | all modules through appendEvent |

`background` is `beginner`, `student` or `graduate`. `goal` is `internship` or `build`. Diagnostic `no` correctly rejects the claim that error-free execution guarantees correctness; `yes` indicates a foundation check is useful.

Study completion is self-reported, not proof of mastery. Activity is capped at 100 entries and interview history at 40 entries. Draft inputs are capped at 5,000 characters. Stored content is shown using `textContent`, not injected HTML.

V1 `Reference` is `{id, version, addedAt, title, description, note}`. V2 personal reference nodes use `{id: graphId + ':' + conceptId, kind:'reference', graphId, conceptId, sourceVersion, titleSnapshot, descriptionSnapshot, note, x, y}`. Personal note nodes use `{id:'note:' + uuid, kind:'note', title, body, x, y}`; manual edges have `{id, source, target, reason}`. The V2 browser reader uses V1 references as an initial local view and leaves `knowledge` intact. Signing in switches to account nodes; import requires a separate user action.

## Knowledge backend contract

The optional backend is a Vercel Function at `/api/knowledge`. `GET ?op=public&graph=<graphId>` returns the current published payload; `version=<version>` selects an immutable historical publication. The browser falls back to `knowledge-map/data.js` only for the sample graph when no backend publication is available. The seven shared concept IDs remain stable, while each other graph has its own namespace.

Account operations use same-origin, HttpOnly cookies. `GET ?op=session` returns `{signedIn, email?, role?}`; `POST ?op=login` accepts `{email,password}` and `POST ?op=logout` clears cookies. A teacher can `GET ?op=my-graphs`, `POST ?op=create-graph` with `{title}`, `GET ?op=draft&graph=<graphId>`, `POST ?op=draft` with `{graphId,payload,expectedRevision}`, and `POST ?op=publish` with `{graphId,revision,reviewed:true}`. Saving returns a new revision; stale revisions return HTTP 409. Learners cannot read unpublished drafts.

Signed-in users can `GET ?op=personal` for account references, note nodes and manual links. `POST ?op=reference` accepts `{graphId,conceptId,sourceVersion?}` and is idempotent across the same graph and concept. `POST ?op=note` and `POST ?op=unreference` accept `{graphId,conceptId,...}`. `personal-note`, `remove-personal-note`, `personal-edge`, `remove-personal-edge` and `personal-position` handle owned personal graph edits. `POST ?op=import-personal` takes `{nodes,edges}` only when the student explicitly chooses import; the database RPC applies it transactionally with deduplication. V1 account endpoints still default to the sample graph. A teacher can `POST ?op=discover` with `{query}`; it returns a private research note and HTTPS source links. See [backend setup](KNOWLEDGE-BACKEND.md).

The other modules still use browser-local prototype data. Do not treat a knowledge-map study mark as a server-side grade or automatically migrate local records. Keep API credentials on the server.
