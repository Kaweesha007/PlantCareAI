import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Leaf,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Sprout,
  Upload,
} from 'lucide-react';
import { ACTIVE_PLANTS, PLANNED_PLANTS } from '../data/diseases';
import { translateCrop } from '../utils/diseaseTranslator';

export default function Home() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'si' ? 'si' : 'en';

  const howItWorksSteps = [
    {
      step: '01',
      icon: Upload,
      title: t('home.step_1_title'),
      description: t('home.step_1_desc'),
    },
    {
      step: '02',
      icon: ScanSearch,
      title: t('home.step_2_title'),
      description: t('home.step_2_desc'),
    },
    {
      step: '03',
      icon: ClipboardCheck,
      title: t('home.step_3_title'),
      description: t('home.step_3_desc'),
    },
  ];

  const introHighlights = [
    {
      icon: Sprout,
      title: t('home.highlight_early_title'),
      text: t('home.highlight_early_desc'),
    },
    {
      icon: ShieldCheck,
      title: t('home.highlight_care_title'),
      text: t('home.highlight_care_desc'),
    },
    {
      icon: BookOpen,
      title: t('home.highlight_ref_title'),
      text: t('home.highlight_ref_desc'),
    },
  ];

  return (
    <div>
      {/* Hero Section with Tomato Seedling Timelapse Video */}
      <section className="relative -mt-16 overflow-hidden bg-[#0c2918] text-white">
        {/* Background Video (Always Muted) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-cover object-center opacity-85 transition-opacity duration-700"
          >
            <source src="/videos/hero-seedling.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Gradient Overlays */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0c2918]/95 via-[#0c2918]/65 to-transparent sm:to-[#0c2918]/15"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0c2918]/80 via-transparent to-black/25"
            aria-hidden="true"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-14 lg:px-8 lg:pt-32 lg:pb-16">
          <div className="max-w-2xl space-y-5">
            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/75 px-3.5 py-1 text-xs font-semibold text-emerald-300 shadow-sm backdrop-blur-md">
              <Sprout className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>{t('home.badge_category')}</span>
              <span className="hidden h-1 w-1 rounded-full bg-emerald-400 sm:inline-block" />
              <span className="hidden text-emerald-200/80 sm:inline-block">
                {t('home.badge_span')}
              </span>
            </div>

            {/* Main Hero Title */}
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[46px] lg:leading-[1.15]">
              {t('home.hero_title_1')}{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-400 bg-clip-text text-transparent">
                {t('home.hero_title_highlight')}
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-sm leading-relaxed text-emerald-100/90 sm:text-base">
              {t('home.hero_subtitle')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Link
                to="/detect"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#0c2918] shadow-lg shadow-emerald-950/50 transition-all hover:bg-emerald-400 hover:shadow-emerald-900/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <ScanSearch className="h-4 w-4" aria-hidden="true" />
                <span>{t('home.btn_detect')}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/library"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-emerald-400/40 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <BookOpen className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                <span>{t('home.btn_library')}</span>
              </Link>
            </div>

            {/* Highlight Badges */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs font-medium text-emerald-200/90">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                {t('home.badge_formats')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                {t('home.badge_crops')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                {t('home.badge_model')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            {t('home.why_tag')}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1C2A21] sm:text-4xl">
            {t('home.why_title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#4B5E51]">
            {t('home.why_desc')}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {introHighlights.map(({ icon: HighlightIcon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <HighlightIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1C2A21]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4B5E51]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-y border-emerald-950/10 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                {t('home.hiw_tag')}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1C2A21]">
                {t('home.hiw_title')}
              </h2>
            </div>
            <Link
              to="/detect"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <span>{t('home.hiw_try_btn')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {howItWorksSteps.map(({ step, icon: StepIcon, title, description }) => (
              <div
                key={step}
                className="relative rounded-2xl border border-emerald-900/10 bg-[#F7FAF7] p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
                    <StepIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-900/15">{step}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#1C2A21]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4B5E51]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported & Planned Plants Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              {t('home.crops_tag')}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1C2A21]">
              {t('home.crops_title')}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4B5E51]">
              {t('home.crops_desc')}
            </p>
          </div>
          <Link
            to="/library"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-900/15 bg-white px-4 py-2 text-sm font-semibold text-[#1C2A21] hover:bg-emerald-50"
          >
            <span>{t('home.view_full_library')}</span>
            <ArrowRight className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          </Link>
        </div>

        {/* 1. Active AI-Trained Crops */}
        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-950/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-bold text-[#14532D]">
                {t('home.active_crops_title')}
              </h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                {t('home.active_crops_badge')}
              </span>
            </div>
            <p className="text-xs text-[#4B5E51]">
              {t('home.active_crops_desc')}
            </p>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ACTIVE_PLANTS.map((plant) => (
              <Link
                key={plant.name}
                to={`/library?plant=${encodeURIComponent(plant.name)}`}
                className="group flex flex-col justify-between rounded-2xl border border-emerald-700/25 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                      <Leaf className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-600/25 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      <Sparkles className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                      <span>{plant.statusLabel}</span>
                    </span>
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-[#1C2A21] group-hover:text-emerald-800">
                    {translateCrop(plant.name, currentLang)}
                  </h4>
                  <p className="text-xs italic text-[#4B5E51]">{plant.scientificName}</p>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#4B5E51]">
                    {plant.summary}
                  </p>
                </div>

                <div className="mt-4 border-t border-emerald-950/10 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {plant.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-emerald-700">
                    <span>
                      {plant.conditionsCount} {t('home.diagnostic_profiles')}
                    </span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {t('home.inspect_guide')}{' '}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 2. Planned Crop Additions (Roadmap) */}
        <div className="mt-12 rounded-3xl border border-amber-900/15 bg-gradient-to-b from-amber-50/40 via-[#F7FAF7] to-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <Clock className="h-4 w-4 text-amber-700" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-bold text-[#1C2A21]">
                {t('home.planned_crops_title')}
              </h3>
              <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {t('home.planned_crops_badge')}
              </span>
            </div>
            <p className="text-xs text-[#4B5E51]">
              {t('home.planned_crops_desc')}
            </p>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLANNED_PLANTS.map((plant) => (
              <Link
                key={plant.name}
                to={`/library?plant=${encodeURIComponent(plant.name)}`}
                className="group flex flex-col justify-between rounded-2xl border border-amber-900/15 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800 ring-1 ring-amber-300/40">
                      <Leaf className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      <Clock className="h-3 w-3 text-amber-600" aria-hidden="true" />
                      <span>{plant.statusLabel}</span>
                    </span>
                  </div>
                  <h4 className="mt-4 text-base font-bold text-[#1C2A21] group-hover:text-amber-900">
                    {translateCrop(plant.name, currentLang)}
                  </h4>
                  <p className="text-xs italic text-[#4B5E51]">{plant.scientificName}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[#4B5E51]">
                    {plant.summary}
                  </p>
                </div>

                <div className="mt-4 border-t border-emerald-950/10 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {plant.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-md bg-amber-50/80 px-2 py-0.5 text-[11px] font-medium text-amber-900"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-medium text-amber-800">
                    <span>{t('home.ref_guide_ready')}</span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {t('home.read_more')}{' '}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#14532D] px-6 py-10 text-white shadow-sm sm:px-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t('home.cta_ready_title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/90 sm:text-base">
              {t('home.cta_ready_desc')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/detect"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#14532D] shadow-xs transition-colors hover:bg-emerald-50"
            >
              <ScanSearch className="h-4 w-4" aria-hidden="true" />
              <span>{t('home.cta_btn_detect')}</span>
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-900/50 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
            >
              <span>{t('home.cta_btn_about')}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
