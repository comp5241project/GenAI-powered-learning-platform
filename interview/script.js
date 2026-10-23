/** Page controller. Sample interactions are authored; session data stays provider-independent. */
(function () {
  const app = window.SkillLoop;
  const model = window.SkillLoopInterviewModel;
  const activities = window.SkillLoopInterviewActivities;
  const $ = (selector) => document.querySelector(selector);
  const initial = app.read('interviewStudio', {});
  const state = model.restore(initial);
  const context = model.contextFromSearch(location.search);
  const views = ['setup', 'practice', 'review'];
  let session = null;
  let selected =
    activities.find((item) => item.conceptId === context.conceptId)?.id ||
    activities.find((item) => item.id === initial.selected)?.id ||
    'testing';
  let storageAvailable = true;

  try {
    localStorage.setItem('skillloop.interview.storage-check', '1');
    localStorage.removeItem('skillloop.interview.storage-check');
  } catch (_) {
    storageAvailable = false;
  }

  // Copy the old starter draft once. Its original key and event log are never changed.
  if (!state.sessions.length && !initial.schemaVersion) {
    const legacy = app.read('interview', {});
    if (typeof legacy.draft === 'string' && legacy.draft.trim()) {
      const imported = model.createSession(activities[0]);
      imported.draft = legacy.draft.slice(0, 5000);
      imported.importedFrom = 'interview';
      state.sessions.push(imported);
      save();
    }
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function icon(name) {
    const node = element('i');
    node.dataset.lucide = name;
    node.setAttribute('aria-hidden', 'true');
    return node;
  }
  function button(label, className, iconName) {
    const node = element('button', className, label);
    node.type = 'button';
    if (iconName) node.append(icon(iconName));
    return node;
  }
  function activity() {
    return state.custom[selected] || activities.find((item) => item.id === selected);
  }
  function save() {
    state.selected = selected;
    app.write('interviewStudio', state);
  }
  function announce(text) {
    $('#iv-announcement').textContent = text;
  }
  function latest(answer) {
    return answer.revisions.at(-1)?.text || answer.original;
  }
  function lessonHref(record) {
    const source = record ? record.context : context;
    const returnTo = model.safeReturnPath(source.returnTo);
    if (returnTo) return returnTo;
    return (
      '../knowledge-map/?topic=' +
      encodeURIComponent(
        source.conceptId || (record ? record.activity.conceptId : activity().conceptId)
      )
    );
  }
  function updateLessonLinks(record) {
    for (const id of ['setup', 'practice', 'review'])
      $('#iv-lesson-' + id).href = lessonHref(record);
  }
  function event(type, record = session) {
    if (!record) return;
    app.appendEvent({
      module: 'interview',
      type,
      conceptId: record.context.conceptId,
      courseId: record.context.courseId || undefined,
      activityId: record.context.activityId || record.activity.id,
      sessionId: record.id,
    });
  }
  function show(view, focus = false) {
    for (const name of views) $('#iv-' + name).hidden = name !== view;
    [...$('#iv-journey').children].forEach((step, index) => {
      const current = index === views.indexOf(view);
      step.classList.toggle('is-done', index < views.indexOf(view));
      if (current) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    announce('');
    if (focus) {
      const heading =
        view === 'practice'
          ? $('#iv-question')
          : view === 'review'
            ? $('#iv-review-title')
            : $('#iv-home-title');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      $('#main-content').scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
  function pending() {
    return state.sessions.find(
      (item) =>
        item.status === 'active' &&
        item.activity.id === selected &&
        (item.context.courseId || '') === context.courseId &&
        (item.context.activityId || '') === context.activityId &&
        (item.context.graphId || '') === context.graphId &&
        (item.context.publicationVersion || '') === context.publicationVersion &&
        (!context.conceptId || item.context.conceptId === context.conceptId)
    );
  }
  function renderHome(focus = false) {
    session = null;
    $('#iv-home-notice').hidden = true;
    const chosen = activity();
    const topics = $('#iv-topics');
    topics.replaceChildren();
    for (const item of activities) {
      const card = button('', 'iv-topic');
      card.setAttribute('aria-pressed', String(selected === item.id));
      const mark = element('span', 'iv-topic-icon');
      mark.append(icon(item.icon));
      card.append(
        mark,
        element('span', 'iv-topic-title', item.shortTitle),
        element('span', 'iv-topic-description', item.description)
      );
      if (selected === item.id) {
        const check = icon('circle-check');
        check.className = 'iv-topic-check';
        card.append(check);
      }
      card.addEventListener('click', () => {
        selected = item.id;
        save();
        renderHome();
        $('#iv-topics button[aria-pressed="true"]').focus();
      });
      topics.append(card);
    }
    $('#iv-activity-title').textContent = chosen.title;
    $('#iv-objective').textContent = chosen.objective;
    $('#iv-course-label').textContent = context.courseId
      ? 'FROM YOUR COURSE'
      : 'SOFTWARE DEVELOPMENT';
    const draft = pending();
    $('#iv-start').replaceChildren(
      document.createTextNode(draft ? 'Continue interview' : 'Start interview'),
      icon('arrow-right')
    );
    $('#iv-new').hidden = !draft;
    $('#iv-resume-note')?.remove();
    if (draft) {
      const note = element(
        'p',
        'iv-small iv-muted',
        'Continue at question ' + (draft.answers.length + 1) + ' of 3. Your draft is saved.'
      );
      note.id = 'iv-resume-note';
      $('#iv-objective').after(note);
    }
    $('#iv-level').disabled = Boolean(draft);
    if (draft) $('#iv-level').value = draft.level;
    $('#iv-storage-label').textContent = storageAvailable
      ? 'Saved in this browser'
      : 'Saved for this visit only';
    renderHistory();
    updateLessonLinks();
    show('setup', focus);
    app.icons();
  }
  function renderHistory() {
    const target = $('#iv-history-list');
    target.replaceChildren();
    const records = state.sessions.filter(
      (item) => !context.courseId || item.context.courseId === context.courseId
    );
    $('.iv-history').hidden = !records.length;
    if (!records.length) {
      const empty = element('div', 'iv-empty');
      empty.append(icon('notebook-pen'), element('p', '', 'Your next conversation starts here.'));
      target.append(empty);
      return;
    }
    const list = element('ul', 'iv-history-list');
    for (const record of [...records]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5)) {
      const row = button('', 'iv-history-item');
      const copy = element('span', 'iv-history-copy');
      copy.append(element('span', 'iv-history-title', record.activity.title));
      const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
        new Date(record.updatedAt)
      );
      copy.append(
        element('span', 'iv-history-meta', date + ' · ' + record.answers.length + ' of 3 answers')
      );
      row.append(
        icon(record.activity.icon || 'messages-square'),
        copy,
        element('span', 'iv-history-tag', record.status === 'completed' ? 'Review' : 'Continue'),
        icon('arrow-up-right')
      );
      row.addEventListener('click', () => {
        session = record;
        selected = record.activity.id;
        record.status === 'completed' ? renderReview(true) : renderPractice(true);
      });
      const item = element('li');
      item.append(row);
      list.append(item);
    }
    target.append(list);
  }
  function start(fresh = false) {
    session = fresh ? null : pending();
    if (!session) {
      session = model.createSession(
        activity(),
        { ...context, conceptId: context.conceptId || activity().conceptId },
        $('#iv-level').value
      );
      state.sessions.unshift(session);
      state.sessions = state.sessions.slice(0, 12);
      save();
      event('session-started');
    }
    renderPractice(true);
  }
  function renderPractice(focus = false, answerSaved = false) {
    const turn = session.answers.length;
    if (session.status === 'completed') return renderReview(focus);
    $('#iv-session-topic').textContent = session.activity.topic || 'COURSE PRACTICE';
    $('#iv-session-title').textContent = session.activity.title;
    $('#iv-turn-label').textContent = 'Question ' + (turn + 1) + ' of 3';
    $('#iv-question').textContent = session.activity.prompts[turn];
    $('#iv-guidance').textContent =
      session.level === 'guided'
        ? 'Write a few sentences about what you would do and why. A concrete example helps.'
        : 'Explain your decision, assumptions and trade-offs in a few sentences.';
    $('#iv-answer').value = session.draft;
    $('#iv-answer').setCustomValidity('');
    updateDraftStatus();
    $('#iv-send').replaceChildren(
      document.createTextNode(turn === 2 ? 'Review my answers' : 'Next question'),
      icon('arrow-right')
    );
    $('#iv-next-step').textContent =
      turn === 2
        ? 'Next: see all three answers. You can edit them there.'
        : 'Next: question ' + (turn + 2) + ' of 3. You can revise this answer at the end.';
    $('#iv-hint-content').textContent = session.activity.hints[turn];
    $('#iv-hint-content').hidden = !session.hints.includes(turn);
    $('#iv-hint').setAttribute('aria-expanded', String(!$('#iv-hint-content').hidden));
    $('#iv-hint').replaceChildren(
      icon('lightbulb'),
      document.createTextNode($('#iv-hint-content').hidden ? 'Show hint' : 'Hide hint')
    );
    renderMoves();
    renderProgress();
    renderEarlier();
    updateLessonLinks(session);
    show('practice', focus);
    if (focus && answerSaved) announce('Answer saved. Question ' + (turn + 1) + ' of 3.');
    app.icons();
  }
  function updateDraftStatus() {
    $('#iv-count').textContent = session.draft.length.toLocaleString('en') + ' / 5,000';
    $('#iv-draft-status').textContent = storageAvailable
      ? 'Draft saved · Ctrl / ⌘ + Enter to continue'
      : 'Stored for this visit only';
  }
  function renderMoves() {
    const turn = session.answers.length;
    const options = session.activity.moves?.[turn] || [];
    $('#iv-moves').hidden = !options.length;
    const target = $('#iv-move-options');
    target.replaceChildren();
    const choice = session.decisions?.find((item) => item.turn === turn);
    $('#iv-moves').open = Boolean(choice);
    $('#iv-consequence').hidden = !choice;
    $('#iv-consequence').textContent = choice?.consequence || '';
    for (const item of options) {
      const move = button('', 'iv-move');
      move.append(icon(item.icon), document.createTextNode(item.label));
      move.setAttribute('aria-pressed', String(choice?.choiceId === item.id));
      move.addEventListener('click', () => {
        model.chooseMove(session, item.id);
        save();
        for (const other of target.children)
          other.setAttribute('aria-pressed', String(other === move));
        $('#iv-consequence').textContent = item.consequence;
        $('#iv-consequence').hidden = false;
        announce('');
      });
      target.append(move);
    }
  }
  function renderProgress() {
    const target = $('#iv-progress');
    target.replaceChildren();
    const stages = [
      ['Your approach', 'Explain what you would do', 'message-circle'],
      ['A follow-up', 'Consider a new situation', 'git-branch'],
      ['Your decision', 'Explain your next action', 'notebook-pen'],
    ];
    stages.forEach(([title, description, symbol], index) => {
      const done = index < session.answers.length;
      const current = index === session.answers.length;
      const row = element('li', 'iv-stage' + (done ? ' is-done' : current ? ' is-current' : ''));
      if (current) row.setAttribute('aria-current', 'step');
      row.setAttribute(
        'aria-label',
        title + (done ? ': answered' : current ? ': current question' : ': upcoming')
      );
      const marker = element('span', 'iv-stage-marker');
      marker.append(icon(done ? 'check' : symbol));
      const copy = element('div');
      copy.append(element('strong', '', title), element('small', '', description));
      row.append(marker, copy);
      target.append(row);
    });
  }
  function renderEarlier() {
    $('#iv-earlier').hidden = !session.answers.length;
    $('#iv-earlier-count').textContent = String(session.answers.length);
    const target = $('#iv-earlier-list');
    target.replaceChildren();
    for (const answer of session.answers) {
      const row = element('div', 'iv-past-turn');
      row.append(
        element('h3', '', answer.question),
        element('p', 'iv-answer-text', latest(answer))
      );
      target.append(row);
    }
  }
  function submit(eventObject) {
    eventObject.preventDefault();
    try {
      model.submitAnswer(session, $('#iv-answer').value);
    } catch (error) {
      $('#iv-answer').setCustomValidity(error.message);
      $('#iv-answer').reportValidity();
      return;
    }
    save();
    event('answer-saved');
    if (session.status === 'completed') {
      event('session-completed');
      renderReview(true);
    } else renderPractice(true, true);
  }
  function renderReview(focus = false) {
    $('#iv-review-saved').textContent = storageAvailable
      ? 'Saved in this browser'
      : 'Saved for this visit only';
    $('#iv-review-subtitle').textContent = session.activity.title;
    $('#iv-answer-total').textContent = String(session.answers.length);
    $('#iv-hint-total').textContent = String(session.hints.length);
    $('#iv-revision-total').textContent = String(
      session.answers.reduce((total, answer) => total + answer.revisions.length, 0)
    );
    $('#iv-answer-total').nextElementSibling.textContent =
      session.answers.length === 1 ? 'answer' : 'answers';
    $('#iv-hint-total').nextElementSibling.textContent =
      session.hints.length === 1 ? 'hint used' : 'hints used';
    $('#iv-revision-total').nextElementSibling.textContent =
      $('#iv-revision-total').textContent === '1' ? 'revision' : 'revisions';
    const target = $('#iv-review-list');
    target.replaceChildren();
    session.answers.forEach((answer, index) => {
      const card = element('details', 'iv-review-card');
      card.id = 'iv-review-turn-' + index;
      card.open = index === 0;
      card.append(element('summary', '', 'Question ' + (index + 1) + ' · ' + answer.question));
      const body = element('div', 'iv-review-body');
      const decision = session.decisions?.find((item) => item.turn === index);
      if (decision) {
        const move = element('p', 'iv-consequence', decision.label + ' — ' + decision.consequence);
        move.style.marginBottom = '18px';
        body.append(move);
      }
      const compare = element('div', answer.revisions.length ? 'iv-compare' : '');
      const original = element('div');
      original.append(
        element('div', 'iv-answer-heading', 'First answer'),
        element('p', 'iv-answer-text', answer.original)
      );
      compare.append(original);
      if (answer.revisions.length) {
        const revised = element('div');
        revised.append(
          element('div', 'iv-answer-heading', 'Latest revision'),
          element('p', 'iv-answer-text', latest(answer))
        );
        compare.append(revised);
      }
      body.append(compare);
      if (answer.revisions.length > 1) {
        const history = element('details', 'iv-earlier');
        history.append(element('summary', '', 'All ' + answer.revisions.length + ' revisions'));
        answer.revisions.forEach((revision, version) => {
          const row = element('div', 'iv-past-turn');
          row.append(
            element('h3', '', 'Revision ' + (version + 1)),
            element('p', 'iv-answer-text', revision.text)
          );
          history.append(row);
        });
        body.append(history);
      }
      const revise = button('Edit this answer', 'iv-text-button', 'pencil-line');
      revise.addEventListener('click', () => {
        if (body.querySelector('form')) return;
        const form = element('form', 'iv-revision-editor');
        const label = element('label', 'iv-answer-heading', 'Your revision');
        label.htmlFor = 'iv-revision-' + index;
        const input = element('textarea');
        input.id = label.htmlFor;
        input.value = latest(answer);
        input.maxLength = 5000;
        input.required = true;
        const controls = element('div', 'iv-answer-actions');
        const cancel = button('Cancel', 'iv-text-button');
        cancel.addEventListener('click', () => {
          form.remove();
          revise.hidden = false;
          revise.focus();
        });
        const commit = button('Save revision', 'iv-button iv-primary', 'check');
        commit.type = 'submit';
        controls.append(cancel, commit);
        form.append(label, input, controls);
        form.addEventListener('submit', (revisionEvent) => {
          revisionEvent.preventDefault();
          try {
            model.reviseAnswer(session, index, input.value);
          } catch (error) {
            input.setCustomValidity(error.message);
            input.reportValidity();
            return;
          }
          save();
          event('answer-revised');
          renderReview();
          const updated = $('#iv-review-turn-' + index);
          for (const reviewCard of document.querySelectorAll('.iv-review-card'))
            reviewCard.open = reviewCard === updated;
          updated.querySelector('summary').focus();
          announce('Revision saved. Your first answer is still here.');
        });
        input.addEventListener('input', () => input.setCustomValidity(''));
        body.append(form);
        revise.hidden = true;
        input.focus();
      });
      body.append(revise);
      card.append(body);
      target.append(card);
    });
    const checklist = $('#iv-checklist');
    checklist.replaceChildren();
    session.activity.criteria.forEach((criterion, index) => {
      const label = element('label', 'iv-check');
      const input = element('input');
      input.type = 'checkbox';
      input.checked = session.checklist.includes(index);
      input.addEventListener('change', () => {
        session.checklist = session.checklist.filter((value) => value !== index);
        if (input.checked) session.checklist.push(index);
        session.updatedAt = new Date().toISOString();
        save();
      });
      label.append(input, document.createTextNode(criterion));
      checklist.append(label);
    });
    $('#iv-reflection').value = session.reflection;
    updateLessonLinks(session);
    show('review', focus);
    app.icons();
  }
  function populateSettings(chosen) {
    $('#iv-config-title').value = chosen.title;
    $('#iv-config-goal').value = chosen.objective;
    $('#iv-config-question').value = chosen.prompts[0];
    $('#iv-config-followup-one').value = chosen.prompts[1];
    $('#iv-config-followup-two').value = chosen.prompts[2];
    $('#iv-config-criteria').value = chosen.criteria.join('\n');
  }
  $('#iv-start').addEventListener('click', () => start());
  $('#iv-new').addEventListener('click', () => start(true));
  $('#iv-exit').addEventListener('click', () => {
    save();
    renderHome(true);
  });
  $('#iv-home').addEventListener('click', () => renderHome(true));
  $('#iv-done').addEventListener('click', () => {
    save();
    renderHome(true);
    const notice = $('#iv-home-notice');
    notice.textContent =
      (storageAvailable
        ? 'Interview saved in this browser.'
        : 'Interview saved for this visit only.') + ' Reopen it in Recent practice below.';
    notice.hidden = false;
  });
  $('#iv-again').addEventListener('click', () => {
    const current = session;
    selected = current.activity.id;
    session = model.createSession(current.activity, current.context, current.level);
    state.sessions.unshift(session);
    state.sessions = state.sessions.slice(0, 12);
    save();
    event('session-started');
    renderPractice(true);
  });
  $('#iv-answer-form').addEventListener('submit', submit);
  $('#iv-answer').addEventListener('input', () => {
    $('#iv-answer').setCustomValidity('');
    session.draft = $('#iv-answer').value;
    session.updatedAt = new Date().toISOString();
    save();
    updateDraftStatus();
  });
  $('#iv-answer').addEventListener('keydown', (eventObject) => {
    if (
      eventObject.key === 'Enter' &&
      (eventObject.ctrlKey || eventObject.metaKey) &&
      !eventObject.isComposing
    ) {
      eventObject.preventDefault();
      $('#iv-answer-form').requestSubmit();
    }
  });
  $('#iv-hint').addEventListener('click', () => {
    const turn = session.answers.length;
    if (!session.hints.includes(turn)) {
      session.hints.push(turn);
      save();
      event('hint-opened');
    }
    $('#iv-hint-content').hidden = !$('#iv-hint-content').hidden;
    $('#iv-hint').setAttribute('aria-expanded', String(!$('#iv-hint-content').hidden));
    $('#iv-hint').replaceChildren(
      icon('lightbulb'),
      document.createTextNode($('#iv-hint-content').hidden ? 'Show hint' : 'Hide hint')
    );
    app.icons();
  });
  $('#iv-reflection').addEventListener('input', () => {
    session.reflection = $('#iv-reflection').value;
    session.updatedAt = new Date().toISOString();
    save();
  });
  $('#iv-export').addEventListener('click', () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
    );
    const link = element('a');
    link.href = url;
    link.download = session.id + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Practice record exported.');
  });
  $('#iv-settings').addEventListener('click', () => {
    populateSettings(activity());
    $('#iv-settings-dialog').showModal();
  });
  $('#iv-settings-close').addEventListener('click', () => $('#iv-settings-dialog').close());
  $('#iv-settings-reset').addEventListener('click', () =>
    populateSettings(activities.find((item) => item.id === selected))
  );
  $('#iv-settings-form').addEventListener('submit', (eventObject) => {
    eventObject.preventDefault();
    const criteriaInput = $('#iv-config-criteria');
    const criteria = criteriaInput.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!criteria.length || criteria.length > 3 || criteria.some((line) => line.length > 170)) {
      criteriaInput.setCustomValidity('Add one to three criteria, each up to 170 characters.');
      criteriaInput.reportValidity();
      return;
    }
    const custom = {
      ...activity(),
      title: $('#iv-config-title').value.trim(),
      objective: $('#iv-config-goal').value.trim(),
      prompts: [
        $('#iv-config-question').value.trim(),
        $('#iv-config-followup-one').value.trim(),
        $('#iv-config-followup-two').value.trim(),
      ],
      criteria,
      moves: [],
      hints: [
        'State an assumption and give a concrete example.',
        'Consider a different case or constraint.',
        'Explain the evidence behind your decision.',
      ],
    };
    custom.advancedPrompt = custom.prompts[0];
    if (!custom.title || !custom.objective || !model.validActivity(custom)) {
      announce('Complete the activity fields before saving.');
      return;
    }
    state.custom[selected] = custom;
    save();
    $('#iv-settings-dialog').close();
    renderHome();
    announce(
      pending()
        ? 'Activity saved for new sessions. Your current session keeps its original questions.'
        : 'Activity draft saved on this device.'
    );
  });
  $('#iv-config-criteria').addEventListener('input', () =>
    $('#iv-config-criteria').setCustomValidity('')
  );

  const profile = app.read('profile', {});
  $('#iv-level').value = ['student', 'graduate'].includes(profile.background)
    ? 'independent'
    : 'guided';
  renderHome();
})();
