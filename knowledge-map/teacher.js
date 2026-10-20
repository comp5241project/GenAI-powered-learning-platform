(async function () {
  const K = window.KnowledgeNetwork;
  const $ = K.$;
  let signedIn = false, graphId = null, draft = null, revision = null, dirty = false, selectedId = null;
  let graphList = [];
  const canvas = new K.Canvas($('#teacher-canvas'), { editable: true, onSelect: selectTopic,
    onMove: (topic) => { topic.position = { x: topic.x, y: topic.y }; changed(); } });
  const msg = (value) => { $('#teacher-editor-status').textContent = value; };
  const formValue = (form, name) => form.elements[name].value.trim();
  function changed() { dirty = true; $('#teacher-reviewed').checked = false; controls(); msg('Unsaved changes. Save before publishing.'); }
  function controls() {
    $('#teacher-login').hidden = signedIn;
    $('#teacher-logout').hidden = !signedIn;
    $('#teacher-workspace').hidden = !signedIn;
    $('#teacher-save').disabled = !draft;
    $('#teacher-publish').disabled = !draft || !revision || dirty || !$('#teacher-reviewed').checked;
  }
  function optionList(selector) {
    const select = $(selector);
    const old = select.value;
    select.replaceChildren();
    for (const topic of draft.topics) {
      const option = K.make('option', '', topic.title);
      option.value = topic.id;
      select.append(option);
    }
    if (draft.topics.some((topic) => topic.id === old)) select.value = old;
  }
  function renderGraph() {
    if (!draft) return;
    canvas.set(draft.topics.filter((topic) => !topic.archived), draft.relations);
    const list = $('#teacher-topic-list');
    const query = $('#teacher-search').value.trim().toLowerCase();
    list.replaceChildren();
    for (const topic of draft.topics) {
      if (query && !`${topic.title} ${topic.description}`.toLowerCase().includes(query)) continue;
      const button = K.make('button', 'kn-list-button', `${topic.title}${topic.archived ? ' (archived)' : ''}`);
      button.type = 'button';
      button.addEventListener('click', () => { selectTopic(topic.id); if (!topic.archived) canvas.focus(topic.id); });
      list.append(button);
    }
    for (const selector of ['#teacher-relation [name=source]', '#teacher-relation [name=target]',
      '#teacher-question [name=topicId]', '#teacher-case [name=topicId]']) optionList(selector);
    renderRelations(); renderQuestions(); renderCases();
  }
  function selectTopic(id) {
    selectedId = id;
    const topic = draft?.topics.find((item) => item.id === id);
    const form = $('#teacher-topic');
    if (!topic) return;
    for (const name of ['id', 'title', 'description']) form.elements[name].value = topic[name];
    for (const name of ['goal', 'explanation', 'example', 'nextAction']) form.elements[name].value = topic.lesson[name];
    form.elements.archived.checked = !!topic.archived;
  }
  function renderRelations() {
    const box = $('#teacher-relations'); box.replaceChildren();
    for (const relation of draft.relations) {
      const row = K.make('p', '', `${relation.source} → ${relation.target} (${relation.type}): ${relation.reason} `);
      const button = K.make('button', 'sl-text-button', 'Remove'); button.type = 'button';
      button.addEventListener('click', () => { draft.relations = draft.relations.filter((item) => item.id !== relation.id);
        draft.activities = (draft.activities || []).filter((item) => item.relationId !== relation.id);
        changed(); renderGraph(); });
      row.append(button); box.append(row);
    }
  }
  function renderQuestions() {
    const box = $('#teacher-questions'); box.replaceChildren();
    for (const question of draft.questions || []) {
      const row = K.make('p', '', `${question.archived ? '[Archived] ' : ''}${question.topicId}: ${question.prompt} `);
      const edit = K.make('button', 'sl-text-button', 'Edit'); edit.type = 'button';
      edit.addEventListener('click', () => {
        const form = $('#teacher-question'); form.dataset.editId = question.id;
        form.elements.topicId.value = question.topicId; form.elements.prompt.value = question.prompt;
        form.elements.options.value = question.options.join('\n'); form.elements.answer.value = question.answerIndex + 1;
        form.elements.feedback.value = question.feedback;
        form.querySelector('button[type=submit]').textContent = 'Save question'; form.scrollIntoView({ block: 'center' });
      });
      const archive = K.make('button', 'sl-text-button', question.archived ? 'Restore' : 'Archive'); archive.type = 'button';
      archive.addEventListener('click', () => { question.archived = !question.archived; changed(); renderQuestions(); });
      row.append(edit, archive); box.append(row);
    }
  }
  function renderCases() {
    const box = $('#teacher-cases'); box.replaceChildren();
    for (const item of draft.events || []) {
      const row = K.make('p', '', `${item.archived ? '[Archived] ' : ''}${item.title} · ${item.date} `);
      const edit = K.make('button', 'sl-text-button', 'Edit'); edit.type = 'button';
      edit.addEventListener('click', () => {
        const form = $('#teacher-case'); form.dataset.editId = item.id;
        form.elements.topicId.value = item.links[0]?.topicId || '';
        form.elements.title.value = item.title; form.elements.date.value = item.date;
        form.elements.summary.value = item.summary; form.elements.sourceTitle.value = item.source.title;
        form.elements.sourceUrl.value = item.source.url; form.elements.sourceDate.value = item.source.publishedDate;
        form.elements.fact.value = item.claims.find((claim) => claim.kind === 'source-supported')?.text || '';
        form.elements.sourceSection.value = item.claims.find((claim) => claim.kind === 'source-supported')?.sourceSection || '';
        form.elements.inference.value = item.claims.find((claim) => claim.kind === 'teaching-inference')?.text || '';
        form.querySelector('button[type=submit]').textContent = 'Save case'; form.scrollIntoView({ block: 'center' });
      });
      const archive = K.make('button', 'sl-text-button', item.archived ? 'Restore' : 'Archive'); archive.type = 'button';
      archive.addEventListener('click', () => { item.archived = !item.archived; changed(); renderCases(); });
      row.append(edit, archive); box.append(row);
    }
  }
  async function graphs() {
    graphList = (await K.api('my-graphs')).graphs || [];
    const select = $('#teacher-graphs'); select.replaceChildren();
    for (const graph of graphList) {
      const option = K.make('option', '', `${graph.title}${graph.current_version ? ` · ${graph.current_version}` : ' · draft'}`);
      option.value = graph.id; select.append(option);
    }
    if (!graphList.length) { graphId = null; draft = null; revision = null;
      msg('Create your first graph to begin.'); controls(); return; }
    if (!graphList.some((item) => item.id === graphId)) graphId = graphList[0].id;
    select.value = graphId;
    await loadDraft();
  }
  async function loadDraft() {
    if (!graphId) return;
    const response = await K.api('draft', 'GET', undefined, { graph: graphId });
    revision = response.draft?.revision || null;
    if (response.draft?.payload) draft = response.draft.payload;
    else if (graphId === K.sampleId) draft = structuredClone(window.SkillLoopGraph);
    else throw new Error('This graph has no editable draft.');
    draft.questions ||= []; draft.events ||= []; draft.activities ||= [];
    for (const selector of ['#teacher-question', '#teacher-case']) {
      const form = $(selector); form.reset(); delete form.dataset.editId;
      form.querySelector('button[type=submit]').textContent = selector === '#teacher-question' ? 'Add question' : 'Add case';
    }
    selectedId = draft.topics[0]?.id || null;
    dirty = false; $('#teacher-reviewed').checked = false;
    const form = $('#teacher-meta');
    form.elements.title.value = draft.publication.title;
    form.elements.version.value = draft.publication.version;
    form.elements.date.value = draft.publication.publishedAt;
    renderGraph(); selectTopic(selectedId); controls();
    const share = new URL(`graph.html?graph=${encodeURIComponent(graphId)}`, location.href);
    $('#teacher-share').replaceChildren(document.createTextNode('Published share link: '));
    const anchor = K.make('a', '', share.href); anchor.href = share.href; $('#teacher-share').append(anchor);
    msg(revision ? `Loaded private draft ${revision}.` : 'Sample content loaded. Save a draft before publishing.');
  }
  $('#teacher-login').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await K.api('login', 'POST', { email: formValue(form, 'email'), password: form.elements.password.value });
      form.elements.password.value = '';
      const session = await K.api('session');
      if (session.role !== 'teacher') throw new Error('Teacher role required.');
      signedIn = true; controls(); await graphs(); $('#teacher-status').textContent = `Signed in as ${session.email}.`;
    } catch (error) { $('#teacher-status').textContent = error.message; }
  });
  $('#teacher-logout').addEventListener('click', async () => {
    try { await K.api('logout', 'POST', {}); } catch { /* Close editor locally. */ }
    signedIn = false; graphId = null; draft = null; revision = null;
    sessionStorage.removeItem('skillloop.knowledge.preview');
    $('#teacher-frame').hidden = true; controls(); $('#teacher-status').textContent = 'Signed out.';
  });
  $('#teacher-create').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const result = await K.api('create-graph', 'POST', { title: formValue(form, 'title') });
      graphId = result.id; form.reset(); await graphs();
    } catch (error) { msg(error.message); }
  });
  $('#teacher-create-sample').addEventListener('click', async () => {
    try {
      const result = await K.api('create-graph', 'POST', { title: 'Software development sample' });
      const payload = structuredClone(window.SkillLoopGraph);
      payload.publication.id = result.id;
      payload.publication.publishedAt = new Date().toISOString().slice(0, 10);
      payload.publication.version = `${payload.publication.publishedAt}.1`;
      await K.api('draft', 'POST', { graphId: result.id, payload, expectedRevision: result.revision });
      graphId = result.id; await graphs();
    } catch (error) { msg(error.message); }
  });
  $('#teacher-graphs').addEventListener('change', async (event) => {
    graphId = event.target.value;
    try { await loadDraft(); } catch (error) { msg(error.message); }
  });
  $('#teacher-search').addEventListener('input', renderGraph);
  $('#teacher-zoom-in').addEventListener('click', () => canvas.zoom(1.2));
  $('#teacher-zoom-out').addEventListener('click', () => canvas.zoom(1 / 1.2));
  $('#teacher-add-topic').addEventListener('click', () => {
    if (!draft) return;
    const id = `concept-${crypto.randomUUID()}`;
    const topic = { id, title: 'New concept', icon: 'circle', description: 'Describe this concept for learners.',
      pathRole: 'extension', order: draft.topics.length + 1, position: { x: 80 + draft.topics.length % 5 * 210,
        y: 80 + Math.floor(draft.topics.length / 5) * 130 },
      lesson: { goal: 'Describe what learners should understand after this page.',
        explanation: 'Explain the idea in a clear paragraph with enough context for learners.',
        example: 'Provide a concrete example of this concept in a realistic situation.',
        nextAction: 'Suggest a small action to apply this idea after reading.' } };
    draft.topics.push(topic); changed(); renderGraph(); canvas.focus(id); selectTopic(id);
  });
  $('#teacher-meta').addEventListener('input', (event) => {
    if (!draft) return;
    const form = event.currentTarget;
    draft.publication.title = formValue(form, 'title');
    draft.publication.version = formValue(form, 'version');
    draft.publication.publishedAt = form.elements.date.value;
    changed();
  });
  $('#teacher-topic').addEventListener('input', (event) => {
    if (!draft || !selectedId) return;
    const topic = draft.topics.find((item) => item.id === selectedId);
    const form = event.currentTarget;
    topic.title = formValue(form, 'title'); topic.description = formValue(form, 'description');
    for (const name of ['goal', 'explanation', 'example', 'nextAction']) topic.lesson[name] = formValue(form, name);
    topic.archived = form.elements.archived.checked;
    changed();
    if (event.target.name === 'title' || event.target.name === 'archived') renderGraph();
  });
  $('#teacher-relation').addEventListener('submit', (event) => {
    event.preventDefault(); if (!draft) return;
    const form = event.currentTarget;
    const source = formValue(form, 'source'), target = formValue(form, 'target');
    if (source === target) { msg('Choose different concepts.'); return; }
    draft.relations.push({ id: `relation-${crypto.randomUUID()}`, source, target,
      type: formValue(form, 'type'), reason: formValue(form, 'reason') });
    changed(); renderGraph(); form.reset();
  });
  $('#teacher-question').addEventListener('submit', (event) => {
    event.preventDefault(); if (!draft) return;
    const form = event.currentTarget;
    const options = formValue(form, 'options').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    const answerIndex = Number(form.elements.answer.value) - 1;
    if (options.length < 2 || options.length > 4 || answerIndex < 0 || answerIndex >= options.length) {
      msg('Use 2–4 options and a matching answer number.'); return;
    }
    const existing = draft.questions.find((item) => item.id === form.dataset.editId);
    const next = { id: existing?.id || `question-${crypto.randomUUID()}`,
      topicId: formValue(form, 'topicId'), prompt: formValue(form, 'prompt'), options, answerIndex,
      feedback: formValue(form, 'feedback'), ...(existing?.archived ? { archived: true } : {}) };
    if (existing) Object.assign(existing, next); else draft.questions.push(next);
    changed(); renderQuestions(); form.reset(); delete form.dataset.editId;
    form.querySelector('button[type=submit]').textContent = 'Add question';
  });
  $('#teacher-case').addEventListener('submit', (event) => {
    event.preventDefault(); if (!draft) return;
    const form = event.currentTarget, topicId = formValue(form, 'topicId');
    const today = new Date().toISOString().slice(0, 10);
    const existing = draft.events.find((item) => item.id === form.dataset.editId);
    const next = { id: existing?.id || `case-${crypto.randomUUID()}`, title: formValue(form, 'title'),
      date: form.elements.date.value, summary: formValue(form, 'summary'),
      source: { title: formValue(form, 'sourceTitle'), url: formValue(form, 'sourceUrl'),
        publishedDate: form.elements.sourceDate.value, checkedDate: today },
      claims: [ { kind: 'source-supported', text: formValue(form, 'fact'), sourceSection: formValue(form, 'sourceSection') },
        { kind: 'teaching-inference', text: formValue(form, 'inference') } ],
      links: [{ topicId, kind: 'application', reason: `This case illustrates ${draft.topics.find((topic) => topic.id === topicId)?.title || topicId} in practice.` },
        ...(existing?.links || []).slice(1)], ...(existing?.archived ? { archived: true } : {}) };
    if (existing) Object.assign(existing, next); else draft.events.push(next);
    changed(); renderCases(); form.reset(); delete form.dataset.editId;
    form.querySelector('button[type=submit]').textContent = 'Add case';
  });
  $('#teacher-save').addEventListener('click', async () => {
    try {
      const result = await K.api('draft', 'POST', { graphId, payload: draft, expectedRevision: revision });
      revision = result.revision; dirty = false; $('#teacher-reviewed').checked = false;
      controls(); msg(`Saved private draft ${revision}. Review every page before publishing.`);
    } catch (error) { msg(error.message); }
  });
  function preview(page) {
    if (!draft) return;
    const query = { graph: graphId, draftPreview: '1' };
    if (page === 'concept') query.topic = selectedId || draft.topics[0]?.id;
    if (page === 'question') query.question = (draft.questions || []).find((item) => item.topicId === selectedId)?.id || draft.questions?.[0]?.id;
    if (page === 'case') {
      const item = (draft.events || []).find((event) => event.links.some((link) => link.topicId === selectedId)) || draft.events?.[0];
      query.case = item?.id; query.topic = item?.links[0]?.topicId;
    }
    if ((page === 'question' && !query.question) || (page === 'case' && !query.case)) {
      msg(`Add a ${page} before previewing it.`); return;
    }
    sessionStorage.setItem('skillloop.knowledge.preview', JSON.stringify(draft));
    const frame = $('#teacher-frame'); frame.hidden = false;
    frame.src = `${page}.html?${new URLSearchParams(query)}`;
    msg(`Previewing current ${page} draft. Save this version before publishing.`);
  }
  for (const [id, page] of [['teacher-preview','graph'], ['teacher-preview-concept','concept'],
    ['teacher-preview-question','question'], ['teacher-preview-case','case']])
    $(`#${id}`).addEventListener('click', () => preview(page));
  $('#teacher-reviewed').addEventListener('change', controls);
  $('#teacher-publish').addEventListener('click', async () => {
    if (!revision || dirty || !$('#teacher-reviewed').checked) return;
    try {
      const result = await K.api('publish', 'POST', { graphId, revision, reviewed: true });
      $('#teacher-reviewed').checked = false; controls(); await graphs();
      msg(`Published ${result.version}. The share link now serves this version.`);
    } catch (error) { msg(error.message); }
  });
  $('#teacher-discovery').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('#teacher-discovery-status').textContent = 'Searching sources…';
    try {
      const result = await K.api('discover', 'POST', { query: formValue(event.currentTarget, 'query') });
      $('#teacher-research').textContent = result.summary;
      const list = $('#teacher-sources'); list.replaceChildren();
      for (const source of result.sources) {
        const item = K.make('li'); const a = K.make('a', '', source.title || source.url);
        a.href = source.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; item.append(a); list.append(item);
      }
      $('#teacher-discovery-status').textContent = 'Private research note. Verify sources before writing a case.';
    } catch (error) { $('#teacher-discovery-status').textContent = error.message; }
  });
  controls();
  try {
    const session = await K.api('session');
    if (session.signedIn && session.role === 'teacher') {
      signedIn = true; controls(); await graphs(); $('#teacher-status').textContent = `Signed in as ${session.email}.`;
    } else if (session.signedIn) $('#teacher-status').textContent = 'Teacher role required.';
  } catch { $('#teacher-status').textContent = 'Sign in when the knowledge backend is configured.'; }
})();
