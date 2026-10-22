(async function () {
  const K = window.KnowledgeNetwork;
  const $ = K.$;
  const local = K.local();
  let account = null;
  const status = (message) => { $('#account-status').textContent = message; };
  const importStatus = (message) => { $('#account-import-status').textContent = message; };
  function showOlderReferences() {
    const records = window.SkillLoopLegacyRecovery.find(K.legacy(), local, K.sampleId);
    const panel = $('#account-legacy-panel');
    panel.hidden = !records.length;
    const list = $('#account-legacy-list'); list.replaceChildren();
    for (const record of records) {
      const item = K.make('li');
      item.append(K.make('strong', '', record.title));
      if (record.description) item.append(K.make('p', '', record.description));
      if (record.note) item.append(K.make('p', '', `Personal note: ${record.note}`));
      if (record.version) item.append(K.make('p', 'sl-small', `Recorded source version: ${record.version}`));
      const restore = K.make('button', 'sl-btn', 'Restore to browser network');
      restore.type = 'button';
      restore.addEventListener('click', async () => {
        restore.disabled = true;
        if (!window.SkillLoopLegacyRecovery.restore(local, record, K.sampleId)) {
          status('This reference is already in the browser network.');
        } else if (K.saveLocal(local)) {
          status(`${record.title} restored to this browser network. The older record remains unchanged.`);
          showOlderReferences();
          await inspectImport();
        } else {
          local.nodes = local.nodes.filter((node) => node.id !== `${K.sampleId}:${record.id}`);
          K.saveLocal(local);
          status('Reference was not restored because browser storage is unavailable. The older record remains unchanged.');
        }
        restore.disabled = false;
      });
      item.append(restore);
      list.append(item);
    }
  }
  showOlderReferences();

  async function inspectImport() {
    const panel = $('#account-import-panel');
    panel.hidden = !account || (!local.nodes.length && !local.edges.length);
    if (panel.hidden) return;
    $('#account-import-summary').textContent = `${local.nodes.length} nodes and ${local.edges.length} connections in this browser → ${account.email}.`;
    const issues = $('#account-import-issues');
    issues.replaceChildren();
    let remote = null;
    try {
      remote = await K.api('personal');
    } catch (error) { issues.append(K.make('li', '', `Could not check account duplicates: ${error.message}`)); }
    const report = window.SkillLoopImportPreflight.inspect(local, remote);
    $('#account-import').disabled = !report.valid;
    for (const issue of report.issues) issues.append(K.make('li', '', `${issue} Import is disabled until the browser records are corrected.`));
    if (report.duplicates) issues.append(K.make('li', '', `${report.duplicates} records appear to exist in the account already; the import service handles duplicates.`));
    const legacyReferences = K.legacy().references;
    const invalidLegacy = Array.isArray(legacyReferences)
      ? legacyReferences.filter((ref) => !ref || !K.safeId(ref.id)).length : 0;
    if (invalidLegacy) issues.append(K.make('li', '', `${invalidLegacy} older browser references have invalid concept IDs and are not included in this import.`));
    if (Array.isArray(legacyReferences)) {
      const legacyOnly = window.SkillLoopLegacyRecovery.find(K.legacy(), local, K.sampleId).length;
      if (legacyOnly) issues.append(K.make('li', '', `${legacyOnly} older references are outside the current V2 network and are not included in this import. Restore them individually below before importing if you want them in the account.`));
    } else if (legacyReferences != null) {
      issues.append(K.make('li', '', 'Older reference data has an unsupported shape and is not included in this import. The original browser record remains available.'));
    }
    const sources = new Map();
    for (const node of local.nodes.filter((item) => item?.kind === 'reference')) {
      const version = node.sourceVersion && node.sourceVersion !== 'unknown' ? node.sourceVersion : null;
      sources.set(`${node.graphId}:${version || 'current'}`, { graphId: node.graphId, version });
    }
    for (const source of sources.values()) {
      try {
        await K.api('public', 'GET', undefined, { graph: source.graphId,
          ...(source.version ? { version: source.version } : {}) });
      } catch (error) {
        issues.append(K.make('li', '', `${source.graphId}${source.version ? ` version ${source.version}` : ''} may be unavailable for import: ${error.message}`));
      }
    }
    if (!issues.childElementCount) issues.append(K.make('li', '', 'No source, shape or duplicate issues detected. The server will validate the full import when submitted.'));
  }

  async function refresh() {
    try {
      const session = await K.api('session');
      account = session.signedIn ? session : null;
      $('#account-teacher-link').hidden = account?.role !== 'teacher';
      $('#account-login').hidden = !!account || !session.backendConfigured;
      $('#account-logout').hidden = !account;
      if (account) status(`Signed in as ${account.email}. Your account network and browser records are separate.`);
      else if (!window.SkillLoop.storageAvailable()) status('Local Mode · Browser storage is unavailable; changes may be lost when this page closes.');
      else if (!session.backendConfigured) status('Local Mode · Account service is not configured. Your browser records remain available.');
      else status('Local Mode · Sign in to view account records. Browser records are not synced automatically.');
      await inspectImport();
    } catch (error) {
      account = null;
      $('#account-teacher-link').hidden = true;
      $('#account-login').hidden = true;
      $('#account-logout').hidden = true;
      $('#account-import-panel').hidden = true;
      status(`Local Mode · Account service is unavailable: ${error.message}`);
    }
  }
  $('#account-login').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type=submit]');
    button.disabled = true; status('Signing in…');
    try {
      await K.api('login', 'POST', { email: form.elements.email.value, password: form.elements.password.value });
      form.elements.password.value = '';
      await refresh();
    } catch (error) { status(`Sign in failed: ${error.message}`); }
    finally { button.disabled = false; }
  });
  $('#account-logout').addEventListener('click', async () => {
    try { await K.api('logout', 'POST', {}); await refresh(); }
    catch (error) { status(`Sign out failed: ${error.message}`); }
  });
  $('#account-import').addEventListener('click', async () => {
    const button = $('#account-import');
    button.disabled = true; importStatus('Importing all browser records…');
    try {
      const result = await K.api('import-personal', 'POST', { nodes: local.nodes, edges: local.edges });
      importStatus(`Import completed for ${account.email}. The browser copy remains on this device.`);
      await inspectImport();
    } catch (error) {
      const nextStep = error.status === 401 || error.status === 403
        ? ' Sign in again or ask for access before retrying.'
        : !error.status || error.status === 429 || error.status >= 500
          ? ' The service may be temporarily unavailable; you can retry later.'
          : ' Review the source records before retrying.';
      importStatus(`Import failed; no browser records were removed. ${error.message}${nextStep}`);
    } finally { button.disabled = false; }
  });
  await refresh();
})();
