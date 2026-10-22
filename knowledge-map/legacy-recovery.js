(function (root) {
  const slug = /^[a-z][a-z0-9-]{0,63}$/;
  function find(legacy, current, graphId) {
    const ids = new Set((current?.nodes || []).map((node) => node.id));
    return (Array.isArray(legacy?.references) ? legacy.references : [])
      .filter((ref) => ref && typeof ref.id === 'string' && slug.test(ref.id) && !ids.has(`${graphId}:${ref.id}`))
      .map((ref) => ({ id: ref.id, title: ref.title || ref.id,
        description: ref.description || '', note: ref.note || '', version: ref.version || null }));
  }
  function restore(current, record, graphId) {
    if (!current || !Array.isArray(current.nodes) || !record ||
        typeof record.id !== 'string' || !slug.test(record.id) ||
        typeof graphId !== 'string' || !slug.test(graphId)) return false;
    const id = `${graphId}:${record.id}`;
    if (current.nodes.some((node) => node.id === id)) return false;
    const index = current.nodes.length;
    current.nodes.push({ id, kind: 'reference', graphId, conceptId: record.id,
      sourceVersion: record.version || 'unknown', titleSnapshot: record.title || record.id,
      descriptionSnapshot: record.description || '', note: record.note || '',
      x: 80 + index % 4 * 220, y: 80 + Math.floor(index / 4) * 130 });
    return true;
  }
  root.SkillLoopLegacyRecovery = Object.freeze({ find, restore });
})(globalThis);
