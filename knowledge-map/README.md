# Knowledge map - module 1

Work mainly in this folder.

- `index.html`: map and mini-lesson layout.
- `data.js`: published sample version, stable topic IDs, lesson sections, typed relationships, sourced events and authored practice.
- `script.js`: data-driven graph, lessons, relationship explanations, personal references and browser-local study records.
- `style.css`: graph-specific styles and phone layout.
- `teacher.html`, `teacher.js`: teacher sign-in, JSON draft editor, unpublished preview, review and publishing, and private AI source discovery.

Open `/knowledge-map/`. Use `?topic=software-testing` to select a specific lesson. The map's connections are also available as a keyboard-accessible list, including on phones. The historical event is curated from a linked source; the practice answer is authored and visible in client code, so it is not a secure assessment or AI feedback.

Local state uses the `knowledge` key through `SkillLoop.read/write`: `{selected, completed, references}`. Each reference stores the public concept ID, the publication version when saved, a small title/description snapshot and a personal note. References are browser-local, deduplicated by concept ID, and separate from self-reported study completion. The original `{selected, completed}` shape still loads.

When `/api/knowledge` is configured and a graph has been published, the map reads the current public payload from the backend. The curated `data.js` map remains the fallback for static development or before the first publication. Account sign-in switches the personal-reference view to server references; local references and study marks are kept separately on this device. The [backend setup](../docs/KNOWLEDGE-BACKEND.md) explains Supabase roles, Vercel variables, the teacher workflow, and the account API.

Keep concept IDs stable because the learning-path module links to them. Shared layout and icons come from `../shared/`. Update `publication.version` when published content changes; existing personal references then show the version difference. New lessons, nodes and connections can be edited in `data.js` without duplicating node HTML or connector arrays.

Check node and relationship selection, lesson and event links, practice feedback, study marking, reference deduplication, note persistence, version notices and phone layout. Run `node --test api/knowledge.test.mjs` for backend contract checks. The [implementation plan](IMPLEMENTATION-PLAN.md) records the phased scope; [team tasks](../docs/MODULE-TASKS.md) describe the original prototype goals.
