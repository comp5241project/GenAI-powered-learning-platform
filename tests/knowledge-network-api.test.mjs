import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

test('knowledge API errors retain HTTP status for import recovery guidance', async () => {
  const source = await readFile(new URL('../knowledge-map/network-core.js', import.meta.url), 'utf8');
  const sandbox = {
    window: {}, location: { search: '' }, URLSearchParams,
    fetch: async () => ({ ok: false, status: 404,
      json: async () => ({ error: 'Published version is unavailable.' }) }),
  };
  runInNewContext(source, sandbox);
  await assert.rejects(sandbox.window.KnowledgeNetwork.api('import-personal'), (error) =>
    error.status === 404 && error.message === 'Published version is unavailable.');
});
