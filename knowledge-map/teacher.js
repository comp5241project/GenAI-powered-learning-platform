/** Teacher-only browser UI. The API enforces permissions; this UI cannot grant a role. */
(async function () {
  const $ = (selector) => document.querySelector(selector);
  let revision = null;
  let signedIn = false;
  let saving = false;
  let dirty = false;

  async function api(op, method = 'GET', body) {
    const response = await fetch(`../api/knowledge?op=${op}`, {
      method, credentials: 'same-origin',
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }

  function updateControls() {
    $('#teacher-login').hidden = signedIn;
    $('#teacher-logout').hidden = !signedIn;
    $('#teacher-json').disabled = !signedIn || saving;
    $('#teacher-save').disabled = !signedIn || saving;
    $('#teacher-preview').disabled = !signedIn;
    $('#teacher-reviewed').disabled = !signedIn || !revision || dirty || saving;
    $('#teacher-publish').disabled = !signedIn || !revision || dirty || !$('#teacher-reviewed').checked || saving;
    $('#teacher-query').disabled = !signedIn;
    $('#teacher-discovery button').disabled = !signedIn;
  }

  async function loadDraft() {
    const data = await api('draft');
    revision = data.draft?.revision || null;
    dirty = false;
    $('#teacher-json').value = JSON.stringify(data.draft?.payload || window.SkillLoopGraph, null, 2);
    $('#teacher-reviewed').checked = false;
    $('#teacher-editor-status').textContent = revision
      ? `Loaded saved draft revision ${revision}.` : 'No saved draft yet. The curated sample is ready to edit.';
    updateControls();
  }

  $('#teacher-login').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('#teacher-status').textContent = 'Signing in…';
    try {
      await api('login', 'POST', { email: $('#teacher-email').value, password: $('#teacher-password').value });
      $('#teacher-password').value = '';
      const state = await api('session');
      if (state.role !== 'teacher') throw new Error('This account has no teacher role.');
      signedIn = true;
      $('#teacher-status').textContent = `Signed in as ${state.email}.`;
      await loadDraft();
    } catch (error) { $('#teacher-status').textContent = error.message; }
  });

  $('#teacher-logout').addEventListener('click', async () => {
    try { await api('logout', 'POST', {}); } catch { /* Clear the local editor regardless. */ }
    signedIn = false;
    revision = null;
    dirty = false;
    $('#teacher-json').value = '';
    $('#teacher-reviewed').checked = false;
    $('#teacher-preview-panel').hidden = true;
    $('#teacher-preview-frame').removeAttribute('src');
    sessionStorage.removeItem('skillloop.knowledge.preview');
    $('#teacher-result').hidden = true;
    $('#teacher-status').textContent = 'Signed out.';
    updateControls();
  });

  $('#teacher-json').addEventListener('input', () => {
    dirty = true;
    $('#teacher-reviewed').checked = false;
    $('#teacher-editor-status').textContent = 'Unsaved changes. Save the draft before publishing.';
    updateControls();
  });
  $('#teacher-reviewed').addEventListener('change', updateControls);

  $('#teacher-save').addEventListener('click', async () => {
    let payload;
    try { payload = JSON.parse($('#teacher-json').value); }
    catch { $('#teacher-editor-status').textContent = 'Draft is not valid JSON.'; return; }
    saving = true;
    updateControls();
    try {
      const data = await api('draft', 'POST', { payload, expectedRevision: revision });
      revision = data.revision;
      dirty = false;
      $('#teacher-reviewed').checked = false;
      $('#teacher-editor-status').textContent = `Saved draft revision ${revision}. Preview and review it before publishing.`;
    } catch (error) { $('#teacher-editor-status').textContent = error.message; }
    finally { saving = false; updateControls(); }
  });

  $('#teacher-preview').addEventListener('click', () => {
    try {
      const payload = JSON.parse($('#teacher-json').value);
      if (!payload?.publication || !Array.isArray(payload.topics)) throw new Error();
      sessionStorage.setItem('skillloop.knowledge.preview', JSON.stringify(payload));
      $('#teacher-preview-panel').hidden = false;
      $('#teacher-preview-frame').src = `index.html?draftPreview=1&at=${Date.now()}`;
      $('#teacher-editor-status').textContent = 'Previewing the current editor content. Save this exact version before publishing.';
    } catch { $('#teacher-editor-status').textContent = 'Fix the graph JSON before previewing.'; }
  });

  $('#teacher-publish').addEventListener('click', async () => {
    if (!revision || !$('#teacher-reviewed').checked) return;
    saving = true;
    updateControls();
    try {
      const data = await api('publish', 'POST', { revision, reviewed: true });
      $('#teacher-reviewed').checked = false;
      $('#teacher-editor-status').textContent = `Published version ${data.version}. Learners now receive this version.`;
    } catch (error) { $('#teacher-editor-status').textContent = error.message; }
    finally { saving = false; updateControls(); }
  });

  $('#teacher-discovery').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('#teacher-discovery-status').textContent = 'Searching source material…';
    $('#teacher-discovery button').disabled = true;
    try {
      const data = await api('discover', 'POST', { query: $('#teacher-query').value });
      $('#teacher-result').hidden = false;
      $('#teacher-result-meta').textContent = `${data.model} · retrieved ${new Date(data.retrievedAt).toLocaleString()}`;
      $('#teacher-result-text').textContent = data.summary;
      const list = $('#teacher-result-sources');
      list.replaceChildren();
      data.sources.forEach((source) => {
        const item = document.createElement('li');
        const anchor = document.createElement('a');
        anchor.href = source.url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = source.title || source.url;
        item.append(anchor);
        list.append(item);
      });
      $('#teacher-discovery-status').textContent = 'Research note saved to your private search history. Verify sources before using it.';
    } catch (error) { $('#teacher-discovery-status').textContent = error.message; }
    finally { updateControls(); }
  });

  $('#teacher-json').value = JSON.stringify(window.SkillLoopGraph, null, 2);
  updateControls();
  try {
    const state = await api('session');
    if (state.signedIn && state.role === 'teacher') {
      signedIn = true;
      $('#teacher-status').textContent = `Signed in as ${state.email}.`;
      await loadDraft();
    } else if (state.signedIn) {
      $('#teacher-status').textContent = 'This account has no teacher role.';
    } else $('#teacher-status').textContent = 'Sign in with a teacher account to edit or publish.';
  } catch { $('#teacher-status').textContent = 'Teacher backend is not configured for this preview.'; }
  updateControls();
})();
