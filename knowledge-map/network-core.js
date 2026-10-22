/* Shared public graph loader, personal-store adapter and scalable canvas. */
(function () {
  const sampleId = 'software-development';
  const $ = (selector) => document.querySelector(selector);
  const params = new URLSearchParams(location.search);
  const graphId = params.get('graph') || sampleId;
  const safeId = (value) => /^[a-z][a-z0-9-]{0,63}$/.test(value || '');
  const make = (tag, className, text) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  };
  function href(page, extra = {}) {
    const query = new URLSearchParams({ graph: graphId,
      ...(params.get('version') ? { version: params.get('version') } : {}),
      ...(params.get('draftPreview') === '1' ? { draftPreview: '1' } : {}), ...extra });
    return `/knowledge-map/${page}.html?${query}`;
  }
  async function api(op, method = 'GET', body, extra = {}) {
    const query = new URLSearchParams({ op, ...extra });
    const response = await fetch(`/api/knowledge?${query}`, {
      method, credentials: 'same-origin',
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    });
    let data;
    try { data = await response.json(); }
    catch { throw new Error('Knowledge backend is unavailable.'); }
    if (!response.ok) {
      const error = new Error(data.error || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }
  async function loadGraph() {
    if (!safeId(graphId)) throw new Error('Invalid graph link.');
    if (params.get('draftPreview') === '1') {
      const raw = sessionStorage.getItem('skillloop.knowledge.preview');
      const preview = raw && JSON.parse(raw);
      if (!preview || preview.publication?.id !== graphId) throw new Error('Preview is unavailable in this tab.');
      return { graph: preview, preview: true };
    }
    try {
      const response = await api('public', 'GET', undefined, {
        graph: graphId, ...(params.get('version') ? { version: params.get('version') } : {}),
      });
      return { graph: response.graph, preview: false };
    } catch (error) {
      if (graphId === sampleId && window.SkillLoopGraph &&
          (!params.has('version') || params.get('version') === window.SkillLoopGraph.publication.version) &&
          /configured|unavailable|published graph|Failed to fetch|404/i.test(error.message))
        return { graph: window.SkillLoopGraph, preview: false, sample: true };
      throw error;
    }
  }
  const legacy = () => window.SkillLoop.read('knowledge', { selected: null, completed: [], references: [] });
  function local() {
    const old = legacy();
    const references = Array.isArray(old.references) ? old.references : [];
    const migrated = references.filter((ref) => ref && safeId(ref.id)).map((ref, index) => ({
      id: `${sampleId}:${ref.id}`, kind: 'reference', graphId: sampleId, conceptId: ref.id,
      sourceVersion: ref.version || 'unknown', titleSnapshot: ref.title || ref.id,
      descriptionSnapshot: ref.description || '', note: ref.note || '',
      x: 90 + index % 4 * 220, y: 80 + Math.floor(index / 4) * 130,
    }));
    const data = window.SkillLoop.read('knowledgeV2', { nodes: migrated, edges: [] });
    data.nodes = Array.isArray(data.nodes) ? data.nodes : [];
    data.edges = Array.isArray(data.edges) ? data.edges : [];
    return data;
  }
  function saveLocal(data) { return window.SkillLoop.write('knowledgeV2', data); }
  function referenceNode(graph, topic, data) {
    const id = `${graph.publication.id}:${topic.id}`;
    if (data.nodes.some((node) => node.id === id)) return false;
    data.nodes.push({ id, kind: 'reference', graphId: graph.publication.id, conceptId: topic.id,
      sourceVersion: graph.publication.version, titleSnapshot: topic.title,
      descriptionSnapshot: topic.description, note: '', x: 80 + data.nodes.length % 4 * 220,
      y: 80 + Math.floor(data.nodes.length / 4) * 130 });
    saveLocal(data);
    return true;
  }
  function position(item, index) {
    if (Number.isFinite(item.x) && Number.isFinite(item.y)) return { x: item.x, y: item.y };
    if (Number.isFinite(item.position?.x) && Number.isFinite(item.position?.y)) return item.position;
    if (Number.isInteger(item.position?.column) && Number.isInteger(item.position?.row))
      return { x: 80 + (item.position.column - 1) * 230, y: 70 + (item.position.row - 1) * 135 };
    return { x: 80 + index % 12 * 220, y: 70 + Math.floor(index / 12) * 135 };
  }
  class Canvas {
    constructor(host, options = {}) {
      this.host = host;
      this.options = options;
      this.scale = 1;
      this.tx = 0;
      this.ty = 0;
      this.items = [];
      this.edges = [];
      this.buttons = new Map();
      this.edgeLines = new Map();
      this.selection = null;
      this.search = '';
      host.classList.add('kn-canvas');
      host.innerHTML = '<div class="kn-stage"><svg class="kn-lines" aria-hidden="true"></svg><div class="kn-edge-targets"></div><div class="kn-nodes"></div></div>';
      this.stage = host.querySelector('.kn-stage');
      this.svg = host.querySelector('.kn-lines');
      this.edgeLayer = host.querySelector('.kn-edge-targets');
      this.nodeLayer = host.querySelector('.kn-nodes');
      host.addEventListener('wheel', (event) => { event.preventDefault(); this.zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
      host.addEventListener('pointerdown', (event) => {
        if (event.target.closest('.kn-node, .kn-edge-target')) return;
        this.drag = { kind: 'pan', x: event.clientX, y: event.clientY, tx: this.tx, ty: this.ty };
        host.setPointerCapture(event.pointerId);
      });
      host.addEventListener('pointermove', (event) => {
        if (!this.drag) return;
        if (this.drag.kind === 'pan') {
          this.tx = this.drag.tx + event.clientX - this.drag.x;
          this.ty = this.drag.ty + event.clientY - this.drag.y;
          this.transform();
        } else {
          const item = this.drag.item;
          item.x = Math.round(this.drag.x0 + (event.clientX - this.drag.x) / this.scale);
          item.y = Math.round(this.drag.y0 + (event.clientY - this.drag.y) / this.scale);
          this.place(item);
          this.lines();
        }
      });
      const finish = () => {
        if (this.drag?.kind === 'node') this.options.onMove?.(this.drag.item, { x: this.drag.x0, y: this.drag.y0 });
        this.drag = null;
      };
      host.addEventListener('pointerup', finish);
      host.addEventListener('pointercancel', finish);
    }
    zoom(factor) {
      this.scale = Math.max(0.35, Math.min(2.4, this.scale * factor));
      this.transform();
    }
    resetView() { this.scale = 1; this.tx = 0; this.ty = 0; this.transform(); }
    highlight(query) {
      this.search = query.trim().toLowerCase();
      this.buttons.forEach((button, id) => {
        const item = this.items.find((entry) => entry.id === id);
        const matches = !this.search || `${item.title || item.titleSnapshot || ''} ${item.description || item.body || item.note || ''}`.toLowerCase().includes(this.search);
        button.classList.toggle('kn-search-muted', !matches);
        button.classList.toggle('kn-search-match', !!this.search && matches);
      });
    }
    transform() { this.stage.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`; }
    focus(id) {
      const item = this.items.find((entry) => entry.id === id);
      if (!item) return;
      this.tx = this.host.clientWidth / 2 - (item.x + 90) * this.scale;
      this.ty = this.host.clientHeight / 2 - (item.y + 30) * this.scale;
      this.transform();
      const button = this.buttons.get(id);
      button?.focus({ preventScroll: true });
      this.select(id);
    }
    select(id) {
      this.selection = { kind: 'node', id };
      this.buttons.forEach((button, key) => button.setAttribute('aria-pressed', String(key === id)));
      this.edgeLines.forEach((line) => line.classList.remove('kn-edge-selected'));
      this.options.onSelect?.(id);
    }
    selectEdge(id) {
      const edge = this.edges.find((item) => item.id === id);
      if (!edge) return;
      this.selection = { kind: 'relationship', id };
      this.buttons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
      this.edgeLines.forEach((line, key) => line.classList.toggle('kn-edge-selected', key === id));
      this.options.onSelectEdge?.(edge);
    }
    set(items, edges) {
      this.items = items.map((item, index) => ({ ...item, ...position(item, index) }));
      this.edges = edges;
      this.buttons.clear();
      this.edgeLines.clear();
      this.nodeLayer.replaceChildren();
      const fragment = document.createDocumentFragment();
      for (const item of this.items) {
        const button = make('button', 'kn-node', item.title || item.titleSnapshot || item.id);
        button.type = 'button';
        button.setAttribute('aria-label', button.textContent);
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => this.select(item.id));
        if (this.options.editable) button.addEventListener('pointerdown', (event) => {
          if (event.button !== 0) return;
          this.drag = { kind: 'node', item, x: event.clientX, y: event.clientY, x0: item.x, y0: item.y };
          this.host.setPointerCapture(event.pointerId);
          event.stopPropagation();
        });
        fragment.append(button);
        this.buttons.set(item.id, button);
        this.place(item);
      }
      this.nodeLayer.append(fragment);
      this.lines();
      this.transform();
      this.highlight(this.search);
      if (this.selection?.kind === 'relationship' && !this.edges.some((edge) => edge.id === this.selection.id)) this.selection = null;
      if (this.selection?.kind === 'node' && !this.buttons.has(this.selection.id)) this.selection = null;
      this.buttons.forEach((button, key) => button.setAttribute('aria-pressed', String(this.selection?.kind === 'node' && key === this.selection.id)));
    }
    place(item) {
      const button = this.buttons.get(item.id);
      if (button) button.style.transform = `translate(${item.x}px, ${item.y}px)`;
    }
    lines() {
      const positions = new Map(this.items.map((item) => [item.id, item]));
      this.svg.setAttribute('width', String(Math.max(1, ...this.items.map((item) => item.x + 220))));
      this.svg.setAttribute('height', String(Math.max(1, ...this.items.map((item) => item.y + 100))));
      const fragment = document.createDocumentFragment();
      const targets = document.createDocumentFragment();
      for (const edge of this.edges) {
        const from = positions.get(edge.source), to = positions.get(edge.target);
        if (!from || !to) continue;
        const x1 = from.x + 90, y1 = from.y + 26, x2 = to.x + 90, y2 = to.y + 26;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1); line.setAttribute('y1', y1);
        line.setAttribute('x2', x2); line.setAttribute('y2', y2);
        line.setAttribute('class', edge.kind === 'personal' ? 'kn-personal-line' : 'kn-teacher-line');
        const target = make('button', 'kn-edge-target');
        target.type = 'button';
        target.setAttribute('aria-label', `Relationship: ${from.title || from.titleSnapshot || from.id} to ${to.title || to.titleSnapshot || to.id}`);
        target.style.left = `${x1}px`;
        target.style.top = `${y1 - 9}px`;
        target.style.width = `${Math.hypot(x2 - x1, y2 - y1)}px`;
        target.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
        target.addEventListener('click', (event) => { event.stopPropagation(); this.selectEdge(edge.id); });
        if (this.selection?.kind === 'relationship' && this.selection.id === edge.id) line.classList.add('kn-edge-selected');
        fragment.append(line);
        targets.append(target);
        this.edgeLines.set(edge.id, line);
      }
      this.svg.replaceChildren(fragment);
      this.edgeLayer.replaceChildren(targets);
    }
  }
  window.KnowledgeNetwork = { $, make, api, href, graphId, sampleId, safeId, loadGraph, local, saveLocal,
    referenceNode, Canvas, legacy };
})();
