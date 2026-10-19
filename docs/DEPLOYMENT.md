# Deploy to Vercel

This is a plain static site. Deploy the whole repository as one project.

## Initial setup

1. In Vercel, import `comp5241project/SkillLoop` using a GitHub account that can access it.
2. Set the production branch to `main`.
3. Use Framework Preset **Other** and the repository root as Root Directory.
4. Leave Build Command and Install Command empty. Use `.` as Output Directory if Vercel asks for one.
5. Deploy. This prototype does not need environment variables or a database.

The root contains `index.html`. Each module has its own `index.html`; directory URLs such as `/interview/` therefore work directly. `vercel.json` sets the framework to Other, skips installation and building, and serves the repository root. It also enables clean URLs and trailing slashes. Do not add a rewrite that sends every URL to the home page: this is a multi-page site.

After connecting the repository, Vercel can deploy new main commits and provide branch/PR previews, subject to the project's Git integration settings. Pushing this repository alone does not create or confirm a Vercel deployment.

## Check the deployment

- Open all four module URLs directly and refresh them.
- Use the sidebar and the brand link back to the home page.
- Create a learning path and follow one of its lesson links.
- Save and revise an interview answer; refresh and check the replay.
- Enter a correction and reveal its reference explanation.
- Check at a phone width.

State is stored on each browser origin. Localhost progress will not automatically appear on the Vercel domain.

## If deployment fails

Open the failed deployment in Vercel and read its Build Logs. The GitHub status only reports the failure; it does not explain the cause. With Vercel CLI installed and signed in to the owning account, you can also run:

```sh
npx vercel inspect <deployment-id> --logs
```

Check that Root Directory points to the repository root and Production Branch is `main`. Build settings are defined in `vercel.json`; no `npm run build`, `dist` directory or API key is needed. If the log reports a permission or Git author error, resolve that account access issue before retrying.

## Later AI integration

When a real AI backend is added, agree a server-side API first. Configure credentials as server-side environment variables; do not put them in the HTML or browser JavaScript. Document the new install/build/deployment steps at that time.

Reference: [Vercel project configuration](https://vercel.com/docs/project-configuration).
