import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Language, WorkspaceSection } from '../types/tapoyna';
import { TRANSLATIONS } from '../i18n/translations';

interface TopBarProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  onReset: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  onChangeLang,
  activeSection,
  onSelectSection,
  onReset,
}) => {
  const t = TRANSLATIONS[lang];

  const navItems: { id: WorkspaceSection; label: string }[] = [
    { id: 'sandbox', label: t.nav.sandbox },
    { id: 'qa', label: t.nav.qa },
    { id: 'ledger', label: t.nav.ledger },
    { id: 'policy', label: t.nav.policy },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectSection('sandbox')}
          className="text-left text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          TapOyna
        </button>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`relative py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-emerald-600" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Language Switcher & Reset Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5"
            role="group"
            aria-label="Language"
          >
            {(['ru', 'az', 'en'] as Language[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onChangeLang(code)}
                className={`px-2.5 py-1 text-xs font-semibold uppercase rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lang === code
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t.nav.reset}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
