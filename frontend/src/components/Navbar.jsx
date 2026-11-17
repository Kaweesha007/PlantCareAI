import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Menu, ScanSearch, X } from 'lucide-react';
import LanguageToggle from './LanguageToggle';

export default function Navbar() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isOverHero = isHome && !scrolled;

  const navItems = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.detect'), to: '/detect' },
    { label: t('nav.results'), to: '/results' },
    { label: t('nav.library'), to: '/library' },
    { label: t('nav.about'), to: '/about' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const linkClass = ({ isActive }) => {
    if (isOverHero) {
      return `relative rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-white/20 text-white font-semibold backdrop-blur-sm border border-white/25 shadow-xs'
          : 'text-white/85 hover:bg-white/15 hover:text-white hover:backdrop-blur-xs'
      }`;
    }
    return `relative rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-700/15 shadow-xs'
        : 'text-[#4B5E51] hover:bg-emerald-50/70 hover:text-emerald-900'
    }`;
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isOverHero
          ? 'border-b border-white/15 bg-[#0c2918]/25 backdrop-blur-md shadow-xs'
          : 'border-b border-emerald-950/10 bg-white/85 backdrop-blur-md shadow-xs'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo - Left Aligned */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6 ${
              isOverHero
                ? 'bg-emerald-500 text-[#0c2918] ring-1 ring-emerald-300/40 shadow-emerald-950/40'
                : 'bg-emerald-700 text-white shadow-emerald-900/20'
            }`}
          >
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span
              className={`text-base font-bold tracking-tight transition-colors duration-200 ${
                isOverHero ? 'text-white' : 'text-[#14532D]'
              }`}
            >
              {t('nav.brand_title')}
            </span>
            <span
              className={`hidden text-[11px] font-medium sm:block transition-colors duration-200 ${
                isOverHero ? 'text-emerald-300' : 'text-[#4B5E51]'
              }`}
            >
              {t('nav.brand_subtitle')}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links - Centered/Spaced, Never Compacted */}
        <nav
          className="hidden items-center gap-1.5 md:flex lg:gap-2.5"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Interactive Right Section: Language Toggle + CTA */}
        <div className="hidden items-center gap-4 md:flex">
          <LanguageToggle isOverHero={isOverHero} />
          <Link
            to="/detect"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              isOverHero
                ? 'bg-emerald-500 text-[#0c2918] font-bold shadow-lg shadow-emerald-950/40 hover:bg-emerald-400 hover:shadow-emerald-900/60 ring-1 ring-emerald-300/40'
                : 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800'
            }`}
          >
            <ScanSearch className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" aria-hidden="true" />
            <span>{t('nav.scan_leaf')}</span>
          </Link>
        </div>

        {/* Mobile Header Controls: Language Toggle + Hamburger Button */}
        <div className="flex items-center gap-2.5 md:hidden">
          <LanguageToggle isOverHero={isOverHero} />
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              isOverHero
                ? 'text-white hover:bg-white/15'
                : 'text-[#1C2A21] hover:bg-emerald-50'
            }`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t('nav.close_menu') : t('nav.open_menu')}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className={`border-t px-4 py-4 backdrop-blur-xl md:hidden ${
            isOverHero
              ? 'border-white/15 bg-[#0c2918]/95 text-white'
              : 'border-emerald-950/10 bg-white/95 text-[#1C2A21]'
          }`}
        >
          <nav className="flex flex-col gap-1.5" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={linkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/detect"
              onClick={() => setMobileMenuOpen(false)}
              className={`mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] ${
                isOverHero
                  ? 'bg-emerald-500 text-[#0c2918] font-bold shadow-md hover:bg-emerald-400'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              <ScanSearch className="h-4 w-4" aria-hidden="true" />
              <span>{t('nav.scan_leaf_now')}</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
