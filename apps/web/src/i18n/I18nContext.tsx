import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Translations } from './en';
import { en } from './en';
import { ar } from './ar';

type Lang = 'en' | 'ar';

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
  isRTL: boolean;
}

const translationsMap: Record<Lang, Translations> = { en, ar };

const I18nContext = createContext<I18nState | null>(null);

const STORAGE_KEY = 'hookswing-lang';

function getSavedLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') return stored;
  } catch {}
  // Detect Arabic from browser preference
  const preferred = navigator.language.toLowerCase();
  if (preferred.startsWith('ar')) return 'ar';
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getSavedLang());

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  const t = translationsMap[lang];
  const isRTL = lang === 'ar';

  // Sync html lang and dir
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [lang, isRTL]);

  const value = useMemo(() => ({ lang, setLang, t, isRTL }), [lang, setLang, t, isRTL]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
