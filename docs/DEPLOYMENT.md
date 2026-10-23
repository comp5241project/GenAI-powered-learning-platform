# Deploy to Vercel

Deploy the static pages and the interview API as one project.

## Initial setup

1. In Vercel, import `comp5241project/SkillLoop` using a GitHub account that can access it.
2. Set the production branch to `main`.
3. Use Framework Preset **Other** and the repository root as Root Directory.
4. Keep the Build Command empty. The repository config sets Install Command to `npm ci --omit=dev`; use `.` as Output Directory.
5. Deploy. Demo mode needs no AI credentials or database. See the interview README to enable live AI.

The root contains `index.html`. Each module has its own `index.html`; directory URLs such as `/interview/` work directly. `vercel.json` selects Other, installs the locked dependencies, skips a frontend build and serves the repository root. `api/interview.js` runs as a Node.js function. Clean URLs and trailing slashes are enabled. Do not add a catch-all SPA rewrite.

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

Check that Root Directory points to the repository root and Production Branch is `main`. Settings are defined in `vercel.json`; no `npm run build` or `dist` directory is needed. Node.js 22 or later is required. If the log reports a permission or Git author error, resolve that account access issue before retrying.

## Interview AI configuration

Set `AI_GATEWAY_MODEL` to an available text model ID. Local development also needs `AI_GATEWAY_API_KEY` in the uncommitted `.env.local`; Vercel deployments can use their OIDC token with working Gateway access. Credentials never belong in HTML or browser JavaScript. See [interview setup](../interview/README.md) for the API and checks. A successful configuration check does not prove provider access or credits; verify one complete AI conversation after setup. No live provider call has been verified yet.

Reference: [Vercel project configuration](https://vercel.com/docs/project-configuration).
