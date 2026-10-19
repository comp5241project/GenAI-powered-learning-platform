/** Module 3: a scripted question, follow-up and editable process history. */
(function () {
  const app = window.SkillLoop;
  const $ = (selector) => document.querySelector(selector);
  const saved = app.read('interview', {});
  let events = Array.isArray(saved.events)
    ? saved.events
        .filter((item) => item && typeof item.label === 'string' && typeof item.detail === 'string')
        .slice(-40)
    : [];
  let hintUsed = saved.hintUsed === true;
  let draft = typeof saved.draft === 'string' ? saved.draft.slice(0, 5000) : '';
  let hasAnswer = saved.hasAnswer === true;
  $('#sl-answer').maxLength = 5000;
  $('#sl-answer').value = draft;

  function save() {
    app.write('interview', { draft, events, hintUsed, hasAnswer });
  }
  function renderReplay() {
    const replay = $('#sl-replay');
    replay.replaceChildren();
    const rows = [
      { label: 'Read the question', detail: 'How would you check AI-generated code?' },
      ...events,
    ];
    rows.forEach((event, index) => {
      const row = document.createElement('div');
      row.className = 'sl-step';
      const number = document.createElement('span');
      number.className = 'sl-dot';
      number.textContent = String(index + 1).padStart(2, '0');
      const content = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = event.label;
      const detail = document.createElement('div');
      detail.className = 'sl-small';
      detail.textContent = event.detail;
      content.append(title, detail);
      row.append(number, content);
      replay.append(row);
    });
    $('#sl-hint-text').hidden = !hintUsed;
    $('#sl-followup').hidden = !hasAnswer;
  }
  $('#sl-answer').addEventListener('input', () => {
    $('#sl-answer').setCustomValidity('');
    draft = $('#sl-answer').value;
    save();
  });
  $('#sl-hint').addEventListener('click', () => {
    if (!hintUsed) {
      hintUsed = true;
      events.push({ label: 'Used a hint', detail: 'Consider an empty input.' });
      save();
      renderReplay();
    }
  });
  $('#sl-submit').addEventListener('click', () => {
    const answer = $('#sl-answer');
    if (!answer.value.trim()) {
      answer.setCustomValidity('Write your approach first.');
      answer.reportValidity();
      return;
    }
    answer.setCustomValidity('');
    draft = answer.value.trim();
    events.push({ label: hasAnswer ? 'Revised the answer' : 'Saved an answer', detail: draft });
    if (!hasAnswer)
      events.push({
        label: 'Received a scripted follow-up',
        detail: 'What would you expect for an empty list, and how would you test it?',
      });
    events = events.slice(-40);
    hasAnswer = true;
    save();
    renderReplay();
    app.appendEvent({ module: 'interview', type: 'answer-saved', conceptId: 'software-testing' });
  });
  renderReplay();
})();
