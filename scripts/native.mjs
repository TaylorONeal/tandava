import { spawnSync } from 'node:child_process';
import { loadEnv } from 'vite';
const [target, action = 'sync'] = process.argv.slice(2);
if (!['member', 'studio'].includes(target) || !['build', 'add', 'sync'].includes(action)) {
  throw new Error('Usage: node scripts/native.mjs member|studio build|add|sync');
}
const env = { ...process.env, ...loadEnv('native', process.cwd(), 'VITE_'), TANDAVA_APP: target, VITE_NATIVE_APP: target, VITE_BLOG_GAMES: 'false' };
// A native candidate must never silently become the sample-data demo.
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || env.VITE_DEMO_MODE === 'true' || /your-|example|localhost/.test(env.VITE_SUPABASE_URL) || /your-|service_role/.test(env.VITE_SUPABASE_ANON_KEY)) {
  throw new Error('Supply existing public Supabase URL/anon key and disable demo mode for native builds. Never use service credentials.');
}
function run(command, args) {
  const r = spawnSync(command, args, { env, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}
run('npx', ['vite', 'build', '--mode', 'native', '--outDir', `dist-native/${target}`]);
if (action !== 'build') run('npx', ['cap', action, 'ios']);
