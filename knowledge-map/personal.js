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
  let selectedRelationshipId = null;
  let teacherEdges = [];
  let adding = false;
  const noteDrafts = new Map();
  const connectionDrafts = new Map();
  let pendingWrites = 0;
  const canvas = new K.Canvas($('#kn-canvas'), { editable: true, onSelect: select,
    onSelectEdge: selectRelationship, onMove: move });
  function status(message) { $('#kn-account-state').textContent = message; }
  const savePosition = window.SkillLoopPositionWrites.create(
    (id, position) => K.api('personal-position', 'POST', { id, ...position }),
    (id, position) => {
      const stored = data.nodes.find((item) => item.id === id);
      if (stored) Object.assign(stored, position);
      const displayed = canvas.items.find((item) => item.id === id);
      if (displayed) { Object.assign(displayed, position); canvas.place(displayed); canvas.lines(); }
    },
    (error) => status(`Position not saved: ${error.message}`));
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
      kind: 'teacher', type: edge.type, reason: edge.reason,
      currentVersion: graph.publication.version,
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
    $('#kn-empty').hidden = data.nodes.length > 0;
    $('#kn-graph-section').hidden = data.nodes.length === 0;
    $('#kn-add-section').hidden = !adding;
    $('#kn-add-edge').hidden = data.nodes.length < 2;
    $('#kn-context-section').hidden = data.nodes.length === 0;
    canvas.set(data.nodes, [...teacherEdges, ...data.edges.filter((edge) => present.has(edge.source) && present.has(edge.target))]);
    renderList();
    const selects = $('#kn-add-edge').querySelectorAll('select');
    selects.forEach((select) => options(select, data.nodes));
    if (selectedRelationshipId && [...teacherEdges, ...data.edges].some((edge) => edge.id === selectedRelationshipId))
      canvas.selectEdge(selectedRelationshipId);
    else if (selectedId && present.has(selectedId)) canvas.select(selectedId);
    else select(null);
  }
  function select(id) {
    selectedId = id;
    selectedRelationshipId = null;
    const node = data.nodes.find((item) => item.id === id);
    const connectionForm = $('#kn-add-edge');
    if (node && connectionForm.dataset.pickingTarget === 'true' && node.id !== connectionForm.elements.source.value) {
      connectionForm.elements.target.value = node.id;
      $('#kn-connect-status').textContent = `Target selected: ${title(node)}. Enter a reason, then connect the nodes.`;
    }
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
    const field = node.kind === 'note' ? 'body' : 'note';
    const savedValue = () => node[field] || '';
    const form = K.make('form', 'kn-note-form');
    const label = K.make('label', '', node.kind === 'note' ? 'My note' : 'Personal note about this reference');
    const textarea = K.make('textarea');
    textarea.maxLength = 1000;
    textarea.value = noteDrafts.get(node.id) ?? savedValue();
    const save = K.make('button', 'sl-btn', 'Save note'); save.type = 'submit';
    const cancel = K.make('button', 'sl-btn', 'Cancel'); cancel.type = 'button';
    const updateButtons = () => { save.disabled = cancel.disabled = !noteDrafts.has(node.id); };
    textarea.addEventListener('input', () => {
      if (textarea.value === savedValue()) noteDrafts.delete(node.id);
      else noteDrafts.set(node.id, textarea.value);
      updateButtons();
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!noteDrafts.has(node.id)) return;
      const value = textarea.value;
      save.disabled = cancel.disabled = textarea.disabled = true;
      pendingWrites += 1;
      try {
        if (signedIn) await K.api(node.kind === 'note' ? 'personal-note' : 'note', 'POST', node.kind === 'note'
          ? { id: node.id, title: node.title, body: value, x: node.x, y: node.y }
          : { graphId: node.graphId, conceptId: node.conceptId, note: value });
        node[field] = value;
        const persisted = signedIn || K.saveLocal(data);
        noteDrafts.delete(node.id);
        status(persisted ? 'Note saved.' : 'Note is visible on this page only; reload or navigation will lose it because browser storage is unavailable.');
      } catch (error) { status(`Note not saved: ${error.message}. Your text is still here; retry or Cancel.`); }
      finally { pendingWrites -= 1; textarea.disabled = false; updateButtons(); }
    });
    cancel.addEventListener('click', () => {
      noteDrafts.delete(node.id); textarea.value = savedValue(); updateButtons(); status('Note changes discarded.');
    });
    label.append(textarea); form.append(label, save, cancel); box.append(form);
    updateButtons();
    const remove = K.make('button', 'sl-btn', 'Remove node');
    remove.type = 'button';
    remove.addEventListener('click', async () => {
      if (!window.confirm(`Remove ${title(node)} and its personal connections?`)) return;
      try {
        if (signedIn) await K.api(node.kind === 'note' ? 'remove-personal-note' : 'unreference', 'POST',
          node.kind === 'note' ? { id: node.id } : { graphId: node.graphId, conceptId: node.conceptId });
        data.nodes = data.nodes.filter((item) => item.id !== node.id);
        noteDrafts.delete(node.id);
        for (const edge of data.edges) {
          if (edge.source === node.id || edge.target === node.id) connectionDrafts.delete(edge.id);
        }
        data.edges = data.edges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
        const persisted = signedIn || K.saveLocal(data);
        teacherEdges = teacherEdges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
        render();
        if (!persisted) status('Removal is visible on this page only; reload may restore the node because browser storage is unavailable.');
      } catch (error) { status(error.message); }
    });
    box.append(remove);
    if (data.nodes.length > 1) {
      const connect = K.make('button', 'sl-btn', 'Connect from this node');
      connect.type = 'button';
      connect.addEventListener('click', () => {
        adding = true; render();
        const form = $('#kn-add-edge');
        form.elements.source.value = node.id;
        form.dataset.pickingTarget = 'true';
        $('#kn-connect-status').textContent = 'Choose a target on the graph or from search results, or use the To menu.';
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        form.elements.target.focus();
      });
      box.append(connect);
    }
    const connected = [...teacherEdges, ...data.edges].filter((edge) => edge.source === node.id || edge.target === node.id);
    for (const edge of connected) {
      const source = data.nodes.find((item) => item.id === edge.source);
      const target = data.nodes.find((item) => item.id === edge.target);
      const button = K.make('button', 'kn-list-button', `${source ? title(source) : edge.source} → ${target ? title(target) : edge.target}: ${edge.reason}`);
      button.type = 'button'; button.addEventListener('click', () => canvas.selectEdge(edge.id));
      backlinks.append(button);
    }
    if (!connected.length) backlinks.textContent = 'No connections yet.';
  }
  function selectRelationship(edge) {
    const focusFromList = $('#kn-backlinks').contains(document.activeElement);
    selectedRelationshipId = edge.id;
    selectedId = null;
    const source = data.nodes.find((node) => node.id === edge.source);
    const target = data.nodes.find((node) => node.id === edge.target);
    const heading = $('#kn-selected-title');
    heading.textContent = `${source ? title(source) : edge.source} → ${target ? title(target) : edge.target}`;
    const box = $('#kn-selected'); box.replaceChildren();
    box.append(K.make('p', '', edge.kind === 'teacher' ? `Published relationship · type: ${edge.type}` : 'Personal connection'),
      K.make('p', '', `Direction: ${source ? title(source) : edge.source} to ${target ? title(target) : edge.target}.`),
      K.make('p', '', `Why connected: ${edge.reason}`));
    if (edge.kind === 'teacher') {
      box.append(K.make('p', '', `Current published graph version: ${edge.currentVersion}. Referenced concepts may originate from another version.`));
    } else {
      const form = K.make('form');
      const label = K.make('label', '', 'Edit my connection reason');
      const input = K.make('input'); input.name = 'reason'; input.maxLength = 280; input.required = true;
      input.value = connectionDrafts.get(edge.id) ?? edge.reason;
      const save = K.make('button', 'sl-btn', 'Save reason'); save.type = 'submit';
      const cancel = K.make('button', 'sl-btn', 'Cancel'); cancel.type = 'button';
      const updateButtons = () => { save.disabled = cancel.disabled = !connectionDrafts.has(edge.id); };
      input.addEventListener('input', () => {
        if (input.value === edge.reason) connectionDrafts.delete(edge.id);
        else connectionDrafts.set(edge.id, input.value);
        updateButtons();
      });
      label.append(input); form.append(label, save, cancel);
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!connectionDrafts.has(edge.id)) return;
        save.disabled = cancel.disabled = input.disabled = true;
        pendingWrites += 1;
        try {
          const reason = input.value.trim();
          if (!reason) { status('Enter a connection reason.'); return; }
          if (signedIn) await K.api('update-personal-edge', 'POST', { id: edge.id, reason });
          edge.reason = reason;
          const persisted = signedIn || K.saveLocal(data);
          connectionDrafts.delete(edge.id);
          render();
          status(persisted ? 'Connection reason saved.' : 'Reason is visible on this page only; reload or navigation will lose it because browser storage is unavailable.');
        } catch (error) { status(`Connection reason not saved: ${error.message}`); }
        finally { pendingWrites -= 1; input.disabled = false; updateButtons(); }
      });
      cancel.addEventListener('click', () => {
        connectionDrafts.delete(edge.id); input.value = edge.reason; updateButtons(); status('Connection changes discarded.');
      });
      updateButtons();
      const remove = K.make('button', 'sl-btn', 'Remove my connection'); remove.type = 'button';
      remove.addEventListener('click', async () => {
        if (!window.confirm('Remove this personal connection?')) return;
        try {
          if (signedIn) await K.api('remove-personal-edge', 'POST', { id: edge.id });
          data.edges = data.edges.filter((item) => item.id !== edge.id);
          connectionDrafts.delete(edge.id);
          if (!signedIn && !K.saveLocal(data)) status('Removal is visible on this page only; reload may restore the connection because browser storage is unavailable.');
          selectedRelationshipId = null; render();
        } catch (error) { status(`Connection was not removed: ${error.message}`); }
      });
      box.append(form, remove);
    }
    $('#kn-backlinks').replaceChildren(K.make('p', '', 'Choose a node to browse its other connections.'));
    if (focusFromList) { heading.tabIndex = -1; heading.focus(); }
  }
  async function move(node, previous) {
    const target = { x: node.x, y: node.y };
    if (target.x === previous.x && target.y === previous.y) return;
    const stored = data.nodes.find((item) => item.id === node.id);
    if (stored) Object.assign(stored, target);
    if (!signedIn) { if (!K.saveLocal(data)) status('Position is visible on this page only; reload or navigation will lose it because browser storage is unavailable.'); return; }
    pendingWrites += 1;
    try { await savePosition(node.id, previous, target); }
    finally { pendingWrites -= 1; }
  }
  async function loadAccount() {
    const response = await K.api('personal');
    data = { nodes: response.nodes || [], edges: response.edges || [] };
    await refreshTeacherEdges();
    render();
  }
  window.addEventListener('beforeunload', (event) => {
    if (!noteDrafts.size && !connectionDrafts.size && !pendingWrites) return;
    event.preventDefault(); event.returnValue = '';
  });
  $('#kn-create-first').addEventListener('click', () => {
    delete $('#kn-add-edge').dataset.pickingTarget;
    adding = true; $('#kn-add-section').hidden = false;
    $('#kn-add-note [name=title]').focus();
  });
  $('#kn-add-open').addEventListener('click', () => {
    delete $('#kn-add-edge').dataset.pickingTarget;
    adding = true; $('#kn-add-section').hidden = false;
    $('#kn-add-note [name=title]').focus();
  });
  $('#kn-add-cancel').addEventListener('click', () => {
    $('#kn-add-note').reset(); $('#kn-add-edge').reset();
    delete $('#kn-add-edge').dataset.pickingTarget;
    $('#kn-connect-status').textContent = 'Choose a target on the graph or from search results, or use the To menu.';
    adding = false; $('#kn-add-section').hidden = true;
  });
  $('#kn-search').addEventListener('input', () => { renderList(); canvas.highlight($('#kn-search').value); });
  $('#kn-zoom-in').addEventListener('click', () => canvas.zoom(1.2));
  $('#kn-zoom-out').addEventListener('click', () => canvas.zoom(1 / 1.2));
  $('#kn-reset').addEventListener('click', () => canvas.resetView());
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
      if (!signedIn && !K.saveLocal(data)) status('Node is visible on this page only; reload or navigation will lose it because browser storage is unavailable.');
      form.reset(); adding = false; render(); canvas.focus(node.id);
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
      if (!signedIn && !K.saveLocal(data)) status('Connection is visible on this page only; reload or navigation will lose it because browser storage is unavailable.');
      form.reset(); delete form.dataset.pickingTarget; adding = false; render(); canvas.focus(target);
    } catch (error) { status(error.message); }
  });
  try {
    const session = await K.api('session');
    if (session.signedIn) {
      signedIn = true; $('#kn-teacher-link').hidden = session.role !== 'teacher';
      await loadAccount();
      status(`Account network for ${session.email}. Browser records remain separate until you import them in Account & data.`);
    } else {
      await refreshTeacherEdges(); render();
      if (!window.SkillLoop.storageAvailable()) status('Local Mode · Browser storage is unavailable; changes may be lost when this page closes.');
      else if (!session.backendConfigured) status('Local Mode · Your records remain in this browser. Account sync is unavailable.');
      else status('Local Mode · Your records remain in this browser. Sign in from Account & data to use an account network.');
    }
  } catch {
    signedIn = false; data = localData;
    await refreshTeacherEdges(); render();
    status(window.SkillLoop.storageAvailable() ? 'Local Mode · Your records remain in this browser. Account sync is unavailable.' : 'Local Mode · Browser storage is unavailable; changes may be lost when this page closes.');
  }
})();
