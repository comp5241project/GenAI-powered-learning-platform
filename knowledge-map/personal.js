(async function () {
  const K = window.KnowledgeNetwork;
  const $ = K.$;
  const params = new URLSearchParams(location.search);
  if (params.has('topic')) {
    location.replace(K.href('concept', { topic: params.get('topic') }));
    return;
  }
  let signedIn = false;
  let localData = K.local();
  let data = localData;
  let selectedId = null;
  let teacherEdges = [];
  const canvas = new K.Canvas($('#kn-canvas'), { editable: true, onSelect: select, onMove: move });
  function status(message) { $('#kn-account-state').textContent = message; }
  function title(node) { return node.title || node.titleSnapshot || node.id; }
  function key(node) { return node.id; }
  async function refreshTeacherEdges() {
    const ids = [...new Set(data.nodes.filter((node) => node.kind === 'reference').map((node) => node.graphId))];
    const graphs = await Promise.all(ids.map(async (graphId) => {
      try { return { id: graphId, graph: (await K.api('public', 'GET', undefined, { graph: graphId })).graph }; }
      catch { return { id: graphId, graph: graphId === K.sampleId ? window.SkillLoopGraph : null }; }
    }));
    const present = new Set(data.nodes.map(key));
    teacherEdges = graphs.flatMap(({ id, graph }) => (graph?.relations || []).filter((edge) =>
      present.has(`${id}:${edge.source}`) && present.has(`${id}:${edge.target}`)).map((edge) => ({
      id: `${id}:${edge.id}`, source: `${id}:${edge.source}`, target: `${id}:${edge.target}`,
      kind: 'teacher', reason: edge.reason,
    })));
  }
  function options(select, nodes) {
    select.replaceChildren();
    for (const node of nodes) {
      const option = K.make('option', '', title(node));
      option.value = node.id;
      select.append(option);
    }
  }
  function renderList() {
    const list = $('#kn-list');
    const query = $('#kn-search').value.trim().toLowerCase();
    list.replaceChildren();
    for (const node of data.nodes) {
      if (query && !`${title(node)} ${node.body || node.note || ''}`.toLowerCase().includes(query)) continue;
      const button = K.make('button', 'kn-list-button', title(node));
      button.type = 'button';
      button.addEventListener('click', () => canvas.focus(node.id));
      list.append(button);
    }
    if (!list.childElementCount) list.textContent = 'No matching nodes.';
  }
  function render() {
    const present = new Set(data.nodes.map(key));
    data.edges = data.edges.filter((edge) => present.has(edge.source) && present.has(edge.target));
    canvas.set(data.nodes, [...teacherEdges, ...data.edges]);
    renderList();
    const selects = $('#kn-add-edge').querySelectorAll('select');
    selects.forEach((select) => options(select, data.nodes));
    select(selectedId && present.has(selectedId) ? selectedId : null);
  }
  function select(id) {
    selectedId = id;
    const node = data.nodes.find((item) => item.id === id);
    const box = $('#kn-selected');
    const backlinks = $('#kn-backlinks');
    box.replaceChildren(); backlinks.replaceChildren();
    $('#kn-selected-title').textContent = node ? title(node) : 'Select a node';
    if (!node) { box.textContent = 'Choose a node to see its source, notes and connections.'; return; }
    if (node.kind === 'reference') {
      box.append(K.make('p', '', node.descriptionSnapshot || 'Teacher concept'));
      const origin = K.make('a', '', `Teacher source · ${node.graphId} · version ${node.sourceVersion}`);
      origin.href = K.href('concept', { graph: node.graphId, topic: node.conceptId,
        ...(node.sourceVersion && node.sourceVersion !== 'unknown' ? { version: node.sourceVersion } : {}) });
      box.append(origin);
    }
    const label = K.make('label', '', node.kind === 'note' ? 'My note' : 'Personal note about this reference');
    const textarea = K.make('textarea');
    textarea.maxLength = 1000;
    textarea.value = node.kind === 'note' ? node.body || '' : node.note || '';
    textarea.addEventListener('change', async () => {
      const field = node.kind === 'note' ? 'body' : 'note';
      const prior = node[field];
      node[field] = textarea.value;
      if (!signedIn) K.saveLocal(data);
      else try {
        await K.api(node.kind === 'note' ? 'personal-note' : 'note', 'POST', node.kind === 'note'
          ? { id: node.id, title: node.title, body: node.body, x: node.x, y: node.y }
          : { graphId: node.graphId, conceptId: node.conceptId, note: node.note });
      } catch (error) { node[field] = prior; status(error.message); }
    });
    label.append(textarea); box.append(label);
    const remove = K.make('button', 'sl-btn', 'Remove node');
    remove.type = 'button';
    remove.addEventListener('click', async () => {
      try {
        if (signedIn) await K.api(node.kind === 'note' ? 'remove-personal-note' : 'unreference', 'POST',
          node.kind === 'note' ? { id: node.id } : { graphId: node.graphId, conceptId: node.conceptId });
        data.nodes = data.nodes.filter((item) => item.id !== node.id);
        data.edges = data.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
        if (!signedIn) K.saveLocal(data);
        teacherEdges = teacherEdges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
        render();
      } catch (error) { status(error.message); }
    });
    box.append(remove);
    const inbound = [...teacherEdges, ...data.edges].filter((edge) => edge.target === node.id);
    for (const edge of inbound) {
      const source = data.nodes.find((item) => item.id === edge.source);
      const p = K.make('p', '', `${source ? title(source) : edge.source} → ${title(node)}: ${edge.reason}`);
      if (edge.kind !== 'teacher') {
        const del = K.make('button', 'sl-text-button', 'Remove connection');
        del.type = 'button';
        del.addEventListener('click', async () => {
          try {
            if (signedIn) await K.api('remove-personal-edge', 'POST', { id: edge.id });
            data.edges = data.edges.filter((item) => item.id !== edge.id);
            if (!signedIn) K.saveLocal(data);
            render();
          } catch (error) { status(error.message); }
        });
        p.append(' ', del);
      }
      backlinks.append(p);
    }
    if (!inbound.length) backlinks.textContent = 'No incoming links yet.';
  }
  async function move(node) {
    if (!signedIn) { K.saveLocal(data); return; }
    try { await K.api('personal-position', 'POST', { id: node.id, x: node.x, y: node.y }); }
    catch (error) { status(error.message); }
  }
  async function loadAccount() {
    const response = await K.api('personal');
    data = { nodes: response.nodes || [], edges: response.edges || [] };
    await refreshTeacherEdges();
    render();
  }
  function accountUI() {
    $('#kn-login').hidden = signedIn;
    $('#kn-import').hidden = !signedIn || !localData.nodes.length;
    $('#kn-logout').hidden = !signedIn;
  }
  $('#kn-search').addEventListener('input', renderList);
  $('#kn-zoom-in').addEventListener('click', () => canvas.zoom(1.2));
  $('#kn-zoom-out').addEventListener('click', () => canvas.zoom(1 / 1.2));
  $('#kn-add-note').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const title = form.elements.title.value.trim();
    const body = form.elements.body.value.trim();
    const node = { id: `note:${crypto.randomUUID()}`, kind: 'note', title, body,
      x: 80 + data.nodes.length % 4 * 220, y: 80 + Math.floor(data.nodes.length / 4) * 130 };
    try {
      if (signedIn) await K.api('personal-note', 'POST', node);
      data.nodes.push(node);
      if (!signedIn) K.saveLocal(data);
      form.reset(); render(); canvas.focus(node.id);
    } catch (error) { status(error.message); }
  });
  $('#kn-add-edge').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const source = form.elements.source.value, target = form.elements.target.value;
    if (source === target) { status('Choose two different nodes.'); return; }
    if (data.edges.some((edge) => edge.source === source && edge.target === target)) { status('This personal connection already exists.'); return; }
    const edge = { id: crypto.randomUUID(), source, target, reason: form.elements.reason.value.trim(), kind: 'personal' };
    try {
      if (signedIn) await K.api('personal-edge', 'POST', edge);
      data.edges.push(edge);
      if (!signedIn) K.saveLocal(data);
      form.reset(); render(); canvas.focus(target);
    } catch (error) { status(error.message); }
  });
  $('#kn-login').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type=submit]');
    button.disabled = true;
    status('Signing in…');
    try {
      await K.api('login', 'POST', { email: form.elements.email.value, password: form.elements.password.value });
      form.elements.password.value = '';
      signedIn = true; await loadAccount(); accountUI();
      status('Signed in. Browser records stay local until you choose Import.');
    } catch (error) { status(`Sign in failed: ${error.message}`); }
    finally { button.disabled = false; }
  });
  $('#kn-logout').addEventListener('click', async () => {
    try { await K.api('logout', 'POST', {}); } catch { /* Local view still switches back. */ }
    signedIn = false; data = localData; await refreshTeacherEdges(); render(); accountUI();
    status('Signed out. Showing browser records.');
  });
  $('#kn-import').addEventListener('click', async () => {
    try {
      await K.api('import-personal', 'POST', { nodes: localData.nodes, edges: localData.edges });
      await loadAccount(); status('Browser records imported. The original browser copy remains here.');
    } catch (error) { status(error.message); }
  });
  await refreshTeacherEdges(); render(); accountUI();
  try {
    const session = await K.api('session');
    if (session.signedIn) { signedIn = true; await loadAccount(); accountUI(); status(`Signed in as ${session.email}.`); }
    else if (!session.backendConfigured) status('Browser-only mode: sign-in needs the Supabase URL and publishable key in the deployment. The sample graph and local notes still work.');
  } catch { status('Your browser records stay on this device. Account sync is unavailable here.'); }
})();
