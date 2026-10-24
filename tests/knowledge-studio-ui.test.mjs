import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../knowledge-map/studio-ui.js', import.meta.url), 'utf8');
const context = { window: {} };
runInNewContext(source, context);
const { views, relatedCounts } = context.window.SkillLoopStudioUI;

test('studio exposes one task at a time and has a separate library and review', () => {
  assert.deepEqual([...views], ['library', 'concepts', 'relationships', 'questions', 'cases', 'research', 'review']);
});

test('related content counts use current draft links and ignore archived items', () => {
  const draft = {
    relations: [{ source: 'a', target: 'b' }, { source: 'c', target: 'a' }],
    questions: [{ topicId: 'a' }, { topicId: 'a', archived: true }, { topicId: 'b' }],
    events: [{ links: [{ topicId: 'a' }, { topicId: 'b' }] },
      { links: [{ topicId: 'a' }], archived: true }, { links: [{ topicId: 'b' }] }],
  };
  assert.deepEqual({ ...relatedCounts(draft, 'a') }, { relationships: 2, questions: 1, cases: 1 });
});
