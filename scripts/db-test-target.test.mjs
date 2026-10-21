import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const check = (url, extra = {}) => spawnSync('bash', ['scripts/db-test.sh'], {
  env: { ...process.env, PGSERVICE: '', PGHOSTADDR: '', PGHOST: '',
    ADMIN_URL: url, DB_TEST_VALIDATE_ONLY: '1', ...extra }, encoding: 'utf8',
});
test('database reset accepts only explicit local targets before connecting', () => {
  for (const url of ['postgresql://postgres:postgres@127.0.0.1:5432/postgres', 'postgres://localhost/postgres', 'postgresql://[::1]/postgres']) {
    assert.equal(check(url).status, 0, url);
  }
  assert.equal(check('postgresql:///postgres', { PGHOST: '/tmp' }).status, 0);
  for (const url of ['postgresql://db.example.com/postgres', 'postgresql://127.0.0.1.example.com/postgres',
    'postgresql://localhost/postgres?host=db.example.com', 'postgresql://localhost/postgres?service=production',
    'postgresql:///postgres', 'postgresql://localhost/postgres#fragment',
    'postgresql://user?host=remote@localhost/postgres', 'postgresql://user#fragment@localhost/postgres']) {
    assert.equal(check(url).status, 2, url);
  }
  assert.equal(check('postgresql://localhost/postgres', { PGSERVICE: 'production' }).status, 2);
  assert.equal(check('postgresql://localhost/postgres', { PGHOSTADDR: '203.0.113.10' }).status, 2);
});

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('duplicate migration versions fail before the reset can connect', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tandava-migrations-'));
  const validate = () => spawnSync('bash', ['scripts/check-migration-versions.sh', dir], { encoding: 'utf8' });
  try {
    writeFileSync(join(dir, '00045_existing.sql'), '-- test only');
    writeFileSync(join(dir, '00046_forward.sql'), '-- test only');
    assert.equal(validate().status, 0);
    writeFileSync(join(dir, '00045_collision.sql'), '-- test only');
    const result = validate();
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Duplicate migration versions: 00045/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
