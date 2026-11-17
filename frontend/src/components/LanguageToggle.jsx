import { useTranslation } from 'react-i18next';

export default function LanguageToggle({ isOverHero = false }) {
  const { i18n } = useTranslation();
  const isSinhala = i18n.language === 'si';

  const handleToggle = () => {
    const nextLang = isSinhala ? 'en' : 'si';
    i18n.changeLanguage(nextLang);
    try {
      localStorage.setItem('plantcare_language', nextLang);
    } catch {
      // Fallback if localStorage is inaccessible
    }
  };

  return (
    <div className="flex items-center gap-2 select-none">
      <button
        type="button"
        role="switch"
        aria-checked={isSinhala}
        aria-label="Toggle language between English and Sinhala"
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
          isSinhala
            ? 'bg-emerald-600 ring-1 ring-emerald-500/40'
            : isOverHero
              ? 'bg-white/30 hover:bg-white/40 ring-1 ring-white/20'
              : 'bg-emerald-950/20 hover:bg-emerald-950/30'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isSinhala ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span
        className={`text-xs sm:text-sm font-semibold transition-colors duration-200 ${
          isOverHero ? 'text-white' : 'text-[#1C2A21]'
        }`}
      >
        {isSinhala ? 'සිංහල' : 'English'}
      </span>
    </div>
  );
}
