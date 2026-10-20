# Knowledge backend setup

The knowledge module can run as a static sample with `python -m http.server 8000`. Account, teacher publishing and AI discovery need a Vercel deployment plus a Supabase project. The other three SkillLoop modules remain static.

## Architecture and ownership

- `knowledge-map/data.js` is the curated fallback and initial teacher draft template. Keep the seven shared concept IDs stable.
- `/api/knowledge` is a same-origin Vercel Function. It uses Supabase Auth and REST with the publishable key and the user's JWT; it does not use a service-role key. The OpenAI key is read only by this function.
- `supabase/migrations/20261021000100_knowledge_backend.sql` creates tables, row-level policies and transactional RPCs. A graph has one owner, a private draft revision and an immutable publication row for each version. The graph's `current_version` changes only after the new publication row is written in the same database transaction.
- `knowledge-map/teacher.html` is a teacher editor. Its local preview is not a publication. A teacher must save the reviewed JSON before publishing. AI search results are private research notes until a teacher manually writes and reviews an event in the graph draft.
- Signed-in references are per account. Browser-local references and study marks are separate. There is no automatic migration between identities or devices.

## Provisioning

1. Create a dedicated Supabase project. Apply the SQL migration through the Supabase SQL editor or your team's migration workflow. Apply it once to a new project.
2. Create teacher and learner accounts in Supabase Auth. Teacher role assignment is an administrator operation; do not expose it in a browser form. In the SQL editor, promote a known teacher account:

   ```sql
   insert into public.skillloop_roles (user_id, role)
   select id, 'teacher' from auth.users where email = 'teacher@example.edu'
   on conflict (user_id) do update set role = excluded.role;
   ```

   Accounts without a `skillloop_roles` row have learner access. Only graph owners can update their own drafts and publish them. Assign a different owner only through a deliberate database migration.
3. In Vercel, keep the existing **Other** project preset and repository root. Add server environment variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `OPENAI_API_KEY`. `OPENAI_MODEL` is optional; the default is `gpt-5.1`. Scope secrets to the intended environments. Redeploy after setting them.
4. Open `/knowledge-map/teacher.html`, sign in as a teacher, save the sample payload as a draft, preview it, check its source and practice content, then publish. `/knowledge-map/` will start reading that public version. Until the first publication, it shows the curated fallback.

For a local full-stack preview, use `vercel dev` after linking a Vercel project and supplying local environment variables through Vercel's normal environment workflow. A Python static server only exercises the fallback; it cannot run `/api/knowledge`.

## Editorial workflow

Change `publication.version` whenever content changes. `publication.publishedAt` is the planned release date. Keep a source's event date, publication date, checked date and HTTPS URL distinct. `source-supported` claims need a source section; `teaching-inference` claims should be framed as interpretation. The teacher checks both before publication. A repeated publish of the same revision and payload is safe; a conflicting reused version is rejected. Failed database transactions leave `current_version` unchanged.

AI source discovery sends the teacher's query in a documented research prompt to OpenAI's Responses web search. It records the query, prompt, model, returned note, source URLs and retrieval time in a teacher-only log. The provider does not expose the full text of every page supplied internally to web search, so teachers must open and check cited sources before transcribing any facts into the graph. Discovery never writes a public event or practice answer.
The API limits each teacher to ten searches per UTC day as a basic cost guard.

## Privacy and migration

Account references are visible only to their owner through row-level policies. Their note is limited to 1,000 characters. Browser-local references and progress remain on the device, including after sign-in; the account view shows only server references. Before designing an import, the team should define identity matching, consent, conflict handling and deletion/export behavior. A teacher can access only their own draft and discovery records. Published graph versions are public.

## Verification

Run `node --test api/knowledge.test.mjs` and `python scripts/check_site.py`. The tests use mocked Supabase calls; they do not prove that a live project has the migration, keys or role assignments configured. After provisioning, verify teacher sign-in, draft isolation with a learner account, source discovery, publish, public read, duplicate reference, note persistence across devices and phone layout on a preview deployment before pointing learners to it.
