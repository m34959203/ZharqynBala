export { translations, type Language, type TranslationKey } from './translations';

import { translations, Language } from './translations';

// Simple translation function
export function t(key: string, lang: Language = 'ru'): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to Russian if key not found
      value = translations.ru;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if not found
        }
      }
    }
  }

  return typeof value === 'string' ? value : key;
}

// Hook for React components
export function useTranslation(lang: Language = 'ru') {
  return {
    t: (key: string) => t(key, lang),
    lang,
  };
}
