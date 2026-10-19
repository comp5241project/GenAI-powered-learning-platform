/** Module 4: an authored error example and reference explanation, not an AI grader. */
(function () {
  const app = window.SkillLoop;
  const $ = (selector) => document.querySelector(selector);
  const saved = app.read('correction', {});
  let revealed = saved.revealed === true;
  let nextSeen = saved.nextSeen === true;
  const input = $('#sl-correction');
  input.maxLength = 5000;
  input.value = typeof saved.draft === 'string' ? saved.draft.slice(0, 5000) : '';

  function save() {
    app.write('correction', {
      draft: input.value,
      revealed,
      nextSeen,
      caseId: 'average-empty-list',
    });
  }
  input.addEventListener('input', () => {
    input.setCustomValidity('');
    save();
  });
  $('#sl-check').addEventListener('click', () => {
    if (!input.value.trim()) {
      input.setCustomValidity('Try a counterexample first.');
      input.reportValidity();
      return;
    }
    input.setCustomValidity('');
    revealed = true;
    $('#sl-correction-result').hidden = false;
    save();
    app.appendEvent({
      module: 'correction-lab',
      type: 'reference-opened',
      conceptId: 'software-testing',
      caseId: 'average-empty-list',
    });
  });
  $('#sl-next').addEventListener('click', () => {
    nextSeen = true;
    $('#sl-next-question').hidden = false;
    save();
  });
  $('#sl-correction-result').hidden = !revealed;
  $('#sl-next-question').hidden = !nextSeen;
})();
