import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Leaf, ScanSearch, Sprout } from 'lucide-react';
import { SUPPORTED_PLANTS } from '../data/diseases';
import { translateCrop } from '../utils/diseaseTranslator';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'si' ? 'si' : 'en';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-emerald-950/10 bg-[#112A1C] text-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Leaf className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold tracking-tight">PlantCare AI</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-emerald-100/80">
              {t('footer.desc')}
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-950/60 px-3 py-1.5 text-xs text-emerald-200">
              <Sprout className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>{t('footer.connected_badge')}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
              {t('footer.nav_title')}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-emerald-100/80">
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link
                  to="/detect"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                >
                  <ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('nav.detect')}</span>
                </Link>
              </li>
              <li>
                <Link to="/results" className="transition-colors hover:text-white">
                  {t('nav.results')}
                </Link>
              </li>
              <li>
                <Link
                  to="/library"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('nav.library')}</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition-colors hover:text-white">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
              {t('footer.crops_title')}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SUPPORTED_PLANTS.map((plant) => (
                <li key={plant.name}>
                  <Link
                    to={`/library?plant=${encodeURIComponent(plant.name)}`}
                    className="inline-block rounded-full border border-emerald-400/20 bg-emerald-900/50 px-3 py-1 text-xs font-medium text-emerald-100 transition-colors hover:border-emerald-400/50 hover:bg-emerald-800/70"
                  >
                    {translateCrop(plant.name, currentLang)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-emerald-200/10 pt-6 text-xs text-emerald-200/70 sm:flex-row sm:items-center">
          <p>&copy; {currentYear} {t('footer.copyright')}</p>
          <p>{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
