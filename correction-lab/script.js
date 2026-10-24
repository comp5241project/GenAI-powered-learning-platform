/** Module 4: authored correction cases with reference explanations and self-checks, not an AI grader. */
(function () {
  const app = window.SkillLoop;
  const cases = window.SkillLoopCases;
  const $ = (selector) => document.querySelector(selector);
  const text = (value) => (typeof value === 'string' ? value.slice(0, 5000) : '');
  const saved = app.read('correction', {});

  // Per-case progress. Older saves only had the top-level fields for one case.
  const progress = {};
  const stored = saved.cases && typeof saved.cases === 'object' ? { ...saved.cases } : {};
  if (!saved.cases && (saved.draft || saved.revealed)) {
    stored[saved.caseId || cases[0].id] = saved;
  }
  cases.forEach((item) => {
    const entry = stored[item.id] && typeof stored[item.id] === 'object' ? stored[item.id] : {};
    progress[item.id] = {
      draft: text(entry.draft),
      followUp: text(entry.followUp),
      revealed: entry.revealed === true,
      nextSeen: entry.nextSeen === true,
      checks: Array.isArray(entry.checks)
        ? entry.checks.filter((n) => Number.isInteger(n) && n >= 0 && n < item.criteria.length)
        : [],
    };
  });

  const requested = new URLSearchParams(location.search).get('case');
  const find = (id) => cases.findIndex((item) => item.id === id);
  let current = Math.max(0, find(requested) >= 0 ? find(requested) : find(saved.caseId));

  const input = $('#sl-correction');
  const followUp = $('#sl-followup');
  input.maxLength = 5000;
  followUp.maxLength = 5000;

  const state = () => progress[cases[current].id];
  function save() {
    const item = state();
    // Top-level fields mirror the open case so the original contract still reads correctly.
    app.write('correction', {
      draft: item.draft,
      revealed: item.revealed,
      nextSeen: item.nextSeen,
      caseId: cases[current].id,
      cases: progress,
    });
  }
  function status(id) {
    const item = progress[id];
    if (item.followUp.trim()) return 'Practised';
    if (item.revealed) return 'Reviewed';
    if (item.draft.trim()) return 'Draft';
    return 'New';
  }

  function renderList() {
    const list = $('#sl-case-list');
    list.replaceChildren();
    const groups = {};
    cases.forEach((item, index) => {
      if (!groups[item.topic]) {
        const heading = document.createElement('h3');
        heading.className = 'cl-topic';
        heading.textContent = item.topic;
        groups[item.topic] = document.createElement('div');
        groups[item.topic].className = 'cl-cases';
        groups[item.topic].setAttribute('role', 'group');
        groups[item.topic].setAttribute('aria-label', item.topic);
        list.append(heading, groups[item.topic]);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sl-btn cl-case';
      button.setAttribute('aria-pressed', String(index === current));
      const name = document.createElement('span');
      name.textContent = item.name;
      const label = document.createElement('span');
      label.className = 'sl-small';
      label.textContent = `${item.kind} · ${status(item.id)}`;
      button.append(name, label);
      button.addEventListener('click', () => open(index));
      groups[item.topic].append(button);
    });
    const reviewed = cases.filter((item) => progress[item.id].revealed).length;
    $('#sl-progress').textContent = `${reviewed} of ${cases.length} reviewed`;
  }

  function renderCase() {
    const item = cases[current];
    const entry = state();
    $('#sl-case-title').textContent = item.title;
    $('#sl-case-kind').textContent = item.kind;
    $('#sl-case-fluency').textContent = `AI Fluency: ${item.fluency}`;
    $('#sl-case-fluency').hidden = !item.fluency;
    $('#sl-case-code').textContent = item.code;
    $('#sl-case-code').classList.toggle('cl-text', item.format === 'text');
    input.placeholder = item.prompt;
    input.value = entry.draft;
    input.setCustomValidity('');
    $('#sl-ref-title').textContent = item.reference.title;
    $('#sl-ref-text').textContent = item.reference.text;
    $('#sl-ref-label').textContent = `${item.reference.label || 'Evidence'}:`;
    $('#sl-ref-evidence').textContent = item.reference.evidence;
    $('#sl-ref-evidence').parentElement.classList.toggle('cl-text', item.format === 'text');
    $('#sl-lesson-link').href = `../knowledge-map/?topic=${item.conceptId}`;
    $('#sl-followup-prompt').textContent = item.followUp;
    followUp.value = entry.followUp;

    const criteria = $('#sl-criteria');
    criteria.replaceChildren();
    item.criteria.forEach((criterion, index) => {
      const label = document.createElement('label');
      label.className = 'cl-check';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = entry.checks.includes(index);
      box.addEventListener('change', () => {
        entry.checks = box.checked
          ? [...entry.checks, index].sort()
          : entry.checks.filter((n) => n !== index);
        save();
      });
      const span = document.createElement('span');
      span.textContent = criterion;
      label.append(box, span);
      criteria.append(label);
    });

    $('#sl-correction-result').hidden = !entry.revealed;
    $('#sl-next-question').hidden = !entry.nextSeen;
    renderList();
  }

  function open(index) {
    current = index;
    const url = new URL(location.href);
    url.searchParams.set('case', cases[current].id);
    history.replaceState(null, '', url);
    save();
    renderCase();
  }

  input.addEventListener('input', () => {
    input.setCustomValidity('');
    state().draft = input.value;
    save();
    renderList();
  });
  followUp.addEventListener('input', () => {
    state().followUp = followUp.value;
    save();
    renderList();
  });
  $('#sl-check').addEventListener('click', () => {
    if (!input.value.trim()) {
      input.setCustomValidity('Describe the problem first.');
      input.reportValidity();
      return;
    }
    input.setCustomValidity('');
    state().revealed = true;
    save();
    renderCase();
    $('#sl-ref-title').focus();
    app.appendEvent({
      module: 'correction-lab',
      type: 'reference-opened',
      conceptId: cases[current].conceptId,
      caseId: cases[current].id,
    });
  });
  $('#sl-next').addEventListener('click', () => {
    state().nextSeen = true;
    save();
    renderCase();
    followUp.focus();
  });
  $('#sl-next-case').addEventListener('click', () => {
    open((current + 1) % cases.length);
    $('#sl-case-title').scrollIntoView({ block: 'center' });
  });
  $('#sl-reset').addEventListener('click', () => {
    if (!confirm('Clear your answers for this case?')) return;
    progress[cases[current].id] = {
      draft: '',
      followUp: '',
      revealed: false,
      nextSeen: false,
      checks: [],
    };
    save();
    renderCase();
  });

  $('#sl-ref-title').tabIndex = -1;
  renderCase();
})();
