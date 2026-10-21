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
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
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
    const migrated = (old.references || []).filter((ref) => safeId(ref.id)).map((ref, index) => ({
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
  function saveLocal(data) { window.SkillLoop.write('knowledgeV2', data); }
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
      host.classList.add('kn-canvas');
      host.innerHTML = '<div class="kn-stage"><svg class="kn-lines" aria-hidden="true"></svg><div class="kn-nodes"></div></div>';
      this.stage = host.querySelector('.kn-stage');
      this.svg = host.querySelector('.kn-lines');
      this.nodeLayer = host.querySelector('.kn-nodes');
      host.addEventListener('wheel', (event) => { event.preventDefault(); this.zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
      host.addEventListener('pointerdown', (event) => {
        if (event.target.closest('.kn-node')) return;
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
      const finish = () => { if (this.drag?.kind === 'node') this.options.onMove?.(this.drag.item); this.drag = null; };
      host.addEventListener('pointerup', finish);
      host.addEventListener('pointercancel', finish);
    }
    zoom(factor) {
      this.scale = Math.max(0.35, Math.min(2.4, this.scale * factor));
      this.transform();
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
      this.buttons.forEach((button, key) => button.setAttribute('aria-pressed', String(key === id)));
      this.options.onSelect?.(id);
    }
    set(items, edges) {
      this.items = items.map((item, index) => Object.assign(item, position(item, index)));
      this.edges = edges;
      this.buttons.clear();
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
    }
    place(item) {
      const button = this.buttons.get(item.id);
      if (button) button.style.transform = `translate(${item.x}px, ${item.y}px)`;
    }
    lines() {
      const positions = new Map(this.items.map((item) => [item.id, item]));
      const fragment = document.createDocumentFragment();
      for (const edge of this.edges) {
        const from = positions.get(edge.source), to = positions.get(edge.target);
        if (!from || !to) continue;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x + 90); line.setAttribute('y1', from.y + 26);
        line.setAttribute('x2', to.x + 90); line.setAttribute('y2', to.y + 26);
        line.setAttribute('class', edge.kind === 'personal' ? 'kn-personal-line' : 'kn-teacher-line');
        fragment.append(line);
      }
      this.svg.replaceChildren(fragment);
    }
  }
  window.KnowledgeNetwork = { $, make, api, href, graphId, sampleId, safeId, loadGraph, local, saveLocal,
    referenceNode, Canvas, legacy };
})();
