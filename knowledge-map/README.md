# Knowledge map - module 1

Work mainly in this folder.

- `index.html`: map and mini-lesson layout.
- `data.js`: topic IDs, descriptions and lesson text.
- `script.js`: selected topic, lesson display, study records and connector lines.
- `style.css`: graph-specific styles and phone layout.

Open `/knowledge-map/`. Use `?topic=software-testing` to open a specific lesson. Local state uses the `knowledge` key through `SkillLoop.read/write`.

Keep concept IDs stable because the learning-path module links to them. Shared layout and icons come from `../shared/`. New lesson content can usually be edited in `data.js` without changing other files.

Check node selection, lesson text, study marking, reload persistence, topic links and phone layout. Next tasks are in [the team task list](../docs/MODULE-TASKS.md).
