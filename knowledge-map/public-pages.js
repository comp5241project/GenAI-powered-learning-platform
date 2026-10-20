(async function () {
  const K = window.KnowledgeNetwork;
  const $ = K.$;
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const link = (label, href) => { const a = K.make('a', '', label); a.href = href; return a; };
  const status = (message) => { $('#kn-status').textContent = message; };
  try {
    const { graph, preview, sample } = await K.loadGraph();
    const topics = new Map(graph.topics.map((topic) => [topic.id, topic]));
    const active = graph.topics.filter((topic) => !topic.archived);
    const questions = graph.questions || [];
    const events = graph.events || [];
    const relations = graph.relations || [];
    const breadcrumbs = $('#kn-breadcrumbs');
    breadcrumbs.append(link('My network', 'index.html'));
    if (page !== 'graph') breadcrumbs.append(link(graph.publication.title, K.href('graph')));
    status(`${preview ? 'Private draft preview' : sample ? 'Curated sample' : 'Published'} · version ${graph.publication.version}`);
    if (page === 'graph') {
      $('#kn-title').textContent = graph.publication.title;
      const canvas = new K.Canvas($('#kn-canvas'), { onSelect: showSelection });
      canvas.set(active, relations.filter((relation) => topics.has(relation.source) && topics.has(relation.target)));
      $('#kn-zoom-in').addEventListener('click', () => canvas.zoom(1.2));
      $('#kn-zoom-out').addEventListener('click', () => canvas.zoom(1 / 1.2));
      const list = $('#kn-list');
      function renderList() {
        const query = $('#kn-search').value.trim().toLowerCase();
        list.replaceChildren();
        const fragment = document.createDocumentFragment();
        for (const topic of active) {
          if (query && !`${topic.title} ${topic.description}`.toLowerCase().includes(query)) continue;
          const button = K.make('button', 'kn-list-button', topic.title);
          button.type = 'button';
          button.addEventListener('click', () => canvas.focus(topic.id));
          fragment.append(button);
        }
        list.append(fragment);
        if (!list.childElementCount) list.textContent = 'No matching concepts.';
      }
      $('#kn-search').addEventListener('input', renderList);
      renderList();
      function showSelection(id) {
        const topic = topics.get(id);
        if (!topic) return;
        $('#kn-selected-title').textContent = topic.title;
        const selected = $('#kn-selected');
        selected.replaceChildren(K.make('p', '', topic.description), link('Open knowledge page →', K.href('concept', { topic: id })));
        const details = $('#kn-relations');
        details.replaceChildren();
        for (const relation of relations.filter((item) => item.source === id || item.target === id)) {
          const otherId = relation.source === id ? relation.target : relation.source;
          const other = topics.get(otherId);
          if (!other) continue;
          const p = K.make('p', '', `${topics.get(relation.source)?.title} → ${topics.get(relation.target)?.title}: ${relation.reason}`);
          p.append(' ', link(`Open ${other.title}`, K.href('concept', { topic: otherId })));
          details.append(p);
        }
      }
      if (active.length) canvas.focus(active[0].id);
      return;
    }
    if (page === 'concept') {
      const topic = topics.get(params.get('topic'));
      if (!topic) throw new Error('Concept not found.');
      breadcrumbs.append(link(topic.title, K.href('concept', { topic: topic.id })));
      $('#kn-title').textContent = topic.title;
      $('#kn-description').textContent = topic.description;
      $('#kn-goal').textContent = topic.lesson.goal;
      $('#kn-explanation').textContent = topic.lesson.explanation;
      $('#kn-example').textContent = topic.lesson.example;
      $('#kn-next').textContent = topic.lesson.nextAction;
      if (topic.archived) status(`Archived concept · source version ${graph.publication.version}`);
      const pages = $('#kn-next-pages');
      for (const question of questions.filter((item) => item.topicId === topic.id && !item.archived))
        pages.append(link(`Practice: ${question.prompt}`, K.href('question', { question: question.id })));
      for (const event of events.filter((item) => !item.archived && item.links.some((entry) => entry.topicId === topic.id)))
        pages.append(link(`Case: ${event.title}`, K.href('case', { case: event.id, topic: topic.id })));
      if (!pages.childElementCount) pages.textContent = 'More materials will appear when the teacher publishes them.';
      $('#kn-reference').addEventListener('click', async () => {
        try {
          const session = await K.api('session');
          if (session.signedIn) {
            const result = await K.api('reference', 'POST', { graphId: graph.publication.id,
              conceptId: topic.id, sourceVersion: graph.publication.version });
            status(result.created ? 'Referenced in your account network.' : 'Already in your account network.');
          } else {
            status(K.referenceNode(graph, topic, K.local()) ? 'Referenced in this browser. Open My network to see it.' : 'Already in this browser network.');
          }
        } catch (error) {
          if (/configured|unavailable|Failed to fetch/i.test(error.message))
            status(K.referenceNode(graph, topic, K.local()) ? 'Referenced in this browser.' : 'Already referenced in this browser.');
          else status(error.message);
        }
      });
      const mark = $('#kn-studied');
      const old = K.legacy();
      const studied = new Set(window.SkillLoop.read('knowledgeStudyV2',
        (old.completed || []).map((id) => `${K.sampleId}:${id}`)));
      const markKey = `${graph.publication.id}:${topic.id}`;
      mark.textContent = studied.has(markKey) ? 'Remove studied mark' : 'Mark as studied';
      mark.addEventListener('click', () => {
        if (studied.has(markKey)) studied.delete(markKey); else studied.add(markKey);
        window.SkillLoop.write('knowledgeStudyV2', [...studied]);
        if (graph.publication.id === K.sampleId) {
          const completed = new Set(old.completed || []);
          if (studied.has(markKey)) completed.add(topic.id); else completed.delete(topic.id);
          window.SkillLoop.write('knowledge', { ...old, completed: [...completed] });
        }
        mark.textContent = studied.has(markKey) ? 'Remove studied mark' : 'Mark as studied';
        status('Study mark saved in this browser.');
      });
      return;
    }
    if (page === 'question') {
      const question = questions.find((item) => item.id === params.get('question'));
      if (!question) throw new Error('Question not found.');
      const topic = topics.get(question.topicId);
      breadcrumbs.append(link(topic.title, K.href('concept', { topic: topic.id })));
      breadcrumbs.append(link('Question', K.href('question', { question: question.id })));
      $('#kn-title').textContent = `${topic.title}: practice`;
      $('#kn-prompt').textContent = question.prompt;
      question.options.forEach((option, index) => {
        const label = K.make('label', 'kn-choice');
        const input = K.make('input');
        input.type = 'radio'; input.name = 'answer'; input.value = String(index);
        label.append(input, document.createTextNode(option));
        $('#kn-options').append(label);
      });
      $('#kn-answer').addEventListener('submit', (event) => {
        event.preventDefault();
        const checked = document.querySelector('input[name="answer"]:checked');
        $('#kn-feedback').textContent = checked
          ? `${Number(checked.value) === question.answerIndex ? 'Correct. ' : 'Try again. '}${question.feedback}`
          : 'Choose an answer first.';
      });
      return;
    }
    if (page === 'case') {
      const event = events.find((item) => item.id === params.get('case'));
      if (!event) throw new Error('Case not found.');
      const related = event.links.find((item) => item.topicId === params.get('topic')) || event.links[0];
      if (related) breadcrumbs.append(link(topics.get(related.topicId)?.title || related.topicId,
        K.href('concept', { topic: related.topicId })));
      breadcrumbs.append(link('Case', K.href('case', { case: event.id, ...(related ? { topic: related.topicId } : {}) })));
      $('#kn-title').textContent = event.title;
      $('#kn-case-date').textContent = `Event date: ${event.date}`;
      $('#kn-summary').textContent = event.summary;
      for (const claim of event.claims) $('#kn-claims').append(K.make('li', '',
        `${claim.kind === 'source-supported' ? 'Source-supported' : 'Teaching inference'}: ${claim.text}${claim.sourceSection ? ` (${claim.sourceSection})` : ''}`));
      const source = event.source;
      $('#kn-source').append(`Source: ${source.title}; published ${source.publishedDate}; checked ${source.checkedDate}. `,
        link('Open source ↗', source.url));
      for (const connection of event.links) $('#kn-case-links').append(link(
        `${topics.get(connection.topicId)?.title || connection.topicId}: ${connection.reason}`,
        K.href('concept', { topic: connection.topicId })));
    }
  } catch (error) {
    $('#kn-title').textContent = 'This page is unavailable';
    status(error.message);
  }
})();
