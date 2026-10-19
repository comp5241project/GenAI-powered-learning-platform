/** Browser-local state only. There is no account, database or AI API in this starter. */
(function () {
  const prefix = 'skillloop.v1.';
  const memory = new Map();
  const clone = (value) => JSON.parse(JSON.stringify(value));
  function read(key, fallback) {
    try {
      const value = localStorage.getItem(prefix + key);
      if (value === null) return clone(fallback);
      const parsed = JSON.parse(value);
      const matches = Array.isArray(fallback)
        ? Array.isArray(parsed)
        : fallback !== null && typeof fallback === 'object'
          ? parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
          : typeof parsed === typeof fallback;
      return matches ? parsed : clone(fallback);
    } catch (_) {
      return memory.has(key) ? clone(memory.get(key)) : clone(fallback);
    }
  }
  function write(key, value) {
    memory.set(key, clone(value));
    try {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    } catch (_) {
      /* Still works for this page if storage is unavailable. */
    }
  }
  function appendEvent(event) {
    const saved = read('activity', []);
    const list = Array.isArray(saved) ? saved : [];
    write('activity', [...list, { ...event, at: new Date().toISOString() }].slice(-100));
  }
  function icons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
  }
  window.SkillLoop = Object.freeze({ read, write, appendEvent, icons });
})();
