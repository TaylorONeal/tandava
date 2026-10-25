import { createHash } from 'node:crypto';

// Deliberately not imported by the app or an Edge Function. There is no live adapter.
export const REQUIRED_SINKS = Object.freeze([
  'auth', 'database', 'storage', 'free-text-json', 'processors', 'backups',
]);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

export function validateManifest(manifest) {
  if (manifest?.environment !== 'disposable-synthetic' || manifest.version !== 1)
    throw new Error('Only a versioned disposable synthetic rehearsal is supported');
  for (const key of ['requestId', 'profileId', 'policyReference', 'operatorReference', 'schemaFingerprint'])
    if (!nonempty(manifest[key])) throw new Error(`Missing ${key}`);
  if (!Array.isArray(manifest.steps) || !manifest.steps.length) throw new Error('Missing erasure manifest');
  const ids = new Set();
  for (const step of manifest.steps) {
    if (!nonempty(step.id) || step.id === 'access-cutoff' || ids.has(step.id) || !REQUIRED_SINKS.includes(step.sink))
      throw new Error('Unknown or duplicate manifest step');
    ids.add(step.id);
    if (!['erase', 'retain'].includes(step.action)) throw new Error('Unknown disposition');
    if (step.action === 'retain' && (!nonempty(step.reason) || !nonempty(step.processor) ||
        !Number.isFinite(Date.parse(step.expiresAt)))) throw new Error('Retention requires reason, expiry and processor');
  }
  if (REQUIRED_SINKS.some(sink => !manifest.steps.some(step => step.sink === sink)))
    throw new Error('Uncovered data sink');
  return digest(manifest);
}

/**
 * Adapter contract: acquire an exclusive request lock; inspect live state rather
 * than trusting checkpoints; operations must be idempotent with the supplied key.
 * All adapters are synthetic-only. A real Auth/Storage/processor implementation,
 * catalog coverage review and approved production policy are intentionally absent.
 */
export async function rehearseFulfillment(manifest, adapter, journal) {
  manifest = structuredClone(manifest);
  const planHash = validateManifest(manifest);
  if (adapter.environment !== 'disposable-synthetic' || journal.environment !== 'disposable-synthetic')
    throw new Error('Live execution is not supported');
  return journal.withLock(manifest.requestId, async () => {
    let receipt = await journal.read(manifest.requestId);
    if (receipt && receipt.planHash !== planHash) throw new Error('Manifest changed; a new review is required');
    const inspect = async () => {
      const inventory = await adapter.inspect(manifest.profileId);
      if (inventory.soleOwner) throw new Error('Transfer ownership before fulfillment');
      if (inventory.schemaFingerprint !== manifest.schemaFingerprint || inventory.unresolved.length)
        throw new Error('Inventory has unreviewed schema or data sinks');
      const expected = manifest.steps.map(step => step.id).sort();
      if (JSON.stringify([...inventory.stepIds].sort()) !== JSON.stringify(expected))
        throw new Error('Inventory coverage changed');
    };
    if (receipt) {
      receipt.status = 'processing';
      await journal.write(manifest.requestId, receipt);
    }
    await inspect();
    if (!receipt) {
      receipt = { planHash, requestId: manifest.requestId, status: 'processing', checkpoints: [],
        financialDigest: await adapter.financialDigest(manifest.profileId) };
      if (!nonempty(receipt.financialDigest)) throw new Error('Financial baseline missing');
      await journal.write(manifest.requestId, receipt);
    }
    const checkpoint = async id => {
      if (!receipt.checkpoints.includes(id)) receipt.checkpoints.push(id);
      await journal.write(manifest.requestId, receipt);
    };
    // Recheck cutoff even on retries; a prior receipt is not proof sessions stayed revoked.
    if (!await adapter.verifyWriteBarrier(manifest.profileId)) await adapter.blockWrites(manifest.profileId);
    if (!await adapter.verifyWriteBarrier(manifest.profileId)) throw new Error('Write cutoff not verified');
    if (!await adapter.verifyAuthDenied(manifest.profileId)) await adapter.disableAuth(manifest.profileId);
    if (!await adapter.verifyAuthDenied(manifest.profileId)) throw new Error('Authentication cutoff not verified');
    await checkpoint('access-cutoff');
    await inspect();
    for (const step of manifest.steps) {
      await inspect();
      if (!await adapter.verifyWriteBarrier(manifest.profileId) || !await adapter.verifyAuthDenied(manifest.profileId))
        throw new Error('Access cutoff was lost');
      // A crash after mutation but before its checkpoint is recovered by read-back.
      if (!await adapter.verifyStep(step, manifest.profileId)) {
        await adapter.applyStep(step, manifest.profileId, `${manifest.requestId}:${planHash}:${step.id}`);
      }
      if (!await adapter.verifyStep(step, manifest.profileId)) throw new Error(`Step unverified: ${step.id}`);
      await checkpoint(step.id);
    }
    await inspect();
    if (!await adapter.verifyWriteBarrier(manifest.profileId) || !await adapter.verifyAuthDenied(manifest.profileId))
      throw new Error('Final access verification failed');
    for (const step of manifest.steps)
      if (!await adapter.verifyStep(step, manifest.profileId)) throw new Error(`Final verification failed: ${step.id}`);
    if (await adapter.financialDigest(manifest.profileId) !== receipt.financialDigest)
      throw new Error('Financial invariance failed');
    const retained = manifest.steps.filter(step => step.action === 'retain').map(({ id, reason, expiresAt, processor }) => ({ id, reason, expiresAt, processor }));
    // Retention is explicit unfinished work; never infer expiry means erasure happened.
    receipt = { ...receipt, status: retained.length ? 'awaiting-retention' : 'verified-synthetic', retained };
    await journal.write(manifest.requestId, receipt);
    return structuredClone(receipt);
  });
}
