# Knowledge network - module 1

`/knowledge-map/` opens the student's personal network. The former learning-path links such as
`/knowledge-map/?topic=software-testing` redirect to the sample graph's knowledge page.

| Page | Purpose |
| --- | --- |
| `index.html` | Personal references, note nodes, manual links and backlinks |
| `graph.html?graph=<graphId>` | Shareable published teacher graph |
| `concept.html?graph=<graphId>&topic=<conceptId>` | Knowledge and mini-course |
| `question.html?graph=<graphId>&question=<questionId>` | Dedicated question URL; seven sample concepts have one each |
| `case.html?graph=<graphId>&case=<caseId>` | Sourced historical case |
| `teacher.html` | Private multi-graph visual editor, content forms, AI research, previews and publishing |

`network-core.js` loads publications and draws a pannable, zoomable canvas; `public-pages.js` renders public content; `personal.js` manages the student's graph. `data.js` is the curated static sample. `script.js` and `style.css` remain as V1 source/history; the new pages use `network.css`. A public graph falls back to the curated sample only for the original sample graph while no backend publication is available.

The personal network uses the new `knowledgeV2` browser key and reads old `knowledge.references` as initial local references without changing that key. A reference holds graph ID, concept ID, publication version and title/description snapshots. Its teacher relations appear only when both endpoint nodes are referenced. Note nodes and manual links can be arranged by drag; the list and search give keyboard access. Signing in shows account data without uploading browser records. The **Import browser records** action explicitly imports them with deduplication when the backend and source publications exist.

Teachers create multiple owned graphs. New concepts are unlimited by the seven sample IDs up to the validated 500-node payload limit. Drag positions are saved in the draft. A published concept stays in the payload when archived, preserving old links. Preview uses session storage in the current tab and traverses all page levels before a reviewed draft is published. AI research stays private until the teacher writes a sourced case.

Run `node --test api/*.test.mjs` and `python scripts/check_site.py`. For a visual stress check, open `/tests/knowledge-300.html` under a local static server. `node tests/mock-knowledge-server.mjs` starts an in-memory teacher API on port 8001 for a browser walkthrough; it does not test Supabase permissions or persist data. The [V2 plan](../docs/KNOWLEDGE-NETWORK-V2-PLAN.md) records the delivery order; [backend setup](../docs/KNOWLEDGE-BACKEND.md) covers migrations and deployment. The [V1 plan](IMPLEMENTATION-PLAN.md) remains unchanged.
