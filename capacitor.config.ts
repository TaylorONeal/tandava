import type { CapacitorConfig } from '@capacitor/cli';

const target = process.env.TANDAVA_APP;
if (target !== 'member' && target !== 'studio') throw new Error('Set TANDAVA_APP=member or studio');
const config: CapacitorConfig = {
  appId: target === 'member' ? 'com.tandava.app' : 'com.tandava.studio',
  appName: target === 'member' ? 'Tandava' : 'Tandava Studio',
  webDir: `dist-native/${target}`,
  ios: { path: `native/${target}/ios`, contentInset: 'automatic' },
  // Bundle assets locally: never replace this with a production server URL.
  server: { hostname: 'localhost' },
};
export default config;
