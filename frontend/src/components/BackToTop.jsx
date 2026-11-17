import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const { i18n } = useTranslation();
  const isSinhala = i18n.language === 'si';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const label = isSinhala ? 'නැවත ඉහළට යන්න' : 'Back to top';

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      title={label}
      className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-lg shadow-emerald-950/25 ring-1 ring-emerald-600/30 backdrop-blur-xs transition-all duration-300 hover:bg-emerald-600 hover:shadow-emerald-900/40 hover:-translate-y-1 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
        isVisible
          ? 'pointer-events-auto opacity-100 translate-y-0 scale-100'
          : 'pointer-events-none opacity-0 translate-y-4 scale-90'
      }`}
    >
      <ArrowUp className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
    </button>
  );
}
