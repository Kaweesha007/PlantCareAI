import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FlaskConical,
  Info,
  Leaf,
  Microscope,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
} from 'lucide-react';
import { fetchTreatmentRecommendation } from '../services/predictionService';
import {
  translateCrop,
  translateTreatmentRecommendation,
} from '../utils/diseaseTranslator';

const ALL_SECTION_KEYS = [
  'overview',
  'symptoms',
  'immediate',
  'cultural',
  'biological',
  'chemical',
  'prevention',
  'sources',
];

function SectionCard({
  id,
  title,
  icon: Icon,
  badge,
  isExpanded,
  onToggle,
  children,
  headerClass = 'bg-[#F7FAF7]',
  accentClass = 'bg-emerald-50 text-emerald-800',
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-xs transition-all hover:border-emerald-900/20">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isExpanded}
        className={`flex w-full items-center justify-between gap-3 p-4 text-left transition-colors sm:p-5 ${headerClass}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentClass}`}
          >
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#1C2A21]">{title}</h3>
              {badge && (
                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-[#14532D] shadow-2xs border border-emerald-900/10">
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        <span className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-[#1C2A21] transition-transform shadow-2xs">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
      </button>

      {isExpanded && <div className="border-t border-emerald-900/10 p-5 sm:p-6">{children}</div>}
    </div>
  );
}

export default function TreatmentRecommendations({
  prediction,
  classLabel,
}) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'si' ? 'si' : 'en';

  const targetLabel = prediction?.classLabel || classLabel;
  const embeddedTreatment = prediction?.treatmentRecommendation || null;

  const [fetchState, setFetchState] = useState({
    loading: !embeddedTreatment && Boolean(targetLabel),
    error: null,
    data: null,
  });
  const [expandedSections, setExpandedSections] = useState(() => new Set(ALL_SECTION_KEYS));

  const rawTreatment = embeddedTreatment || fetchState.data;
  const treatment = translateTreatmentRecommendation(rawTreatment, currentLang);
  const loading = !embeddedTreatment && Boolean(targetLabel) && !fetchState.data && !fetchState.error;
  const error = fetchState.error;

  useEffect(() => {
    if (embeddedTreatment || !targetLabel) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    fetchTreatmentRecommendation(targetLabel, { signal: controller.signal })
      .then((data) => {
        if (isMounted) {
          setFetchState({ loading: false, error: null, data });
        }
      })
      .catch((err) => {
        if (isMounted && err.code !== 'ABORTED') {
          setFetchState({
            loading: false,
            error: err.message || 'Failed to load treatment recommendations.',
            data: null,
          });
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [embeddedTreatment, targetLabel]);

  const handleToggle = (key) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (expandedSections.size === ALL_SECTION_KEYS.length) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(ALL_SECTION_KEYS));
    }
  };

  // State 1: Loading
  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-900/10 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 animate-spin">
          <RefreshCw className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-base font-bold text-[#1C2A21]">
          {t('treatment.loading_title')}
        </h3>
        <p className="mt-1 text-xs text-[#4B5E51]">
          {t('treatment.loading_desc')}
        </p>
      </div>
    );
  }

  // State 2: Error
  if (error) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="space-y-2">
            <h3 className="text-base font-bold text-amber-950">
              {t('treatment.error_title')}
            </h3>
            <p className="text-sm text-amber-900 leading-relaxed">{error}</p>
            <p className="text-xs text-amber-800">
              {t('treatment.doa_hotline')}
            </p>
            {targetLabel && (
              <button
                type="button"
                onClick={() => {
                  setFetchState({ loading: true, error: null, data: null });
                  fetchTreatmentRecommendation(targetLabel)
                    .then((data) => setFetchState({ loading: false, error: null, data }))
                    .catch((err) =>
                      setFetchState({
                        loading: false,
                        error: err.message || 'Failed to load treatment recommendations.',
                        data: null,
                      })
                    );
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('treatment.retry')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // State 3: Empty
  if (!treatment) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-900/20 bg-white p-8 text-center shadow-xs">
        <Info className="mx-auto h-8 w-8 text-emerald-700/50" aria-hidden="true" />
        <h3 className="mt-3 text-base font-bold text-[#1C2A21]">
          {currentLang === 'si' ? 'ප්‍රතිකාර සැලැස්මක් තෝරා නැත' : 'No Treatment Plan Selected'}
        </h3>
        <p className="mt-1 text-xs text-[#4B5E51]">
          {currentLang === 'si'
            ? 'තහවුරු කළ ප්‍රතිකාර සැලසුම් බැලීමට කරුණාකර රෝග හඳුනාගැනීමේ පිටුවෙන් ශාක පත්‍ර ඡායාරූපයක් එක් කරන්න.'
            : 'Submit a supported plant leaf image on the disease detection page to view verified treatment plans.'}
        </p>
      </div>
    );
  }

  const isHealthy = treatment.condition_type === 'healthy';
  const chemicalStatus = treatment.chemical_control_options?.status;
  const activeChems = treatment.chemical_control_options?.active_ingredients || [];

  return (
    <section aria-labelledby="treatment-recommendations-heading" className="space-y-6 pt-4">
      {/* Header Banner */}
      <div className="overflow-hidden rounded-2xl border border-emerald-800/20 bg-gradient-to-br from-[#0F3920] to-[#14532D] p-6 text-white shadow-md">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-emerald-100 backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                {isHealthy
                  ? currentLang === 'si'
                    ? 'ශාක රැකවරණය සහ නඩත්තුව'
                    : 'Plant Care & Maintenance'
                  : currentLang === 'si'
                    ? 'කෘෂිකාර්මික ක්‍රියාකාරී සැලැස්ම'
                    : 'Agronomic Action Plan'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-800/80 px-2.5 py-1 text-xs font-medium text-emerald-100">
                {translateCrop(treatment.crop, currentLang)}
              </span>
              {treatment.pathogen_type && treatment.pathogen_type !== 'None' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-800/80 px-2.5 py-1 text-xs font-medium text-emerald-100">
                  {currentLang === 'si' && treatment.pathogen_type === 'Fungal'
                    ? 'දිලීර'
                    : currentLang === 'si' && treatment.pathogen_type === 'Bacterial'
                      ? 'බැක්ටීරියා'
                      : treatment.pathogen_type}
                </span>
              )}
            </div>

            <h2
              id="treatment-recommendations-heading"
              className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              {isHealthy
                ? currentLang === 'si'
                  ? 'සාමාන්‍ය ශාක රැකවරණ සහ නඩත්තු මාර්ගෝපදේශය'
                  : 'General Plant Care & Maintenance Guide'
                : `${treatment.disease_name} — ${currentLang === 'si' ? 'ප්‍රතිකාර සැලැස්ම' : 'Treatment Plan'}`}
            </h2>

            <p className="text-xs text-emerald-100/90 sm:text-sm leading-relaxed max-w-3xl">
              {currentLang === 'si' ? (
                <>
                  ශ්‍රී ලංකා <strong>කෘෂිකර්ම දෙපාර්තමේන්තුව (DOA)</strong> සහ{' '}
                  <strong>පළිබෝධනාශක රෙජිස්ට්‍රාර් කාර්යාලය (ROP)</strong> නිර්දේශයන්ට අනුකූලව
                  සකස් කරන ලද නිල කෘෂිකාර්මික උපදෙස් මාලාවකි.
                </>
              ) : (
                <>
                  Verified agricultural recommendations formulated for Sri Lanka in alignment with the{' '}
                  <strong>Department of Agriculture (DOA)</strong> and the{' '}
                  <strong>Office of the Registrar of Pesticides (ROP)</strong>.
                </>
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleToggleAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20"
            >
              {expandedSections.size === ALL_SECTION_KEYS.length
                ? t('treatment.collapse_all')
                : t('treatment.expand_all')}
            </button>
          </div>
        </div>
      </div>

      {/* Accordion / Expandable Section Stack */}
      <div className="space-y-4">
        {/* 1. Disease Overview */}
        <SectionCard
          id="overview"
          title={
            isHealthy
              ? currentLang === 'si'
                ? '1. ශාක සෞඛ්‍ය සහ මූලික හැඳින්වීම'
                : '1. Plant Health & Baseline Overview'
              : currentLang === 'si'
                ? '1. රෝගය සහ රෝග කාරකය පිළිබඳ හැඳින්වීම'
                : '1. Disease Pathology & Overview'
          }
          icon={BookOpen}
          badge={treatment.scientific_name}
          isExpanded={expandedSections.has('overview')}
          onToggle={handleToggle}
          accentClass="bg-blue-50 text-blue-800"
        >
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-[#1C2A21]">{treatment.short_description}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-[#F7FAF7] p-3 text-xs text-[#4B5E51]">
              <div>
                <span className="font-semibold text-[#1C2A21]">
                  {currentLang === 'si' ? 'බෝගය:' : 'Host Crop:'}
                </span>{' '}
                {translateCrop(treatment.crop, currentLang)} (
                <em>{treatment.scientific_crop_name}</em>)
              </div>
              <div>
                <span className="font-semibold text-[#1C2A21]">
                  {currentLang === 'si' ? 'විද්‍යාත්මක නාමය:' : 'Pathogen / Pest:'}
                </span>{' '}
                <em>{treatment.scientific_name}</em>
              </div>
              <div>
                <span className="font-semibold text-[#1C2A21]">
                  {currentLang === 'si' ? 'වර්ගීකරණය:' : 'Classification:'}
                </span>{' '}
                {currentLang === 'si' && treatment.pathogen_type === 'Fungal'
                  ? 'දිලීර (Fungal)'
                  : currentLang === 'si' && treatment.pathogen_type === 'Bacterial'
                    ? 'බැක්ටීරියා (Bacterial)'
                    : treatment.pathogen_type}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 2. Common Symptoms */}
        <SectionCard
          id="symptoms"
          title={
            isHealthy
              ? currentLang === 'si'
                ? '2. නිරෝගී පත්‍ර ලක්ෂණ'
                : '2. Vigorous Foliage Indicators'
              : currentLang === 'si'
                ? '2. ප්‍රධාන පත්‍ර රෝග ලක්ෂණ'
                : '2. Key Diagnostic Foliar Symptoms'
          }
          icon={Leaf}
          badge={
            currentLang === 'si'
              ? `ලක්ෂණ ${treatment.common_symptoms?.length || 0}ක්`
              : `${treatment.common_symptoms?.length || 0} Symptoms`
          }
          isExpanded={expandedSections.has('symptoms')}
          onToggle={handleToggle}
          accentClass="bg-amber-50 text-amber-800"
        >
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {treatment.common_symptoms?.map((sym, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-emerald-900/10 bg-[#F7FAF7] p-3.5 text-xs sm:text-sm text-[#1C2A21]"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span className="leading-relaxed">{sym}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* 3. Immediate Actions */}
        <SectionCard
          id="immediate"
          title={
            isHealthy
              ? currentLang === 'si'
                ? '3. ක්ෂණික බෝග නඩත්තු පියවර'
                : '3. Immediate Crop Maintenance Steps'
              : currentLang === 'si'
                ? '3. ක්ෂණික පාලන සහ ප්‍රතිකාර පියවර'
                : '3. Immediate Triage & Containment Actions'
          }
          icon={Clock}
          badge={currentLang === 'si' ? 'ප්‍රමුඛ පියවර' : 'Priority First Steps'}
          isExpanded={expandedSections.has('immediate')}
          onToggle={handleToggle}
          headerClass={isHealthy ? 'bg-emerald-50/60' : 'bg-amber-50/70'}
          accentClass={isHealthy ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}
        >
          <div className="space-y-3">
            <div
              className={`rounded-xl border p-4 ${
                isHealthy
                  ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                  : 'border-amber-200 bg-amber-50/40 text-amber-950'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider">
                {isHealthy
                  ? currentLang === 'si'
                    ? 'නිතිපතා නඩත්තු උපදෙස්'
                    : 'Routine Maintenance Protocol'
                  : currentLang === 'si'
                    ? 'ක්ෂණිකව ගත යුතු ක්ෂේත්‍ර ක්‍රියාමාර්ග'
                    : 'Take Immediate Field Action'}
              </p>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#4B5E51]">
                {isHealthy
                  ? currentLang === 'si'
                    ? 'උපරිම අස්වැන්නක් ලබා ගැනීමට සහ රෝග ප්‍රතිරෝධීතාව රැක ගැනීමට නිතිපතා නඩත්තු පියවර ක්‍රියාත්මක කරන්න.'
                    : 'Carry out routine canopy care to sustain optimal yield and preserve disease resistance.'
                  : currentLang === 'si'
                    ? 'රෝග කාරක බීජාණු සුළඟ හා ජල බිංදු මඟින් පැතිරීම වළක්වා ගැනීමට මෙම පියවර වහාම අනුගමනය කරන්න.'
                    : 'Execute these triage actions immediately to curb water-splash and airborne pathogen dispersal.'}
              </p>
            </div>

            <ul className="space-y-2.5">
              {treatment.immediate_actions?.map((act, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-emerald-900/10 bg-[#F7FAF7] p-3.5 text-xs sm:text-sm text-[#1C2A21]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* 4. Cultural Control */}
        <SectionCard
          id="cultural"
          title={
            isHealthy
              ? currentLang === 'si'
                ? '4. යහපත් කෘෂිකාර්මික පිළිවෙත් (SL-GAP)'
                : '4. Good Agricultural Practices (SL-GAP)'
              : currentLang === 'si'
                ? '4. ක්ෂේත්‍ර සහ වගා පිළිවෙත්'
                : '4. Cultural & Field Sanitation Practices'
          }
          icon={Sprout}
          isExpanded={expandedSections.has('cultural')}
          onToggle={handleToggle}
          accentClass="bg-emerald-50 text-emerald-800"
        >
          <ul className="space-y-2.5">
            {treatment.cultural_and_preventive_practices?.map((prac, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1C2A21] leading-relaxed"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>{prac}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* 5. Biological Control */}
        <SectionCard
          id="biological"
          title={
            currentLang === 'si'
              ? '5. ජෛව සහ පරිසර හිතකාමී පාලන ක්‍රම'
              : '5. Biological & Eco-Friendly Controls'
          }
          icon={Microscope}
          isExpanded={expandedSections.has('biological')}
          onToggle={handleToggle}
          accentClass="bg-teal-50 text-teal-800"
        >
          <div className="space-y-3">
            <ul className="space-y-2.5">
              {treatment.biological_control_options?.map((bio, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1C2A21] leading-relaxed"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
                    aria-hidden="true"
                  />
                  <span>{bio}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* 6. Chemical Control - Distinct Visually Distinguishable Card */}
        <SectionCard
          id="chemical"
          title={
            currentLang === 'si'
              ? '6. රසායනික කළමනාකරණය (ශ්‍රී ලංකා ROP ලියාපදිංචි)'
              : '6. Chemical Management (ROP Sri Lanka Verified)'
          }
          icon={FlaskConical}
          badge={
            chemicalStatus === 'officially_verified'
              ? currentLang === 'si'
                ? 'ROP ලියාපදිංචි සක්‍රීය ද්‍රව්‍ය'
                : 'Verified ROP Active Ingredients'
              : chemicalStatus === 'unavailable_no_chemical_cure' ||
                  chemicalStatus === 'no_chemical_recommended'
                ? currentLang === 'si'
                  ? 'රසායනික සුවයක් නැත'
                  : 'No Chemical Cure'
                : chemicalStatus === 'vector_control_only'
                  ? currentLang === 'si'
                    ? 'වාහක මර්දනයට පමණි'
                    : 'Vector Control Only'
                  : currentLang === 'si'
                    ? 'අදාළ නොවේ'
                    : 'Not Applicable'
          }
          isExpanded={expandedSections.has('chemical')}
          onToggle={handleToggle}
          headerClass={
            chemicalStatus === 'officially_verified' || chemicalStatus === 'vector_control_only'
              ? 'bg-purple-50/70 border-b border-purple-100'
              : chemicalStatus === 'unavailable_no_chemical_cure' ||
                  chemicalStatus === 'no_chemical_recommended'
                ? 'bg-amber-50/80 border-b border-amber-200'
                : 'bg-emerald-50/50'
          }
          accentClass={
            chemicalStatus === 'officially_verified' || chemicalStatus === 'vector_control_only'
              ? 'bg-purple-100 text-purple-900'
              : chemicalStatus === 'unavailable_no_chemical_cure' ||
                  chemicalStatus === 'no_chemical_recommended'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-emerald-900'
          }
        >
          <div className="space-y-4">
            {/* Condition A: Officially Verified Chemical Recommendations */}
            {(chemicalStatus === 'officially_verified' || chemicalStatus === 'vector_control_only') &&
              activeChems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-900 border border-purple-200">
                    <ShieldCheck className="h-4 w-4 text-purple-700" aria-hidden="true" />
                    <span>
                      {currentLang === 'si'
                        ? 'පහත සක්‍රීය ද්‍රව්‍ය ශ්‍රී ලංකා පළිබෝධනාශක රෙජිස්ට්‍රාර් කාර්යාලයේ (ROP) නිල වශයෙන් ලියාපදිංචි කර ඇත:'
                        : 'The following active ingredients are registered by the Office of the Registrar of Pesticides (ROP), Sri Lanka:'}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeChems.map((chem, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-purple-200 bg-white p-4 shadow-2xs hover:border-purple-300"
                      >
                        <p className="text-sm font-bold text-[#1C2A21]">{chem.name}</p>
                        <p className="mt-1 text-xs font-medium text-purple-800">{chem.type}</p>
                        <div className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-900">
                          <CheckCircle2 className="h-3 w-3 text-purple-700" />
                          <span>{chem.rop_status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Application Notes */}
                  {treatment.chemical_control_options?.application_notes && (
                    <div className="rounded-xl bg-[#F7FAF7] p-4 text-xs sm:text-sm text-[#1C2A21] leading-relaxed border border-emerald-900/10">
                      <p className="font-bold text-[#1C2A21] mb-1">
                        {currentLang === 'si'
                          ? 'නිල ක්ෂේත්‍ර යෙදුම් මාර්ගෝපදේශය:'
                          : 'Official Application Guidelines:'}
                      </p>
                      <p>{treatment.chemical_control_options.application_notes}</p>
                    </div>
                  )}

                  {/* Mandatory Safety Alert */}
                  <div className="rounded-xl border border-red-300 bg-red-50/60 p-4 text-xs sm:text-sm text-red-950">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
                      <div className="space-y-1">
                        <p className="font-bold text-red-900">
                          {currentLang === 'si'
                            ? 'පළිබෝධනාශක ආරක්ෂාව සහ අස්වනු නෙළීමට පෙර ආරක්ෂිත කාලය (PHI)'
                            : 'Pesticide Safety & Pre-Harvest Intervals (PHI)'}
                        </p>
                        <p className="text-xs text-red-900 leading-relaxed">
                          {currentLang === 'si'
                            ? 'සැමවිටම සම්පූර්ණ පුද්ගලික ආරක්ෂක උපකරණ (PPE - අත්වැසුම්, මුහුණු ආවරණ, බූට්) පළඳින්න. පළිබෝධනාශක ලේබලයේ සඳහන් තනුක කිරීමේ අනුපාත සහ අස්වනු නෙළීමට පෙර දින ගණන (PHI) තදින්ම පිළිපදින්න. දහවල් දැඩි හිරු රශ්මිය ඇති වේලාවන්හි හෝ වැසි ඇතිවීමට ආසන්න විට රසායන නොඉසින්න.'
                            : 'Always wear complete Personal Protective Equipment (gloves, mask, boots). Comply strictly with dilution rates and observation of pre-harvest intervals (PHI) specified on the registered product container. Never apply chemicals during high mid-day sunshine or prior to forecast rain.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Condition B: Viral Infections (No Chemical Cure Available) */}
            {(chemicalStatus === 'unavailable_no_chemical_cure' ||
              chemicalStatus === 'no_chemical_recommended') && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold">
                      {currentLang === 'si'
                        ? 'ශාක වෛරස් රෝග සඳහා කිසිදු සෘජු රසායනික සුවයක් නොමැත'
                        : 'No Chemical Cure Available for Plant Viral Diseases'}
                    </h4>
                    <p className="text-xs sm:text-sm leading-relaxed text-amber-900">
                      {treatment.chemical_control_options?.application_notes ||
                        (currentLang === 'si'
                          ? 'ශාක පටක තුළ ඇති වෛරස් සඳහා දිලීර නාශක හෝ බැක්ටීරියා නාශක මඟින් සුවයක් ලබා දිය නොහැක. ආසාදිත පැළ මුලින් උගුල්ලා විනාශ කිරීම, උපකරණ විෂබීජහරණය සහ ප්‍රතිරෝධී ප්‍රභේද වගා කිරීම එකම විසඳුමයි.'
                          : 'Chemical fungicides, bactericides, and antibiotics have no curative effect on viral infections inside plant tissue. Rogueing infected plants and planting certified virus-resistant seeds are the only effective management strategies.')}
                    </p>
                    <p className="text-xs font-semibold text-amber-800">
                      {currentLang === 'si'
                        ? 'උපදෙස්: වෛරස් මර්දනය සහ වාහක පාලනය පිළිබඳ නිවැරදි උපදෙස් ලබා ගැනීමට ඔබේ ප්‍රාදේශීය කෘෂිකර්ම උපදේශක (AI) මහතා හෝ ගොවිජන සේවා මධ්‍යස්ථානය අමතන්න (ක්ෂණික දුරකථන අංකය: 1920).'
                        : 'Advice: Consult your local Agricultural Instructor (AI) at the nearest Agrarian Services Centre for viral sanitation and vector containment protocols (Hotline: 1920).'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Condition C: Healthy Foliage (Chemicals Not Applicable) */}
            {chemicalStatus === 'not_applicable' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-[#14532D]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold">
                      {currentLang === 'si'
                        ? 'නිරෝගී බෝග සඳහා කිසිදු රසායනික ප්‍රතිකාරයක් අවශ්‍ය නොවේ'
                        : 'No Chemical Treatment Required on Healthy Crops'}
                    </h4>
                    <p className="text-xs text-[#4B5E51] leading-relaxed">
                      {treatment.chemical_control_options?.application_notes ||
                        (currentLang === 'si'
                          ? 'ස්වභාවික විලෝපිකයන් ආරක්ෂා කිරීමට සහ අනවශ්‍ය රසායන අවශේෂ පරිසරයට එක්වීම වැළැක්වීමට නිරෝගී බෝග මත රසායන නොඉසින ලෙස කෘෂිකර්ම දෙපාර්තමේන්තුව තරයේ උපදෙස් දෙයි.'
                          : 'Prophylactic chemical spraying on symptom-free crops is discouraged by the Department of Agriculture Sri Lanka to protect natural beneficial predators and avoid unnecessary chemical residues.')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Authority Guidance */}
            {treatment.chemical_control_options?.authority_guidance && (
              <p className="text-xs text-[#4B5E51] italic border-t border-emerald-900/10 pt-2">
                {currentLang === 'si' ? 'නිල කෘෂි උපදෙස්:' : 'Authority note:'}{' '}
                {treatment.chemical_control_options.authority_guidance}
              </p>
            )}
          </div>
        </SectionCard>

        {/* 7. Prevention Tips */}
        <SectionCard
          id="prevention"
          title={
            currentLang === 'si'
              ? '7. දිගුකාලීන කෘෂිකාර්මික වැළැක්වීමේ උපදෙස්'
              : '7. Long-Term Agronomic Prevention Tips'
          }
          icon={ShieldCheck}
          isExpanded={expandedSections.has('prevention')}
          onToggle={handleToggle}
          accentClass="bg-emerald-50 text-emerald-800"
        >
          <ul className="space-y-2.5">
            {treatment.prevention_tips?.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1C2A21] leading-relaxed"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* 8. References and Sources */}
        <SectionCard
          id="sources"
          title={
            currentLang === 'si'
              ? '8. තොරතුරු මූලාශ්‍ර සහ සහතික කළ ලේඛන'
              : '8. Information Sources & Verification Credentials'
          }
          icon={ExternalLink}
          badge={
            currentLang === 'si'
              ? `මූලාශ්‍ර ${treatment.reliable_information_sources?.length || 0}ක්`
              : `${treatment.reliable_information_sources?.length || 0} Sources`
          }
          isExpanded={expandedSections.has('sources')}
          onToggle={handleToggle}
          accentClass="bg-blue-50 text-blue-800"
        >
          <div className="space-y-3">
            <p className="text-xs text-[#4B5E51]">
              {currentLang === 'si'
                ? 'මෙම නිර්දේශයන් ශ්‍රී ලංකා කෘෂිකර්ම බලධාරීන්ගේ නිල ප්‍රකාශන හා උපදේශන ද්වාරයන්ගෙන් උපුටා ගෙන තහවුරු කර ඇත:'
                : 'Recommendations are documented from published manuals and advisory portals of the Sri Lankan agricultural authorities:'}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {treatment.reliable_information_sources?.map((src, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-xl border border-emerald-900/10 bg-[#F7FAF7] p-4 text-xs shadow-2xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-[#1C2A21] text-xs sm:text-sm">{src.title}</p>
                    <p className="text-emerald-800 font-medium">{src.institution}</p>
                    <p className="text-[#4B5E51]">
                      {currentLang === 'si' ? 'තහවුරු කළ දිනය:' : 'Verified on:'} {src.verification_date}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-emerald-900/10">
                    {src.url?.startsWith('tel:') ? (
                      <a
                        href={src.url}
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>
                          {currentLang === 'si'
                            ? `1920 ක්ෂණික දුරකථන අංකය අමතන්න`
                            : `Dial Hotline ${src.url.replace('tel:', '')}`}
                        </span>
                      </a>
                    ) : (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        <span>
                          {currentLang === 'si' ? 'නිල ද්වාරයට පිවිසෙන්න' : 'Visit Official Portal'}
                        </span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
