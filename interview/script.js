/** Conversation view. Decisions, AI feedback and student revisions remain distinct. */
(function () {
  const app = window.SkillLoop;
  const story = window.SkillLoopStory;
  const legacyModel = window.SkillLoopInterviewModel;
  const $ = (selector) => document.querySelector(selector);
  const state = story.restore(app.read('interviewStory', {}));
  const context = legacyModel.contextFromSearch(location.search);
  let session = null;
  let available = false;
  let busy = false;
  let storage = true;
  let retryAction = null;
  let assisted = false;
  try {
    localStorage.setItem('skillloop.story.check', '1');
    localStorage.removeItem('skillloop.story.check');
  } catch (_) {
    storage = false;
  }
  const node = (tag, className, text) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const icon = (name) => {
    const item = node('i');
    item.dataset.lucide = name;
    item.setAttribute('aria-hidden', 'true');
    return item;
  };
  function button(text, action, className = 'iv-text-button', symbol) {
    const item = node('button', className, text);
    item.type = 'button';
    if (symbol) item.append(icon(symbol));
    item.addEventListener('click', action);
    return item;
  }
  function save() {
    app.write('interviewStory', state);
  }
  function announce(text) {
    $('#iv-status').textContent = text;
  }
  function mode() {
    const live = session ? session.mode === 'ai' : available;
    $('#iv-mode').textContent = live ? 'Live AI' : 'Demo conversation';
    $('#iv-mode').classList.toggle('is-live', live);
    $('#iv-room-note').textContent = live
      ? 'AI adapts to your replies. Choose one, or use your own words.'
      : 'Scripted demo · live AI is not connected.';
    $('#iv-save-status').textContent = storage
      ? 'Saved in this browser'
      : 'Saved for this visit only';
  }
  function setBusy(value, label) {
    busy = value;
    for (const item of document.querySelectorAll('#interview-app button')) item.disabled = value;
    $('#iv-thinking').hidden = !value;
    $('#iv-scene').setAttribute('aria-busy', String(value));
    if (label) announce(label);
  }
  function show(view, focus = false) {
    $('#iv-room').hidden = view !== 'room';
    $('#iv-review').hidden = view !== 'review';
    document.body.classList.toggle('iv-in-review', view === 'review');
    if (session) {
      state.lastSessionId = session.id;
      state.lastView = view;
      save();
    }
    if (focus) {
      const heading = view === 'room' ? $('#iv-question') : $('#iv-review-title');
      heading.focus({ preventScroll: true });
      $('#main-content').scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    mode();
    app.icons();
  }
  function sameContext(record) {
    return (
      (!context.conceptId || record.context.conceptId === context.conceptId) &&
      ['courseId', 'activityId', 'graphId', 'publicationVersion'].every(
        (key) => (record.context[key] || '') === (context[key] || '')
      )
    );
  }
  async function home(resumeLast = false) {
    session = null;
    retryAction = null;
    const previous = state.sessions.find((s) => s.id === state.lastSessionId && sameContext(s));
    if (resumeLast && state.lastView === 'review' && previous?.status === 'completed')
      return open(previous);
    const pending = state.sessions.find((s) => s.status === 'active' && sameContext(s));
    if (pending) return open(pending);
    const topic =
      story.topics.find((t) => t.conceptId === context.conceptId) ||
      story.topic(state.sessions[0]?.topicId);
    return start(topic.id);
  }
  async function ask(action, index) {
    const cleanSession = JSON.parse(JSON.stringify(session));
    cleanSession.review = null;
    cleanSession.suggestions = {};
    cleanSession.comparisons = {};
    cleanSession.revisionDrafts = {};
    for (const turn of cleanSession.turns)
      turn.revisions = action === 'compare' ? turn.revisions.slice(-1) : [];
    const response = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, session: cleanSession, index }),
      signal: AbortSignal.timeout(42000),
    });
    let body;
    try {
      body = await response.json();
    } catch (_) {
      throw new Error('The AI connection is unavailable. Your conversation is saved.');
    }
    if (!response.ok || body.source !== 'ai')
      throw new Error(body.error || 'The AI connection is unavailable. Please retry.');
    return body.result;
  }
  async function start(topicId) {
    if (busy) return;
    $('#iv-scenarios').close();
    const profile = app.read('profile', {}) || {};
    const learnerLevel = ['beginner', 'student', 'graduate'].includes(profile.background)
      ? profile.background
      : 'beginner';
    const conceptId =
      context.conceptId && !story.topics.some((t) => t.conceptId === context.conceptId)
        ? context.conceptId
        : story.topic(topicId).conceptId;
    session = story.create(topicId, available ? 'ai' : 'demo', {
      ...context,
      learnerLevel,
      conceptId,
    });
    state.sessions.unshift(session);
    state.sessions = state.sessions.slice(0, 30);
    save();
    $('#iv-scenario-open').replaceChildren(
      document.createTextNode(story.topic(topicId).title),
      icon('chevron-down')
    );
    app.appendEvent({
      module: 'interview',
      type: 'conversation-started',
      sessionId: session.id,
      conceptId: session.context.conceptId,
    });
    await next();
  }
  async function open(record) {
    session = record;
    $('#iv-history').close();
    $('#iv-scenario-open').replaceChildren(
      document.createTextNode(story.topic(record.topicId).title),
      icon('chevron-down')
    );
    if (record.status === 'completed') await review();
    else if (record.current) renderTurn(true);
    else await next();
  }
  function renderTurn(focus = false) {
    const turn = session.current;
    $('#iv-error').hidden = true;
    $('#iv-exit').hidden = false;
    $('#iv-log-open').hidden = !session.turns.length;
    $('#iv-stage').textContent = [
      "Let's begin",
      'A closer look',
      'A new angle',
      'Your decision',
      'One last question',
    ][session.turns.length];
    $('#iv-ack').textContent = turn.acknowledgement;
    $('#iv-feedback').hidden = !turn.feedback?.observation;
    $('#iv-feedback-observation').textContent = turn.feedback?.observation || '';
    $('#iv-feedback-suggestion').textContent = turn.feedback?.suggestion
      ? 'Try: ' + turn.feedback.suggestion
      : '';
    $('#iv-question').textContent = turn.question;
    $('#iv-last-answer').hidden = !session.turns.length;
    $('#iv-last-answer').textContent = session.turns.length
      ? 'You: ' + session.turns.at(-1).answer
      : '';
    $('#iv-choice-label').textContent = 'A place to start';
    $('#iv-choices').hidden = false;
    $('#iv-choices').replaceChildren();
    turn.choices.forEach((choice, index) =>
      $('#iv-choices').append(
        button(
          choice,
          () => {
            session.draft = choice;
            session.draftIdea = { index, text: choice };
            session.updatedAt = new Date().toISOString();
            save();
            $('#iv-answer').value = choice;
            $('#iv-ideas').close();
            $('#iv-answer').focus();
            $('#iv-answer').setCustomValidity('');
            announce('Idea added. Edit it before sending your reply.');
          },
          'iv-choice',
          'corner-down-left'
        )
      )
    );
    $('#iv-compose').hidden = false;
    $('#iv-choices').hidden = false;
    $('#iv-own-answer').hidden = false;
    $('#iv-answer').value = session.draft;
    show('room', focus);
  }
  async function next() {
    $('#iv-compose').hidden = true;
    $('#iv-own-answer').hidden = true;
    $('#iv-feedback').hidden = true;
    $('#iv-choices').replaceChildren();
    $('#iv-choice-label').textContent = '';
    $('#iv-ack').textContent = '';
    $('#iv-question').textContent = session.turns.length
      ? 'Let me think about that…'
      : 'Let’s get comfortable.';
    $('#iv-error').hidden = true;
    $('#iv-exit').hidden = false;
    $('#iv-log-open').hidden = !session.turns.length;
    $('#iv-last-answer').hidden = !session.turns.length;
    $('#iv-last-answer').textContent = session.turns.length
      ? 'You: ' + session.turns.at(-1).answer
      : '';
    show('room', true);
    setBusy(true, 'Maya is preparing a reply.');
    try {
      const turn = session.mode === 'ai' ? await ask('turn') : story.demoTurn(session);
      story.accept(session, turn);
      save();
      setBusy(false);
      if (session.status === 'completed') await review();
      else renderTurn(true);
    } catch (error) {
      setBusy(false);
      $('#iv-thinking').hidden = true;
      $('#iv-question').textContent = 'We can pick up right here.';
      $('#iv-error-text').textContent = error.message;
      $('#iv-error').hidden = false;
      retryAction = next;
    }
  }
  async function reply(text, choiceIndex = null) {
    if (busy) return;
    $('#iv-ideas').close();
    try {
      story.answer(session, text, choiceIndex);
    } catch (error) {
      announce(error.message);
      return;
    }
    save();
    await next();
  }
  function renderTranscript(target, records = session.turns) {
    target.replaceChildren();
    records.forEach((turn, index) => {
      const item = node('article', 'iv-turn-record');
      if (turn.acknowledgement) item.append(node('p', 'iv-small', 'Maya: ' + turn.acknowledgement));
      item.append(
        node('h3', '', index + 1 + '. Maya: ' + turn.question),
        node('p', '', 'You: ' + turn.answer)
      );
      if (turn.feedback)
        item.append(
          node(
            'p',
            'iv-turn-feedback',
            'Feedback: ' + turn.feedback.observation + '\nTry: ' + turn.feedback.suggestion
          )
        );
      for (const [version, revision] of turn.revisions.entries())
        item.append(
          node(
            'p',
            'iv-turn-revision',
            'Revision ' +
              (version + 1) +
              (revision.assisted ? ' · AI-assisted draft' : '') +
              ': ' +
              revision.text
          )
        );
      target.append(item);
    });
  }
  async function review() {
    $('#iv-error').hidden = true;
    $('#iv-review-summary').textContent =
      session.review?.summary || 'Your conversation is saved. Preparing your review…';
    $('#iv-highlights').replaceChildren();
    $('#iv-next-practice').textContent = '';
    $('#iv-review-retry').hidden = true;
    $('#iv-feedback-title').textContent =
      session.mode === 'ai' ? 'From the conversation' : 'Reflection prompts';
    $('#iv-review-source').textContent =
      session.mode === 'ai'
        ? 'AI feedback on the original conversation. Suggestions are examples; saved revisions stay separate.'
        : 'Demo reflection prompts and example rewrites are authored. They are not a personalised AI assessment.';
    $('#iv-lesson').href =
      legacyModel.safeReturnPath(session.context.returnTo) ||
      '../knowledge-map/?topic=' + encodeURIComponent(session.context.conceptId);
    const select = $('#iv-improve-select');
    select.replaceChildren();
    session.turns.forEach((turn, index) => {
      const option = node('option', '', 'Answer ' + (index + 1));
      option.value = index;
      select.append(option);
    });
    select.value = String(session.review?.highlights.find((h) => h.kind === 'improve')?.turn || 0);
    renderEditor();
    renderTranscript($('#iv-transcript'));
    $('#iv-transcript-count').textContent = session.turns.length + ' replies';
    $('#iv-transcript').parentElement.open = false;
    show('review', true);
    if (!session.review) {
      setBusy(true, 'Preparing your review.');
      try {
        const result = session.mode === 'ai' ? await ask('review') : story.demoReview(session);
        if (!story.validReview(result, session.turns))
          throw new Error('The review could not be linked to your answers. Please retry.');
        session.review = result;
        session.updatedAt = new Date().toISOString();
        save();
      } catch (error) {
        $('#iv-review-summary').textContent = error.message;
        $('#iv-review-retry').hidden = false;
      } finally {
        setBusy(false);
      }
    }
    renderFeedback();
    app.icons();
  }
  function renderFeedback() {
    if (!session.review) return;
    $('#iv-review-summary').textContent = session.review.summary;
    $('#iv-next-practice').textContent = session.review.nextStep;
    const target = $('#iv-highlights');
    target.replaceChildren();
    for (const item of session.review.highlights) {
      const card = node('article', 'iv-highlight');
      const heading = node('div', 'iv-highlight-head');
      heading.append(
        icon(item.kind === 'strength' ? 'circle-check' : 'pencil-line'),
        node('h3', '', item.title)
      );
      card.append(
        heading,
        node('blockquote', '', '“' + item.quote + '”'),
        node('p', '', item.advice),
        button(
          'Revisit answer ' + (item.turn + 1),
          () => {
            $('#iv-improve-select').value = item.turn;
            renderEditor();
            $('#iv-revision').focus();
          },
          'iv-text-button',
          'arrow-up-right'
        )
      );
      target.append(card);
    }
    app.icons();
  }
  function renderEditor() {
    const index = Number($('#iv-improve-select').value);
    const turn = session.turns[index];
    const draft = session.revisionDrafts[index];
    assisted = draft?.assisted || false;
    $('#iv-original').textContent = 'You said: ' + turn.answer;
    $('#iv-revision').value = draft?.text ?? turn.revisions.at(-1)?.text ?? turn.answer;
    $('#iv-suggestion').hidden = true;
    $('#iv-suggestion').replaceChildren();
    $('#iv-improve-status').textContent = '';
    $('#iv-suggest').replaceChildren(
      icon('sparkles'),
      document.createTextNode(
        session.mode === 'ai' ? 'See an AI suggestion' : 'See a scenario example'
      )
    );
    $('#iv-compare').hidden = !turn.revisions.length || session.mode !== 'ai';
    $('#iv-comparison').hidden = true;
    if (session.comparisons[index] && !draft) showComparison(session.comparisons[index]);
    if (draft) $('#iv-compare').hidden = true;
    app.icons();
  }
  function showSuggestion(result) {
    const target = $('#iv-suggestion');
    target.replaceChildren();
    target.hidden = false;
    target.append(
      node('strong', '', session.mode === 'ai' ? 'AI suggestion' : 'Example for this scenario'),
      node('p', '', result.suggestion),
      node('p', 'iv-small', result.reason),
      button(
        'Use as a starting point',
        () => {
          $('#iv-revision').value = result.suggestion;
          assisted = true;
          saveRevisionDraft();
          $('#iv-revision').focus();
        },
        'iv-text-button',
        'pencil-line'
      )
    );
    app.icons();
  }
  async function suggest() {
    const index = Number($('#iv-improve-select').value);
    if (session.suggestions[index]) return showSuggestion(session.suggestions[index]);
    setBusy(true, 'Preparing an example response.');
    $('#iv-improve-status').textContent = 'Preparing an example…';
    try {
      const result =
        session.mode === 'ai'
          ? await ask('rewrite', index)
          : {
              suggestion: story.topic(session.topicId).example,
              reason: 'An authored example. Add details that fit your own reasoning.',
            };
      session.suggestions[index] = result;
      save();
      showSuggestion(result);
      $('#iv-improve-status').textContent = '';
    } catch (error) {
      $('#iv-improve-status').textContent = error.message;
    } finally {
      setBusy(false);
    }
  }
  function showComparison(result) {
    const target = $('#iv-comparison');
    target.replaceChildren(
      node('p', '', result.improved),
      node('p', '', 'Next: ' + result.nextStep)
    );
    target.hidden = false;
  }
  async function compare() {
    const index = Number($('#iv-improve-select').value);
    if (session.comparisons[index]) return showComparison(session.comparisons[index]);
    setBusy(true, 'Comparing your two versions.');
    $('#iv-improve-status').textContent = 'Comparing versions…';
    try {
      const result = await ask('compare', index);
      session.comparisons[index] = result;
      save();
      showComparison(result);
      $('#iv-improve-status').textContent = '';
    } catch (error) {
      $('#iv-improve-status').textContent = error.message;
    } finally {
      setBusy(false);
    }
  }
  function history() {
    const finished = state.sessions.filter((s) => s.status === 'completed').length;
    const revisions = state.sessions.reduce(
      (total, s) => total + s.turns.filter((t) => t.revisions.length).length,
      0
    );
    $('#iv-history-summary').textContent = state.sessions.length
      ? finished +
        ' completed · ' +
        revisions +
        ' answers revisited · ' +
        (storage ? 'this browser' : 'this visit only')
      : 'Your next conversation will appear here.';
    const list = $('#iv-history-list');
    list.replaceChildren();
    for (const record of [...state.sessions].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    )) {
      const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
        new Date(record.updatedAt)
      );
      const item = button('', () => open(record), 'iv-history-item');
      const copy = node('span', '', story.topic(record.topicId).title);
      copy.append(
        node(
          'small',
          '',
          date +
            ' · ' +
            record.turns.length +
            ' replies · ' +
            (record.mode === 'ai' ? 'AI conversation' : 'Demo')
        )
      );
      item.append(
        icon(record.status === 'completed' ? 'notebook-pen' : 'message-circle'),
        copy,
        node('small', '', record.status === 'completed' ? 'Review' : 'Continue')
      );
      list.append(item);
    }
    const legacy = legacyModel.restore(app.read('interviewStudio', {})).sessions;
    $('#iv-legacy').hidden = !legacy.length;
    const oldList = $('#iv-legacy-list');
    oldList.replaceChildren();
    for (const record of legacy) {
      const entry = node('details');
      entry.append(node('summary', '', record.activity.title));
      for (const answer of record.answers) {
        const text = node('div', 'iv-turn-record');
        text.append(node('h3', '', answer.question), node('p', '', answer.original));
        for (const r of answer.revisions) text.append(node('p', 'iv-turn-revision', r.text));
        entry.append(text);
      }
      if (record.draft) entry.append(node('p', 'iv-small', 'Saved draft: ' + record.draft));
      oldList.append(entry);
    }
    $('#iv-history').showModal();
    app.icons();
  }
  $('#iv-history-open').addEventListener('click', history);
  $('#iv-history-close').addEventListener('click', () => $('#iv-history').close());
  $('#iv-log-close').addEventListener('click', () => $('#iv-log').close());
  $('#iv-log-open').addEventListener('click', () => {
    renderTranscript($('#iv-log-list'));
    $('#iv-log').showModal();
  });
  $('#iv-exit').addEventListener('click', () => {
    save();
    location.href = '../index.html';
  });
  $('#iv-home').addEventListener('click', () => home(false));
  $('#iv-again').addEventListener('click', () => $('#iv-scenarios').showModal());
  $('#iv-scenario-open').addEventListener('click', () => $('#iv-scenarios').showModal());
  $('#iv-scenarios-close').addEventListener('click', () => $('#iv-scenarios').close());
  for (const topic of story.topics)
    $('#iv-scenario-list').append(
      button(topic.title, () => start(topic.id), 'iv-choice', topic.icon)
    );
  $('#iv-retry').addEventListener('click', () => retryAction?.());
  $('#iv-review-retry').addEventListener('click', review);
  $('#iv-own-answer').addEventListener('click', () => {
    $('#iv-ideas').showModal();
    app.icons();
  });
  $('#iv-ideas-close').addEventListener('click', () => $('#iv-ideas').close());
  $('#iv-answer').addEventListener('input', () => {
    session.draft = $('#iv-answer').value;
    session.updatedAt = new Date().toISOString();
    save();
    $('#iv-answer').setCustomValidity('');
  });
  $('#iv-answer').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) {
      event.preventDefault();
      $('#iv-compose').requestSubmit();
    }
  });
  $('#iv-compose').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = $('#iv-answer').value;
    if (!text.trim()) {
      $('#iv-answer').setCustomValidity('Write what you would say.');
      $('#iv-answer').reportValidity();
      return;
    }
    reply(text, session.draftIdea?.text === text.trim() ? session.draftIdea.index : null);
  });
  $('#iv-improve-select').addEventListener('change', renderEditor);
  $('#iv-suggest').addEventListener('click', suggest);
  $('#iv-compare').addEventListener('click', compare);
  function saveRevisionDraft() {
    const index = Number($('#iv-improve-select').value);
    session.revisionDrafts[index] = { text: $('#iv-revision').value, assisted };
    session.updatedAt = new Date().toISOString();
    save();
    $('#iv-compare').hidden = true;
    $('#iv-comparison').hidden = true;
    $('#iv-improve-status').textContent = storage
      ? 'Draft saved. Save your version when ready.'
      : 'Draft kept for this visit.';
  }
  $('#iv-revision').addEventListener('input', saveRevisionDraft);
  $('#iv-revise-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const index = Number($('#iv-improve-select').value);
    try {
      const changed = story.revise(session, index, $('#iv-revision').value);
      if (changed) {
        session.turns[index].revisions.at(-1).assisted = assisted;
        save();
        renderTranscript($('#iv-transcript'));
      }
      $('#iv-improve-status').textContent = changed
        ? 'Version saved. Your original answer is preserved.'
        : 'No changes yet. Try adding a reason or an example.';
      $('#iv-compare').hidden = !session.turns[index].revisions.length || session.mode !== 'ai';
      $('#iv-comparison').hidden = true;
    } catch (error) {
      $('#iv-improve-status').textContent = error.message;
    }
  });
  $('#iv-export').addEventListener('click', () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
    );
    const link = node('a');
    link.href = url;
    link.download = session.id + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  app.icons();
  if (location.protocol === 'file:') {
    home(true);
    return;
  }
  setBusy(true);
  fetch('/api/interview', { signal: AbortSignal.timeout(5000) })
    .then((r) => (r.ok ? r.json() : { available: false }))
    .then((result) => {
      available = result.available === true;
    })
    .catch(() => {})
    .finally(() => {
      setBusy(false);
      home(true);
    });
})();
