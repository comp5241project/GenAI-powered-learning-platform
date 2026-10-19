/** Module 1: selection, mini-lessons and local study records. */
(function () {
  const app = window.SkillLoop;
  const topics = window.SkillLoopTopics;
  const $ = selector => document.querySelector(selector);
  const saved = app.read('knowledge', {});
  const completed = new Set(Array.isArray(saved.completed) ? saved.completed.filter(id => topics.some(t => t.id === id)) : []);
  const requested = new URLSearchParams(location.search).get('topic');
  const initial = requested || saved.selected || 'software-testing';
  let selected = topics.findIndex(topic => topic.id === initial);
  if (selected < 0) selected = 3;

  const mark = document.createElement('button');
  mark.type = 'button';
  mark.className = 'sl-btn';
  mark.style.marginTop = '12px';
  mark.style.marginRight = '10px';
  $('#sl-lesson-body').insertBefore(mark, $('#sl-lesson-body').querySelector('a'));

  function persist() {
    app.write('knowledge', { selected: topics[selected].id, completed: [...completed] });
  }

  function render() {
    const topic = topics[selected];
    document.querySelectorAll('.sl-node').forEach((node, index) => {
      const studied = completed.has(topics[index].id);
      node.setAttribute('aria-pressed', String(index === selected));
      node.dataset.status = studied ? 'done' : 'new';
      node.querySelector('.sl-node-state').textContent = studied ? 'Studied' : index === 3 ? 'Suggested next' : 'Not started';
    });
    $('#sl-node-title').textContent = topic.title;
    $('#sl-node-desc').textContent = topic.description;
    $('#sl-lesson-text').textContent = topic.lesson;
    mark.textContent = completed.has(topic.id) ? 'Studied in this browser' : 'Mark as studied';
    mark.disabled = completed.has(topic.id);
    const icon = document.createElement('i');
    icon.id = 'sl-detail-icon';
    icon.dataset.lucide = topic.icon;
    icon.setAttribute('aria-hidden', 'true');
    $('#sl-detail-icon').replaceWith(icon);
    app.icons();
  }

  document.querySelectorAll('.sl-node').forEach((node, index) => {
    node.addEventListener('click', () => {
      selected = index;
      $('#sl-lesson-body').hidden = true;
      render();
      persist();
    });
  });
  $('#sl-lesson').addEventListener('click', () => {
    const body = $('#sl-lesson-body');
    body.hidden = !body.hidden;
    $('#sl-lesson').setAttribute('aria-expanded', String(!body.hidden));
  });
  mark.addEventListener('click', () => {
    completed.add(topics[selected].id);
    persist();
    app.appendEvent({ module: 'knowledge-map', type: 'lesson-studied', conceptId: topics[selected].id });
    render();
  });

  function drawConnections() {
    const graph = $('.sl-graph');
    const svg = graph.querySelector('svg');
    const box = graph.getBoundingClientRect();
    if (!box.width) return;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.replaceChildren();
    const edges = [[0, 1], [0, 2], [0, 3], [1, 4], [2, 5], [3, 5], [3, 6]];
    edges.forEach(([from, to]) => {
      const a = $(`#sl-n${from}`).getBoundingClientRect();
      const b = $(`#sl-n${to}`).getBoundingClientRect();
      const x1 = a.right - box.left;
      const y1 = a.top + a.height / 2 - box.top;
      const x2 = b.left - box.left;
      const y2 = b.top + b.height / 2 - box.top;
      const middle = (x1 + x2) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1},${y1} H${middle} V${y2} H${x2}`);
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '1.25');
      path.setAttribute('fill', 'none');
      svg.append(path);
    });
  }
  render();
  $('#sl-lesson').setAttribute('aria-expanded', 'false');
  new ResizeObserver(drawConnections).observe($('.sl-graph'));
  requestAnimationFrame(drawConnections);
})();
