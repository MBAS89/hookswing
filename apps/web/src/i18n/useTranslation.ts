import type { Translations } from './en';
import { useI18n } from './I18nContext';

type DotPaths<T, P extends string = ''> = T extends Record<string, unknown>
  ? {
      [K in keyof T]-?: K extends string
        ? T[K] extends Record<string, unknown>
          ? DotPaths<T[K], `${P}${K}.`>
          : `${P}${K}`
        : never;
    }[keyof T]
  : never;

type TranslationPath = DotPaths<Translations>;

function getByPath(obj: any, path: string): any {
  const keys = path.split('.');
  let val: any = obj;
  for (const key of keys) {
    if (val == null) return path;
    val = val[key];
  }
  return val;
}

export function useTranslation() {
  const { t, isRTL } = useI18n();

  function translate(path: TranslationPath, vars?: Record<string, string | number>): any {
    let val = getByPath(t, path);
    if (typeof val === 'string' && vars) {
      val = val.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
    }
    if (typeof val === 'string' || Array.isArray(val)) return val;
    return path;
  }

  return { t: translate, isRTL, raw: t };
}
