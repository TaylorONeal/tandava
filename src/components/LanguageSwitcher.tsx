/**
 * Language Switcher
 *
 * A dropdown that lets users change their display language.
 * Saves preference to localStorage via i18next-browser-languagedetector.
 * Also updates <html lang="..."> for accessibility/SEO.
 *
 * Appears in:
 * - AppLayout header (student-facing)
 * - ManageLayout sidebar footer (studio admin)
 * - Account settings (future)
 */

import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageSwitcherProps {
  /** Compact mode: icon only (for tight header space) */
  compact?: boolean;
}

export function LanguageSwitcher({ compact = true }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)
    ?? SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    // <html lang> and dir are synced by the languageChanged listener in src/i18n
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'icon' : 'default'}
          className={compact ? '' : 'gap-2'}
          title={`Language: ${currentLang.nativeName}`}
        >
          <Globe className="h-5 w-5" />
          {!compact && (
            <span className="text-sm">{currentLang.nativeName}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* The list grows with every language shipped — cap the height so it
          scrolls inside the menu instead of running off the viewport. */}
      <DropdownMenuContent
        align="end"
        className="min-w-[180px] max-h-[60vh] overflow-y-auto rounded-2xl p-2"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`rounded-xl cursor-pointer flex items-center gap-3 ${
              lang.code === i18n.language ? 'bg-primary/10 text-primary' : ''
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{lang.nativeName}</span>
              {lang.nativeName !== lang.name && (
                <span className="text-xs text-muted-foreground">{lang.name}</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
