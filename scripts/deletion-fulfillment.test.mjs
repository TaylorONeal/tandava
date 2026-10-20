import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_SINKS, rehearseFulfillment, validateManifest } from './deletion/fulfillment.mjs';

function fixture() {
  const manifest = { version: 1, environment: 'disposable-synthetic', requestId: 'synthetic-request', profileId: 'synthetic-profile',
    policyReference: 'TEST-ONLY-POLICY', operatorReference: 'TEST-ONLY-OPERATOR', schemaFingerprint: 'fixture-schema-v1',
    steps: REQUIRED_SINKS.map(sink => ({ id: sink, sink, action: 'erase' })) };
  const state = { barrier: false, authDenied: false, soleOwner: false, schema: 'fixture-schema-v1', unresolved: [],
    stepIds: [...REQUIRED_SINKS], values: new Map(REQUIRED_SINKS.map(k => [k, 'synthetic personal data'])),
    financial: 'unchanged transaction amounts and relationships', applied: [], failure: null, receipt: null, locked: false };
  const adapter = { environment: 'disposable-synthetic',
    inspect: async () => ({ soleOwner: state.soleOwner, schemaFingerprint: state.schema, unresolved: state.unresolved, stepIds: state.stepIds }),
    financialDigest: async () => state.financial,
    verifyWriteBarrier: async () => state.barrier,
    blockWrites: async () => { state.barrier = true; },
    verifyAuthDenied: async () => state.authDenied,
    disableAuth: async () => { state.authDenied = true; },
    verifyStep: async step => state.values.get(step.id) === (step.action === 'retain' ? 'retention-recorded' : null),
    applyStep: async (step, _profile, key) => {
      assert.ok(state.barrier && state.authDenied, 'no scrubbing before access cutoff');
      state.values.set(step.id, step.action === 'retain' ? 'retention-recorded' : null);
      state.applied.push(key);
      if (state.failure === step.id) throw new Error('Injected response loss after mutation');
    },
  };
  const journal = { environment: 'disposable-synthetic',
    withLock: async (_id, fn) => {
      if (state.locked) throw new Error('Request busy');
      state.locked = true;
      try { return await fn(); } finally { state.locked = false; }
    },
    read: async () => structuredClone(state.receipt),
    write: async (_id, receipt) => { state.receipt = structuredClone(receipt); },
  };
  return { manifest, state, adapter, journal, run: () => rehearseFulfillment(manifest, adapter, journal) };
}

test('complete synthetic erasure verifies every sink, preserves financial data and is idempotent', async () => {
  const f = fixture(); const first = await f.run();
  assert.equal(first.status, 'verified-synthetic'); assert.equal(f.state.applied.length, 6);
  assert.deepEqual(await f.run(), first); assert.equal(f.state.applied.length, 6);
  assert.ok(!JSON.stringify(first).includes('synthetic personal data'));
});
test('partial failure resumes by read-back without repeating an already committed mutation', async () => {
  const f = fixture(); f.state.failure = 'storage';
  await assert.rejects(f.run, /Injected/); assert.equal(f.state.receipt.status, 'processing');
  f.state.failure = null; assert.equal((await f.run()).status, 'verified-synthetic');
  assert.equal(f.state.applied.length, 6);
});
test('unknown schema, unknown sinks, missing inventory coverage and changed ownership fail closed', async () => {
  for (const change of [f => { f.state.schema = 'new'; }, f => { f.state.unresolved.push('new JSON column'); },
    f => { f.state.stepIds.push('new_table'); }, f => { f.state.soleOwner = true; }]) {
    const f = fixture(); change(f); await assert.rejects(f.run); assert.equal(f.state.applied.length, 0);
  }
});
test('ownership becoming sole after cutoff blocks scrubbing', async () => {
  const f = fixture(); f.adapter.disableAuth = async () => { f.state.authDenied = true; f.state.soleOwner = true; };
  await assert.rejects(f.run, /ownership/); assert.equal(f.state.applied.length, 0);
});
test('unverified auth or writes cannot proceed to erasure', async () => {
  for (const key of ['blockWrites', 'disableAuth']) {
    const f = fixture(); f.adapter[key] = async () => {};
    await assert.rejects(f.run, /cutoff not verified/); assert.equal(f.state.applied.length, 0);
  }
});
test('processor verification failure never creates a completion receipt', async () => {
  const f = fixture(); const verify = f.adapter.verifyStep;
  f.adapter.verifyStep = async step => step.id === 'processors' ? false : verify(step);
  await assert.rejects(f.run, /unverified/); assert.equal(f.state.receipt.status, 'processing');
});
test('financial mutation is detected and blocks completion', async () => {
  const f = fixture(); const apply = f.adapter.applyStep;
  f.adapter.applyStep = async (...args) => { await apply(...args); f.state.financial = 'changed'; };
  await assert.rejects(f.run, /Financial invariance/); assert.equal(f.state.receipt.status, 'processing');
});
test('retention requires explicit ownership and expiry and stays unfinished even after expiry', async () => {
  const f = fixture(); Object.assign(f.manifest.steps.at(-1), { action: 'retain', reason: 'Synthetic policy test', processor: 'Synthetic backup adapter', expiresAt: '2000-01-01T00:00:00Z' });
  const result = await f.run(); assert.equal(result.status, 'awaiting-retention'); assert.equal(result.retained.length, 1);
  delete f.manifest.steps.at(-1).processor; assert.throws(() => validateManifest(f.manifest), /Retention/);
});
test('live environments, missing policy, duplicate steps and omitted sinks are refused', async () => {
  for (const change of [f => { f.manifest.environment = 'production'; }, f => { f.adapter.environment = 'production'; },
    f => { f.journal.environment = 'production'; }, f => { f.manifest.policyReference = ''; },
    f => { f.manifest.steps.push(f.manifest.steps[0]); }, f => { f.manifest.steps.pop(); }]) {
    const f = fixture(); change(f); await assert.rejects(f.run); assert.equal(f.state.applied.length, 0);
  }
});
test('changed manifest after failure cannot reuse a previous approval or checkpoint', async () => {
  const f = fixture(); f.state.failure = 'storage'; await assert.rejects(f.run);
  f.manifest.operatorReference = 'another operator'; await assert.rejects(f.run, /Manifest changed/);
});
test('two concurrent runs serialize rather than repeat external work', async () => {
  const f = fixture(); const results = await Promise.allSettled([f.run(), f.run()]);
  assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(f.state.applied.length, 6);
});
test('final verification detects data repopulated after an earlier successful checkpoint', async () => {
  const f = fixture(); const apply = f.adapter.applyStep;
  f.adapter.applyStep = async (...args) => { await apply(...args); if (args[0].id === 'backups') f.state.values.set('database', 'reappeared'); };
  await assert.rejects(f.run, /Final verification failed/); assert.equal(f.state.receipt.status, 'processing');
});
