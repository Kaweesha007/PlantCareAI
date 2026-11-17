import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Info,
  ScanSearch,
} from 'lucide-react';
import PredictionCard from '../components/PredictionCard';

export default function Results() {
  const { t } = useTranslation();
  const location = useLocation();
  const state = location.state || {};
  const prediction = state.prediction || null;
  const imagePreviewUrl = state.imagePreviewUrl || null;
  const fileName = state.fileName || null;
  const analyzedAt = state.analyzedAt || null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Link
            to="/detect"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('results.back_to_detect')}</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#14532D] sm:text-4xl">
            {t('results.title')}
          </h1>
          <p className="max-w-2xl text-sm text-[#4B5E51] sm:text-base">
            {t('results.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/detect"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-emerald-800"
          >
            <ScanSearch className="h-4 w-4" aria-hidden="true" />
            <span>{t('results.scan_another')}</span>
          </Link>
          <Link
            to="/library"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-900/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#1C2A21] transition-colors hover:bg-emerald-50"
          >
            <BookOpen className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <span>{t('results.disease_library')}</span>
          </Link>
        </div>
      </div>

      {analyzedAt && prediction && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#4B5E51]">
          <CalendarClock className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
          <span>
            {t('results.analyzed_at')} {new Date(analyzedAt).toLocaleString()}
          </span>
        </div>
      )}

      {!prediction && (
        <div
          role="status"
          className="mb-8 flex items-start gap-3 rounded-2xl border border-emerald-700/20 bg-emerald-50/70 p-5 text-sm text-[#14532D]"
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">{t('results.no_prediction_title')}</p>
            <p className="leading-relaxed text-[#4B5E51]">
              {t('results.no_prediction_desc')}{' '}
              <Link to="/detect" className="font-semibold text-emerald-800 underline">
                {t('nav.detect')}
              </Link>
            </p>
          </div>
        </div>
      )}

      <PredictionCard
        prediction={prediction}
        imagePreviewUrl={imagePreviewUrl}
        fileName={fileName}
      />
    </div>
  );
}
