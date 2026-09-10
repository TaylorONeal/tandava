#!/usr/bin/env node
/**
 * Locale consistency checker.
 *
 * Validates every locale in public/locales/ against English (the source of
 * truth). Runs automatically before `npm run build` (see "prebuild") and can
 * be run standalone with `npm run check:locales`.
 *
 * ERRORS (exit 1 — block the build):
 *   - Invalid JSON in any locale file
 *   - A locale directory not registered in SUPPORTED_LANGUAGES (or vice versa)
 *   - A namespace file that doesn't exist in English
 *   - {{placeholder}} sets that differ from the English string for the same key
 *
 * WARNINGS (reported, non-blocking — missing strings fall back to English by design):
 *   - Keys missing from a locale (coverage % is reported per locale)
 *   - Keys present in a locale but not in English (dead keys)
 *   - Plural sets that don't match the locale's CLDR plural categories
 *   - Locales whose values are still verbatim English (untranslated scaffolding)
 *
 * Two numbers are reported per locale, and they mean different things:
 *   keys  — how many keys exist (missing ones fall back to English)
 *   text  — how many present values are actually translated, not copied English
 * A locale can sit at 100% keys and 0% text; that is a shipped-but-untranslated
 * locale, which is why both are reported.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const localesDir = join(root, 'public', 'locales');
const i18nIndexPath = join(root, 'src', 'i18n', 'index.ts');

const errors = [];
const warnings = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/**
 * Strings that are legitimately identical across languages: brand and product
 * names, and units that most locales keep verbatim. Without this, correctly
 * translated locales would look partly untranslated.
 */
const SHARED_TOKENS = new Set([
  'google', 'apple', 'paypal', 'venmo', 'zelle', 'cash app', 'stripe',
  'supabase', 'sentry', 'tandava', 'sms', 'utm', 'workshop', 'min',
  'email', 'e-mail', 'home', 'dashboard', 'community', 'powered by',
]);

/** True when a locale value being identical to English means "not translated yet". */
function looksUntranslated(enValue, locValue) {
  if (enValue !== locValue) return false;
  const v = locValue.trim().toLowerCase();
  if (!v) return false;
  if (SHARED_TOKENS.has(v)) return false;
  // Pure placeholders/punctuation/digits carry no translatable text
  if (!/[a-z]/i.test(v.replace(/\{\{[^}]*\}\}/g, ''))) return false;
  return true;
}

/** Flatten nested JSON into { "a.b.c": "value" } pairs. */
function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      Object.assign(acc, flatten(value, path));
    } else {
      acc[path] = String(value);
    }
    return acc;
  }, {});
}

/** Extract the set of {{placeholder}} names from a translation string. */
function placeholders(str) {
  return new Set([...str.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(m => m[1]));
}

/**
 * Group flat keys into plural "bases": "spot_one"/"spot_other" → base "spot"
 * with categories {one, other}. Non-plural keys get categories = null.
 */
function groupPlurals(flatKeys) {
  const bases = new Map();
  for (const key of Object.keys(flatKeys)) {
    const match = key.match(PLURAL_SUFFIX);
    const base = match ? key.slice(0, -match[0].length) : key;
    if (!bases.has(base)) bases.set(base, match ? new Set() : null);
    if (match) {
      const existing = bases.get(base);
      if (existing === null) {
        // Same base used both plural and non-plural — treat as distinct keys
        bases.set(key, new Set());
      } else {
        existing.add(match[1]);
      }
    }
  }
  return bases;
}

/**
 * CLDR plural categories for a locale.
 *
 * Intl.PluralRules does NOT throw on a well-formed but unknown tag like 'ban' —
 * it quietly negotiates down to the runtime's default locale, which would make
 * the required plural forms depend on the build machine rather than on the
 * language. So we resolve through INTL_LOCALE_MAP first (the same mapping the
 * app uses for formatting) and then verify Intl actually honoured the request,
 * falling back to 'other' only when it did not.
 */
function pluralCategories(locale) {
  const requested = intlLocaleMap[locale] ?? locale;
  try {
    const rules = new Intl.PluralRules(requested);
    const resolved = rules.resolvedOptions().locale;
    if (resolved.split('-')[0] !== requested.split('-')[0]) {
      // Intl fell back to another locale — treat as non-CLDR, 'other' only
      return new Set(['other']);
    }
    return new Set(rules.resolvedOptions().pluralCategories);
  } catch {
    return new Set(['other']);
  }
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`${label}: invalid JSON — ${e.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Registration check: locale dirs ⟷ SUPPORTED_LANGUAGES in src/i18n/index.ts
// ---------------------------------------------------------------------------

const i18nSource = readFileSync(i18nIndexPath, 'utf8');
const registeredCodes = [...i18nSource.matchAll(/code:\s*'([^']+)'/g)].map(m => m[1]);

// INTL_LOCALE_MAP tells us which CLDR locale a non-CLDR language formats as
// (e.g. Balinese → Indonesian). Plural validation has to follow the same map.
const intlLocaleMap = Object.fromEntries(
  [...(i18nSource.match(/INTL_LOCALE_MAP[^{]*\{([^}]*)\}/s)?.[1] ?? '')
    .matchAll(/(\w[\w-]*)\s*:\s*'([^']+)'/g)].map(m => [m[1], m[2]])
);
const localeDirs = readdirSync(localesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const dir of localeDirs) {
  if (!registeredCodes.includes(dir)) {
    errors.push(`Locale directory public/locales/${dir}/ is not registered in SUPPORTED_LANGUAGES (src/i18n/index.ts)`);
  }
}
for (const code of registeredCodes) {
  if (!localeDirs.includes(code)) {
    errors.push(`Language '${code}' is registered in SUPPORTED_LANGUAGES but public/locales/${code}/ does not exist`);
  }
}

// ---------------------------------------------------------------------------
// Per-locale comparison against English
// ---------------------------------------------------------------------------

const enDir = join(localesDir, 'en');
const namespaces = readdirSync(enDir).filter(f => f.endsWith('.json'));

// English reference: namespace → { flat, bases }
const enRef = {};
for (const ns of namespaces) {
  const json = readJson(join(enDir, ns), `en/${ns}`);
  if (json) {
    const flat = flatten(json);
    enRef[ns] = { flat, bases: groupPlurals(flat) };
  }
}

const coverage = [];

for (const locale of localeDirs.filter(l => l !== 'en').sort()) {
  const dir = join(localesDir, locale);
  const cats = pluralCategories(locale);
  let totalBases = 0;
  let presentBases = 0;
  let comparableValues = 0;
  let untranslatedValues = 0;

  // Namespace files that don't exist in English are almost certainly typos
  for (const file of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    if (!enRef[file]) {
      errors.push(`${locale}/${file}: namespace does not exist in en/`);
    }
  }

  for (const ns of namespaces) {
    const ref = enRef[ns];
    if (!ref) continue;
    totalBases += ref.bases.size;

    const path = join(dir, ns);
    if (!existsSync(path)) {
      warnings.push(`${locale}/${ns}: file missing (all ${ref.bases.size} keys fall back to English)`);
      continue;
    }
    const json = readJson(path, `${locale}/${ns}`);
    if (!json) continue;

    const flat = flatten(json);
    const bases = groupPlurals(flat);

    for (const [base, enCats] of ref.bases) {
      if (!bases.has(base)) continue; // counted as missing below
      presentBases++;

      if (enCats !== null) {
        // Plural key: the locale should provide exactly its CLDR categories
        const locCats = bases.get(base) ?? new Set();
        for (const cat of cats) {
          if (!locCats.has(cat)) {
            warnings.push(`${locale}/${ns}: '${base}' is missing plural form '_${cat}' (required for ${locale})`);
          }
        }
      }

      // Placeholder parity — compare each locale key against its English
      // counterpart (same key if it exists, else the English '_other' form)
      const localeKeys = enCats === null ? [base] : [...(bases.get(base) ?? [])].map(c => `${base}_${c}`);
      for (const key of localeKeys) {
        if (!(key in flat)) continue;
        const enValue = ref.flat[key] ?? ref.flat[`${base}_other`] ?? ref.flat[base];
        if (enValue === undefined) continue;
        comparableValues++;
        if (looksUntranslated(enValue, flat[key])) untranslatedValues++;

        const want = placeholders(enValue);
        const got = placeholders(flat[key]);
        if (want.size !== got.size || [...want].some(p => !got.has(p))) {
          errors.push(
            `${locale}/${ns}: '${key}' placeholders {${[...got]}} don't match en {${[...want]}}`
          );
        }
      }
    }

    for (const base of bases.keys()) {
      if (!ref.bases.has(base)) {
        warnings.push(`${locale}/${ns}: '${base}' does not exist in en/ (dead key?)`);
      }
    }
  }

  const translatedPct = comparableValues
    ? Math.round(((comparableValues - untranslatedValues) / comparableValues) * 100)
    : 100;
  if (untranslatedValues && translatedPct < 50) {
    warnings.push(
      `${locale}: ${untranslatedValues} of ${comparableValues} present strings are still verbatim English ` +
      `(${translatedPct}% translated) — the locale ships but reads as English`
    );
  }
  coverage.push({
    locale,
    pct: totalBases ? Math.round((presentBases / totalBases) * 100) : 100,
    translatedPct,
  });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log('Locale coverage vs en:   keys = present, text = actually translated');
for (const { locale, pct, translatedPct } of coverage) {
  console.log(
    `  ${locale.padEnd(8)} keys ${String(pct).padStart(3)}%   text ${String(translatedPct).padStart(3)}%`
  );
}

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}

console.log('\nLocale check passed.');
