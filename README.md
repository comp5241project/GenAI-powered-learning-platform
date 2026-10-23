# SkillLoop

Short software development lessons, personalised learning paths, mock interviews and correction exercises.

Live site: [skillloop-sigma.vercel.app](https://skillloop-sigma.vercel.app/).

The pages use HTML, CSS and JavaScript without a frontend framework or build step. Each team member works in one module folder. The interview also has a small server-side AI endpoint.

## Run it locally

From the repository folder:

```sh
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). On Windows, `py -m http.server 8000` also works if Python is installed through the Python launcher. A local static-server extension such as VS Code Live Server can be used instead.

For the interview API, use Node.js 22 or later: run `npm ci`, then `npm run dev:interview`, and open `http://127.0.0.1:8765/interview/`. It runs an authored demo until AI is configured. See [interview setup](interview/README.md).

## Where each person works

| Module                                | Folder            | Starting files                                    |
| ------------------------------------- | ----------------- | ------------------------------------------------- |
| Knowledge map and mini-courses        | `knowledge-map/`  | `index.html`, `style.css`, `script.js`, `data.js` |
| Initial assessment and learning paths | `learning-path/`  | `index.html`, `style.css`, `script.js`            |
| Mock interview and process review     | `interview/`      | `index.html`, `style.css`, `script.js`            |
| AI-style answer correction            | `correction-lab/` | `index.html`, `style.css`, `script.js`            |

Each folder has its own README. Most work should stay inside the assigned folder. Shared navigation, styling and browser storage helpers live in `shared/`.

```text
SkillLoop/
  index.html                 Home and module entry points
  knowledge-map/             Module 1
  learning-path/             Module 2
  interview/                 Module 3
  correction-lab/            Module 4
  shared/                    Common styles, navigation and storage helpers
  public/                    Favicon and future static assets
  docs/                      Collaboration, data contracts and deployment
  scripts/check_site.py      Dependency-free file and link checks
  vercel.json                Static hosting configuration
```

## Current behavior

- Explore seven sample knowledge-map nodes, read mini-lessons and mark them as studied.
- Choose a background and goal, answer a diagnostic question and open recommended lessons.
- Practise with a conversational interviewer, type replies, use optional reply starters and revisit the record. With AI configured, receive per-turn feedback, adaptive follow-ups, an overall review and version comparisons.
- Write a counterexample to an authored code example and open a reference explanation.
- Refresh or switch pages without losing browser-local progress.

Learning-path recommendations and correction explanations are preset. The interview has separate demo and AI modes; AI requires server configuration. This prototype does not execute submitted code or provide shared accounts, a database or teacher administration.

The team's separate [Code Review Bureau prototype](https://sonic-fiddle-gzb7c64.vercel.app/bureau.html) is linked from the correction module. Its original source has not been imported into this repository. It can be integrated later when that source is available.

Progress is saved in this browser's local storage. It is not synced between devices or visible to other users. Clearing site data removes it.

## Working together

1. Pull the latest `main`.
2. Create a feature branch for the work.
3. Edit your module and test it locally.
4. Open a pull request and ask a teammate to review it.
5. Merge after the checks pass.

Discuss changes to `shared/`, `vercel.json` and shared data contracts first. Keep concept IDs stable so links from other modules continue to work.

- [Team guide](docs/CONTRIBUTING.md)
- [Shared data and module contracts](docs/DATA-CONTRACTS.md)
- [Initial tasks for the four modules](docs/MODULE-TASKS.md)
- [Vercel deployment](docs/DEPLOYMENT.md)

## Checks

```sh
python scripts/check_site.py
```

This checks the expected module files, local HTML links, asset paths, duplicate IDs and hosting configuration. A GitHub Actions workflow runs the same checks on pushes and pull requests. When changing an interaction, also try it in the browser and refresh the page to check persistence.

## Deploy

Import `comp5241project/SkillLoop` into Vercel using the **Other** preset and repository root. `vercel.json` installs the locked AI SDK dependencies with `npm ci --omit=dev`, skips a frontend build and serves `.` with the interview function. Demo mode needs no AI credentials; live AI needs server-side configuration. See [deployment notes](docs/DEPLOYMENT.md).

## References

- [Civilization VI manual](https://downloads.2kgames.com/civilization/vi/manuals/eu/CIV_VI_25TH_ONLINE_MANUAL_ENG.pdf): technology-tree inspiration.
- [Non-CS learner discussion](https://www.reddit.com/r/PhD/comments/10fnw9x/): differences in prior knowledge.
- [Interview practice discussion](https://www.reddit.com/r/careeradvice/comments/1pa8o7n/): practising alone and reviewing answers.
- [HypoCompass, IJCAI 2025](https://www.ijcai.org/proceedings/2025/1217): learning through helping an AI agent debug code.

These sources inform the design; they do not establish that this prototype improves learning outcomes.

## License

MIT; see [LICENSE](LICENSE). The locally bundled Lucide icon library has its own [MIT license](shared/vendor/LUCIDE-LICENSE). See [third-party notices](THIRD-PARTY-NOTICES.md).
