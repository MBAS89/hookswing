import { Globe } from 'lucide-react';
import { useI18n } from './I18nContext';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ compact, className = '' }: LanguageSwitcherProps) {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${className}`}
      aria-label="Switch language"
    >
      <Globe className="h-4 w-4" />
      {!compact && <span>{lang === 'en' ? 'العربية' : 'English'}</span>}
      {compact && <span className="text-xs">{lang.toUpperCase()}</span>}
    </button>
  );
}
