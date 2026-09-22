import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Keep the real detector/i18next pipeline; replace only HTTP translation loading.
vi.mock('i18next-http-backend', () => ({ default: class {
  static type = 'backend';
  type = 'backend';
  init() {}
  read(_language: string, _namespace: string, callback: (error: null, data: object) => void) {
    callback(null, { ready: 'ready' });
  }
} }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_DEMO_MODE', 'true');
  const data = new Map<string, string>();
  vi.stubGlobal('window', { localStorage: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  } });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

async function boot(languages: string[]) {
  vi.stubGlobal('navigator', { languages, language: languages[0] });
  const config = await import('./index');
  await config.i18nReady;
  const instance = createInstance().use(LanguageDetector);
  await instance.init({
    fallbackLng: 'en', supportedLngs: config.SUPPORTED_LANGUAGES.map(l => l.code),
    detection: config.LANGUAGE_DETECTION,
    resources: Object.fromEntries(config.SUPPORTED_LANGUAGES.map(l => [l.code, { translation: { ready: l.code } }])),
  });
  return { instance, config };
}

describe('language selection', () => {
  it('ignores legacy Spanish cache in demo on an English device', async () => {
    window.localStorage.setItem('tandava-language', 'es');
    const { instance, config } = await boot(['en-US', 'es']);
    expect(instance.resolvedLanguage).toBe('en');
    expect(window.localStorage.getItem(config.LANGUAGE_STORAGE_KEY)).toBeNull();
  });
  it.each([
    [['es-MX', 'en-US'], 'es'], [['xx', 'fr-FR'], 'fr'], [['xx'], 'en'],
    [['zh-TW'], 'zh-Hant'], [['zh-HK'], 'zh-Hant'], [['zh-CN'], 'zh'],
    [['tl-PH'], 'fil'], [['in-ID'], 'id'], [['ar-SA'], 'ar'],
  ])('resolves device %j to %s', async (languages, expected) => {
    expect((await boot(languages)).instance.resolvedLanguage).toBe(expected);
  });
  it('persists explicit choice across reload and resets to device', async () => {
    const { config } = await boot(['en-US']);
    await config.setLanguagePreference('es');
    expect((await boot(['en-US'])).instance.resolvedLanguage).toBe('es');
    await config.setLanguagePreference();
    expect(window.localStorage.getItem(config.LANGUAGE_STORAGE_KEY)).toBeNull();
    expect((await boot(['en-US'])).instance.resolvedLanguage).toBe('en');
  });
  it('preserves existing non-demo preferences', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    window.localStorage.setItem('tandava-language', 'es');
    expect((await boot(['en-US'])).instance.resolvedLanguage).toBe('es');
  });
  it('ignores unsupported saved preferences', async () => {
    window.localStorage.setItem('tandava-demo-language-choice-v1', 'invalid');
    expect((await boot(['en-US'])).instance.resolvedLanguage).toBe('en');
  });
  it('still switches when storage is blocked', async () => {
    const { config } = await boot(['en-US']);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    await expect(config.setLanguagePreference('es')).resolves.toBeUndefined();
    expect(config.default.language).toBe('es');
  });
});
