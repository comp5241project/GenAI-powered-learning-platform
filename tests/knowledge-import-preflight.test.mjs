import test from 'node:test';
import assert from 'node:assert/strict';

await import('../knowledge-map/import-preflight.js');
const inspect = globalThis.SkillLoopImportPreflight.inspect;
const ref = { id: 'software-development:foundations', kind: 'reference',
  graphId: 'software-development', conceptId: 'foundations', sourceVersion: '2026-10-21.1' };
const note = { id: 'note:11111111-1111-4111-8111-111111111111', kind: 'note', title: 'Personal note' };
const edge = { id: '22222222-2222-4222-8222-222222222222', source: ref.id, target: note.id,
  reason: 'This note builds on the reference.' };

test('import preflight accepts V2 references, notes and links without mutating them', () => {
  const data = { nodes: [ref, note], edges: [edge] };
  const original = structuredClone(data);
  assert.deepEqual(inspect(data), { issues: [], duplicates: 0, valid: true });
  assert.deepEqual(data, original);
});

test('import preflight reports account duplicates without treating them as invalid', () => {
  const report = inspect({ nodes: [ref, note], edges: [edge] }, { nodes: [ref], edges: [edge] });
  assert.equal(report.duplicates, 2);
  assert.equal(report.valid, true);
});

test('import preflight leaves remote-only endpoint checks open when account read fails', () => {
  const report = inspect({ nodes: [note], edges: [{ ...edge, source: 'remote-graph:remote-concept' }] }, null);
  assert.equal(report.valid, true);
  assert.equal(report.duplicates, 0);
});

test('import preflight blocks malformed nodes, disconnected links and oversized batches', () => {
  const report = inspect({ nodes: [{ ...ref, id: 'wrong-key' }, note],
    edges: [{ ...edge, target: 'missing' }] });
  assert.equal(report.valid, false);
  assert.equal(report.issues.length, 2);
  const oversized = inspect({ nodes: Array.from({ length: 501 }, () => note), edges: [] });
  assert.equal(oversized.valid, false);
  assert.match(oversized.issues[0], /500 nodes/);
  assert.equal(inspect({ nodes: [{ ...note, body: 'x'.repeat(1001) }], edges: [] }).valid, false);
  assert.equal(inspect({ nodes: [{ ...ref, sourceVersion: 'bad/version' }], edges: [] }).valid, false);
});
