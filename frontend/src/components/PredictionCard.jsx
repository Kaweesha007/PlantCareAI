import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  Leaf,
  Microscope,
  ShieldAlert,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import { SEVERITY_BADGE_STYLES } from '../data/diseases';
import {
  translateCrop,
  translatePredictionResult,
} from '../utils/diseaseTranslator';
import TreatmentRecommendations from './TreatmentRecommendations';

function formatConfidencePercent(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return null;
  const percent = score <= 1 ? score * 100 : score;
  return Math.max(0, Math.min(100, percent));
}

function SectionList({ icon: Icon, title, items, emptyMessage, accentClass }) {
  return (
    <div className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentClass}`}>
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <h3 className="text-base font-semibold text-[#1C2A21]">{title}</h3>
      </div>

      {items && items.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {items.map((item, idx) => (
            <li
              key={`${title}-${idx}`}
              className="flex items-start gap-2.5 text-sm leading-relaxed text-[#4B5E51]"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-emerald-900/15 bg-[#F7FAF7] px-4 py-3 text-sm text-[#4B5E51]">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

export default function PredictionCard({ prediction, imagePreviewUrl, fileName }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'si' ? 'si' : 'en';

  const localizedPrediction = translatePredictionResult(prediction, currentLang);

  const hasPrediction = Boolean(localizedPrediction && localizedPrediction.diseaseName);
  const isUnsupported = Boolean(
    hasPrediction &&
      (localizedPrediction.status === 'unsupported' || localizedPrediction.isSupported === false)
  );
  const isUncertain = Boolean(
    hasPrediction && !isUnsupported && localizedPrediction.isUncertain
  );
  const confidencePercent = hasPrediction
    ? formatConfidencePercent(localizedPrediction.confidenceScore)
    : null;
  const thresholdPercent =
    hasPrediction && typeof localizedPrediction.confidenceThreshold === 'number'
      ? formatConfidencePercent(localizedPrediction.confidenceThreshold)
      : null;

  const severityStyle = isUnsupported
    ? 'border-rose-300 bg-rose-50 text-rose-800'
    : isUncertain
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : SEVERITY_BADGE_STYLES[prediction?.severity] ||
        'border-emerald-900/15 bg-[#EFF4EF] text-[#1C2A21]';

  const alternatives = Array.isArray(localizedPrediction?.topAlternatives)
    ? localizedPrediction.topAlternatives
    : [];

  return (
    <div className="space-y-6">
      {/* Unsupported Plant Species Alert */}
      {isUnsupported && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-950 shadow-xs"
        >
          <ShieldAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <p className="font-bold text-rose-900">
              {t('predictionCard.unsupported_alert_title')}
            </p>
            <p className="leading-relaxed text-rose-800">
              {currentLang === 'si'
                ? t('predictionCard.unsupported_alert_desc')
                : localizedPrediction.message ||
                  'Unsupported Plant. PlantCare AI currently supports Tomato, Potato and Bell Pepper only.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-semibold text-rose-900">
                {t('predictionCard.supported_crops_label')}
              </span>
              <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                ✓ {translateCrop('Tomato', currentLang)}
              </span>
              <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                ✓ {translateCrop('Potato', currentLang)}
              </span>
              <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                ✓ {translateCrop('Bell Pepper', currentLang)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Low-Confidence Uncertain Alert */}
      {isUncertain && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950 shadow-xs"
        >
          <HelpCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="font-bold">{t('predictionCard.uncertain_alert_title')}</p>
            <p className="leading-relaxed text-amber-900">
              {currentLang === 'si'
                ? t('predictionCard.uncertain_alert_desc')
                : localizedPrediction.message ||
                  'The model confidence did not reach the minimum confirmation threshold, so no confirmed disease diagnosis is claimed. Please upload a sharper, well-lit photo of a single leaf.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Analysis Card */}
      <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
        <div className="grid gap-6 p-6 md:grid-cols-[240px_1fr] md:items-center">
          <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-900/10 bg-[#F2F7F3] p-4">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt={fileName ? `Uploaded leaf: ${fileName}` : 'Uploaded leaf preview'}
                className="h-48 w-full rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-48 w-full flex-col items-center justify-center text-center text-[#4B5E51]">
                <Leaf className="mb-2 h-10 w-10 text-emerald-700/50" aria-hidden="true" />
                <span className="text-xs font-medium">
                  {t('predictionCard.no_leaf_attached')}
                </span>
              </div>
            )}
            {fileName && (
              <p className="mt-2.5 w-full truncate text-center text-xs text-[#4B5E51]">
                {fileName}
              </p>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isUnsupported
                      ? 'text-rose-700'
                      : isUncertain
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                  }`}
                >
                  {isUnsupported
                    ? t('predictionCard.gatekeeper_title')
                    : isUncertain
                      ? t('predictionCard.uncertain_title')
                      : t('predictionCard.detected_title')}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#1C2A21] sm:text-3xl">
                  {hasPrediction
                    ? localizedPrediction.diseaseName
                    : t('predictionCard.status_awaiting')}
                </h2>
                {hasPrediction && localizedPrediction.plantName && (
                  <p className="mt-1 text-sm font-medium text-[#4B5E51]">
                    {t('predictionCard.crop_label')}{' '}
                    <span className="font-semibold text-[#1C2A21]">
                      {localizedPrediction.plantName}
                    </span>
                  </p>
                )}
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  hasPrediction
                    ? severityStyle
                    : 'border-emerald-900/15 bg-[#EFF4EF] text-[#4B5E51]'
                }`}
              >
                {isUnsupported ? (
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>
                  {!hasPrediction
                    ? t('predictionCard.status_awaiting')
                    : isUnsupported
                      ? t('predictionCard.status_unsupported')
                      : isUncertain
                        ? t('predictionCard.status_uncertain')
                        : prediction.severity === 'None'
                          ? t('predictionCard.status_healthy')
                          : `${t('predictionCard.severity_prefix')} ${localizedPrediction.severity || t('predictionCard.status_confirmed')}`}
                </span>
              </span>
            </div>

            <div className="rounded-xl border border-emerald-900/10 bg-[#F7FAF7] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 font-semibold text-[#1C2A21]">
                  <Activity
                    className={`h-4 w-4 ${
                      isUnsupported
                        ? 'text-rose-600'
                        : isUncertain
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                    }`}
                    aria-hidden="true"
                  />
                  {isUnsupported
                    ? t('predictionCard.id_confidence')
                    : t('predictionCard.confidence_score')}
                </span>
                <span
                  className={`font-bold ${
                    isUnsupported
                      ? 'text-rose-800'
                      : isUncertain
                        ? 'text-amber-800'
                        : 'text-emerald-800'
                  }`}
                >
                  {confidencePercent !== null ? `${confidencePercent.toFixed(1)}%` : '—%'}
                </span>
              </div>

              <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-emerald-950/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isUnsupported
                      ? 'bg-rose-500'
                      : isUncertain
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                  }`}
                  style={{
                    width: `${confidencePercent !== null ? confidencePercent : 0}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-[#4B5E51]">
                {confidencePercent !== null
                  ? thresholdPercent !== null
                    ? isUnsupported
                      ? currentLang === 'si'
                        ? `ද්වාර පාලක හඳුනාගැනීම මඟින් මෙය සහාය නොදක්වන ශාකයක් ලෙස තහවුරු විය (විශ්වාසනීයතාව ${confidencePercent.toFixed(1)}%, සීමාව: ${thresholdPercent.toFixed(0)}%).`
                        : `Gatekeeper identification verified this sample as an unsupported plant (${confidencePercent.toFixed(1)}% confidence, threshold: ${thresholdPercent.toFixed(0)}%).`
                      : isUncertain
                        ? currentLang === 'si'
                          ? `විශ්වාසනීයතාව (${confidencePercent.toFixed(1)}%) තහවුරු කිරීමේ අවම සීමාව වන ${thresholdPercent.toFixed(0)}% ට වඩා අඩුය.`
                          : `Confidence (${confidencePercent.toFixed(1)}%) is below the ${thresholdPercent.toFixed(0)}% confirmation threshold.`
                        : currentLang === 'si'
                          ? `ආකෘතියේ ${thresholdPercent.toFixed(0)}% විශ්වාසනීයතා සීමාව ඉක්මවා තහවුරු විය.`
                          : `Confirmed above the ${thresholdPercent.toFixed(0)}% model confidence threshold.`
                    : t('predictionCard.conf_desc_default')
                  : currentLang === 'si'
                    ? 'පත්‍ර ඡායාරූපය විශ්ලේෂණය කළ පසු විශ්වාසනීයතා ලකුණ මෙහි දිස්වනු ඇත.'
                    : 'Confidence score will appear once a leaf image is analyzed by the backend.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Predictions (only for supported crops) */}
      {hasPrediction && !isUnsupported && alternatives.length > 0 && (
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BarChart3 className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-[#1C2A21]">
                  {isUncertain
                    ? t('predictionCard.alternatives_uncertain_title')
                    : t('predictionCard.alternatives_title')}
                </h3>
                <p className="text-xs text-[#4B5E51]">
                  {isUncertain
                    ? t('predictionCard.alternatives_uncertain_desc')
                    : t('predictionCard.alternatives_desc')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {alternatives.map((alt, index) => {
              const altPercent = formatConfidencePercent(alt.confidenceScore) ?? 0;
              return (
                <div
                  key={`${alt.classLabel || alt.diseaseName}-${index}`}
                  className="rounded-xl border border-emerald-900/10 bg-[#F7FAF7] p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">
                        {alt.plantName}
                      </p>
                      <p className="text-sm font-bold text-[#1C2A21]">
                        {alt.diseaseName}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-[#1C2A21] border border-emerald-900/10">
                      {altPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-950/10">
                    <div
                      className={`h-full rounded-full ${
                        isUncertain ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${altPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section Lists: Symptoms, Causes, Treatments */}
      <div className="grid gap-5 md:grid-cols-3">
        <SectionList
          icon={ClipboardList}
          title={
            isUnsupported
              ? t('predictionCard.screening_details_title')
              : t('predictionCard.symptoms_title')
          }
          items={localizedPrediction?.symptoms}
          accentClass={
            isUnsupported
              ? 'bg-rose-50 text-rose-700'
              : 'bg-amber-50 text-amber-700'
          }
          emptyMessage={
            isUnsupported
              ? t('predictionCard.empty_symptoms_unsupported')
              : isUncertain
                ? t('predictionCard.empty_symptoms_uncertain')
                : t('predictionCard.empty_symptoms_default')
          }
        />
        <SectionList
          icon={Microscope}
          title={
            isUnsupported
              ? t('predictionCard.screening_details_title')
              : isUncertain
                ? t('predictionCard.why_uncertain_title')
                : t('predictionCard.causes_title')
          }
          items={localizedPrediction?.causes}
          accentClass={
            isUnsupported
              ? 'bg-rose-50 text-rose-700'
              : 'bg-emerald-50 text-emerald-700'
          }
          emptyMessage={t('predictionCard.empty_causes_default')}
        />
        <SectionList
          icon={ShieldCheck}
          title={
            isUnsupported || isUncertain
              ? t('predictionCard.next_steps_title')
              : t('predictionCard.treatments_title')
          }
          items={localizedPrediction?.treatments}
          accentClass="bg-green-50 text-green-700"
          emptyMessage={t('predictionCard.empty_treatments_default')}
        />
      </div>

      {/* Prevention best practices only for supported plants */}
      {hasPrediction &&
        !isUnsupported &&
        localizedPrediction.prevention &&
        localizedPrediction.prevention.length > 0 && (
          <SectionList
            icon={Sprout}
            title={t('predictionCard.prevention_title')}
            items={localizedPrediction.prevention}
            accentClass="bg-emerald-50 text-emerald-800"
            emptyMessage=""
          />
        )}

      {/* Comprehensive Verified Agronomic Treatment Recommendations */}
      {hasPrediction && !isUnsupported && !isUncertain && (
        <TreatmentRecommendations
          prediction={prediction}
          classLabel={prediction.classLabel}
        />
      )}
    </div>
  );
}
