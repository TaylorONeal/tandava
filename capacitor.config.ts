import type { CapacitorConfig } from '@capacitor/cli';

const target = process.env.TANDAVA_APP;
if (target !== 'member' && target !== 'studio') throw new Error('Set TANDAVA_APP=member or studio');
// Each app ships only the plugins it uses. The camera scanner is Studio-only, so the
// member binary never links camera code it has no usage description for.
const shared = ['@capacitor/app', '@capacitor/browser', '@capacitor/haptics', '@capacitor/network', '@capacitor/share'];
const plugins = target === 'studio' ? [...shared, '@capacitor/barcode-scanner'] : shared;
const config: CapacitorConfig = {
  appId: target === 'member' ? 'com.tandava.app' : 'com.tandava.studio',
  appName: target === 'member' ? 'Tandava' : 'Tandava Studio',
  webDir: `dist-native/${target}`,
  ios: { path: `native/${target}/ios`, contentInset: 'automatic' },
  // Bundle assets locally: never replace this with a production server URL.
  server: { hostname: 'localhost' },
  includePlugins: plugins,
};
export default config;
