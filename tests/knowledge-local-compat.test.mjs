import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const storageCode = readFileSync(new URL('../shared/storage.js', import.meta.url), 'utf8');
const networkCode = readFileSync(new URL('../knowledge-map/network-core.js', import.meta.url), 'utf8');

function browser(initial = {}, failWrites = false) {
  const records = new Map(Object.entries(initial));
  const context = { URLSearchParams, location: { search: '' }, document: { querySelector: () => null },
    localStorage: {
      getItem: (key) => records.get(key) ?? null,
      setItem: (key, value) => { if (failWrites) throw new Error('Storage full'); records.set(key, value); },
    } };
  context.window = context;
  runInNewContext(storageCode, context);
  runInNewContext(networkCode, context);
  return { records, SkillLoop: context.SkillLoop, network: context.KnowledgeNetwork };
}

test('V1 references appear with stable graphId:conceptId keys without rewriting V1', () => {
  const old = { selected: 'foundations', completed: ['foundations'], references: [{ id: 'software-testing',
    version: '2026-10-21.1', title: 'Software testing', description: 'Testing', note: 'My note' }] };
  const { records, network } = browser({ 'skillloop.v1.knowledge': JSON.stringify(old) });
  const data = network.local();
  assert.equal(data.nodes.length, 1);
  assert.equal(data.nodes[0].id, 'software-development:software-testing');
  assert.equal(data.nodes[0].sourceVersion, '2026-10-21.1');
  assert.equal(data.nodes[0].titleSnapshot, 'Software testing');
  assert.equal(data.nodes[0].note, 'My note');
  assert.deepEqual(JSON.parse(records.get('skillloop.v1.knowledge')), old);
  assert.equal(records.has('skillloop.v1.knowledgeV2'), false);
});

test('existing knowledgeV2 records take precedence and retain personal links', () => {
  const existing = { nodes: [{ id: 'note:11111111-1111-4111-8111-111111111111', kind: 'note',
    title: 'Own note', body: 'Saved' }], edges: [{ id: 'edge', source: 'a', target: 'b', reason: 'Because' }] };
  const { network } = browser({ 'skillloop.v1.knowledge': JSON.stringify({ references: [{ id: 'foundations' }] }),
    'skillloop.v1.knowledgeV2': JSON.stringify(existing) });
  assert.deepEqual(JSON.parse(JSON.stringify(network.local())), existing);
});

test('failed browser writes remain readable in memory and are reported as temporary', () => {
  const { SkillLoop, network } = browser({}, true);
  assert.equal(network.saveLocal({ nodes: [{ id: 'temporary' }], edges: [] }), false);
  assert.equal(SkillLoop.storageAvailable(), false);
  assert.equal(network.local().nodes[0].id, 'temporary');
});
