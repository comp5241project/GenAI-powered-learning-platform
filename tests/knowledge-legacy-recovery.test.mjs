import test from 'node:test';
import assert from 'node:assert/strict';

await import('../knowledge-map/legacy-recovery.js');
const find = globalThis.SkillLoopLegacyRecovery.find;
const restore = globalThis.SkillLoopLegacyRecovery.restore;

test('V1-only references remain discoverable without changing the V2 network', () => {
  const legacy = { references: [
    { id: 'foundations', title: 'Foundations', note: 'Old note' },
    { id: 'requirements', title: 'Requirements', note: 'Keep this record', version: 'v1' },
    { id: '../invalid', title: 'Invalid' },
  ] };
  const current = { nodes: [{ id: 'software-development:foundations', kind: 'reference' }], edges: [] };
  const snapshot = structuredClone(current);
  assert.deepEqual(find(legacy, current, 'software-development'), [{
    id: 'requirements', title: 'Requirements', description: '', note: 'Keep this record', version: 'v1',
  }]);
  assert.deepEqual(current, snapshot);
});

test('restoring a selected V1 reference keeps its snapshot, note and source version without changing V1', () => {
  const legacy = { references: [{ id: 'requirements', title: 'Requirements',
    description: 'Legacy description', note: 'Keep this note', version: '2026-01-01.1' }] };
  const original = structuredClone(legacy);
  const current = { nodes: [{ id: 'note:existing', kind: 'note' }], edges: [] };
  const [record] = find(legacy, current, 'software-development');
  assert.equal(restore(current, record, 'software-development'), true);
  assert.deepEqual(current.nodes[1], {
    id: 'software-development:requirements', kind: 'reference', graphId: 'software-development',
    conceptId: 'requirements', sourceVersion: '2026-01-01.1', titleSnapshot: 'Requirements',
    descriptionSnapshot: 'Legacy description', note: 'Keep this note', x: 300, y: 80,
  });
  assert.equal(restore(current, record, 'software-development'), false);
  assert.deepEqual(legacy, original);
  assert.deepEqual(find(legacy, current, 'software-development'), []);
});
