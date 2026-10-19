/** Module 2: a small rules-based assessment, not an AI-generated recommendation. */
(function () {
  const app = window.SkillLoop;
  const $ = (selector) => document.querySelector(selector);
  const saved = app.read('profile', {});
  const backgrounds = ['beginner', 'student', 'graduate'];
  const goals = ['internship', 'build'];
  if (backgrounds.includes(saved.background)) $('#sl-background').value = saved.background;
  if (goals.includes(saved.goal)) $('#sl-goal').value = saved.goal;
  let diagnostic = ['yes', 'no'].includes(saved.diagnostic) ? saved.diagnostic : '';

  function plan() {
    const level = $('#sl-background').value;
    const building = $('#sl-goal').value === 'build';
    let steps =
      level === 'beginner'
        ? [
            ['foundations', 'Development foundations'],
            ['code-reading', 'Code reading & testing'],
            ['ai-code-review', 'AI-assisted development'],
          ]
        : level === 'student'
          ? [
              ['software-testing', 'Testing & edge cases'],
              ['ai-code-review', 'AI code review'],
              ['communication', 'Technical interview preparation'],
            ]
          : [
              ['software-testing', 'Test design & code review'],
              ['requirements', 'Requirements & trade-offs'],
              ['communication', 'Interview preparation'],
            ];
    if (building)
      steps =
        level === 'beginner'
          ? [
              ['requirements', 'Describe a small app'],
              ['foundations', 'Build with AI guidance'],
              ['ai-code-review', 'Review & test the result'],
            ]
          : [
              ['requirements', 'Write acceptance criteria'],
              ['ai-code-review', 'Review AI-generated code'],
              ['software-testing', 'Test & improve your app'],
            ];
    if (diagnostic === 'yes')
      steps = [['software-testing', 'Running vs. being correct'], ...steps.slice(0, 2)];
    return steps;
  }

  function render() {
    $('#sl-path-list').replaceChildren();
    plan().forEach(([id, title], index) => {
      const row = document.createElement('div');
      row.className = 'sl-step';
      const number = document.createElement('span');
      number.className = 'sl-dot';
      number.textContent = String(index + 1).padStart(2, '0');
      const link = document.createElement('a');
      link.href = `../knowledge-map/?topic=${encodeURIComponent(id)}`;
      link.textContent = title;
      row.append(number, link);
      $('#sl-path-list').append(row);
    });
    document.querySelectorAll('[data-diagnostic]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.diagnostic === diagnostic));
    });
    $('#sl-diagnostic-result').textContent =
      diagnostic === 'no'
        ? 'Exactly. Results and edge cases still need checks.'
        : diagnostic === 'yes'
          ? 'Running is only the first check. Start with output validation.'
          : 'Choose an answer to refine your path.';
    $('#sl-path-title').textContent =
      diagnostic === 'yes'
        ? 'A foundation check was added to your sample path.'
        : 'Rules-based sample path. You can change the starting point.';
  }

  function save() {
    app.write('profile', {
      background: $('#sl-background').value,
      goal: $('#sl-goal').value,
      diagnostic,
    });
  }
  $('#sl-background').addEventListener('change', () => {
    save();
    render();
  });
  $('#sl-goal').addEventListener('change', () => {
    save();
    render();
  });
  document.querySelectorAll('[data-diagnostic]').forEach((button) => {
    button.addEventListener('click', () => {
      diagnostic = button.dataset.diagnostic;
      save();
      render();
    });
  });
  $('#sl-make-path').addEventListener('click', () => {
    save();
    render();
    app.appendEvent({
      module: 'learning-path',
      type: 'path-created',
      conceptIds: plan().map((step) => step[0]),
    });
    $('#sl-path-title').textContent = 'Your sample path is saved in this browser.';
  });
  render();
})();
