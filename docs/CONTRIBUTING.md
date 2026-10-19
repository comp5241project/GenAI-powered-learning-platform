# Team guide

Each person owns one module. Keep changes in your folder where possible.

| Module                         | Folder            | Suggested branch         |
| ------------------------------ | ----------------- | ------------------------ |
| Knowledge map and mini-courses | `knowledge-map/`  | `feature/knowledge-map`  |
| Assessment and learning paths  | `learning-path/`  | `feature/learning-path`  |
| Interview practice and review  | `interview/`      | `feature/interview`      |
| Correction challenges          | `correction-lab/` | `feature/correction-lab` |

## Using GitHub Desktop

1. Switch to `main` and pull the latest changes.
2. Create a branch for your work, or switch to your existing branch.
3. Edit your module and preview it locally.
4. Commit with a short description, then push.
5. Open a pull request on GitHub. Ask a teammate to review it and merge after the checks pass.

Pull the updated `main` before starting the next task. Commit your current changes before switching branches.

## Using the terminal

```sh
git switch main
git pull --ff-only
git switch -c feature/knowledge-map
# Edit and preview your module.
python scripts/check_site.py
git add knowledge-map/
git commit -m "Update knowledge map lessons"
git push -u origin feature/knowledge-map
```

Create the pull request on GitHub. If the branch already exists, use `git switch feature/knowledge-map` instead of creating it again.

## Shared files

- Discuss changes to `shared/` and deployment settings with the team first.
- Put module-specific CSS in your own `style.css`.
- Keep topic IDs stable; other modules use them in lesson links.
- Commit only the files you changed. Avoid replacing the whole repository through a file upload.
- Keep API keys, `.env` files and personal practice records out of Git.

See [shared data formats](DATA-CONTRACTS.md) before connecting modules.

## Before opening a pull request

Run `python -m http.server 8000` and open [localhost:8000](http://localhost:8000). An editor's local static server also works.

Run `python scripts/check_site.py`, try the changed interaction, and refresh to check saved progress. Check the page at a phone width as well.

Describe preset responses and rule-based recommendations accurately. Discuss server-side interfaces before adding real AI, accounts or a database.
