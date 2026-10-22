(function (root) {
  const slug = /^[a-z][a-z0-9-]{0,63}$/;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const version = /^[a-zA-Z0-9.-]{1,40}$/;
  const coordinate = (value) => value == null || (Number.isInteger(value) && Math.abs(value) <= 100000);

  function inspect(data, remote = { nodes: [], edges: [] }) {
    const issues = [];
    const nodes = Array.isArray(data.nodes) ? data.nodes : [];
    const edges = Array.isArray(data.edges) ? data.edges : [];
    if (nodes.length > 500 || edges.length > 2000)
      issues.push('Import exceeds the service limit of 500 nodes or 2,000 connections.');
    const nodeIds = new Set((remote?.nodes || []).map((node) => node.id));
    const localNodeIds = new Set();
    let invalidNodes = 0;
    for (const node of nodes) {
      const valid = node && coordinate(node.x) && coordinate(node.y) &&
        (node.kind === 'reference'
          ? slug.test(node.graphId || '') && slug.test(node.conceptId || '') &&
            node.id === `${node.graphId}:${node.conceptId}` &&
            (node.sourceVersion == null || node.sourceVersion === 'unknown' || version.test(node.sourceVersion)) &&
            (node.note == null || typeof node.note === 'string' && node.note.length <= 1000)
          : node.kind === 'note' && typeof node.id === 'string' && node.id.startsWith('note:') &&
            uuid.test(node.id.slice(5)) && typeof node.title === 'string' && !!node.title.trim() &&
            (node.body == null || typeof node.body === 'string' && node.body.length <= 1000));
      if (!valid) invalidNodes += 1;
      if (typeof node?.id === 'string') localNodeIds.add(node.id);
    }
    if (invalidNodes) issues.push(`${invalidNodes} browser nodes have an invalid ID, type, version, text length or position.`);
    const availableIds = new Set([...nodeIds, ...localNodeIds]);
    let invalidEdges = 0;
    for (const edge of edges) {
      if (!edge || typeof edge.id !== 'string' || !uuid.test(edge.id) ||
          (remote && (!availableIds.has(edge.source) || !availableIds.has(edge.target))) || edge.source === edge.target ||
          typeof edge.reason !== 'string' || !edge.reason.trim() || edge.reason.length > 280) invalidEdges += 1;
    }
    if (invalidEdges) issues.push(`${invalidEdges} browser connections have an invalid ID, endpoint or reason.`);
    const remoteEdgeIds = new Set((remote?.edges || []).map((edge) => edge.id));
    const duplicates = nodes.filter((node) => nodeIds.has(node.id)).length +
      edges.filter((edge) => remoteEdgeIds.has(edge.id)).length;
    return { issues, duplicates, valid: !issues.length };
  }

  root.SkillLoopImportPreflight = Object.freeze({ inspect });
})(globalThis);
