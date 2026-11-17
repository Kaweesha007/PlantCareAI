import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
  Leaf,
  Microscope,
  RotateCcw,
  ScanSearch,
  Search,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import {
  DISEASE_CATEGORIES,
  DISEASES,
  SEVERITY_BADGE_STYLES,
  SUPPORTED_PLANTS,
} from '../data/diseases';
import {
  translateCrop,
  translateDiseaseName,
  translateSeverity,
} from '../utils/diseaseTranslator';

const DISEASE_ID_TO_LABEL_MAP = {
  'tomato-early-blight': 'Tomato_Early_blight',
  'tomato-late-blight': 'Tomato_Late_blight',
  'tomato-healthy': 'Tomato_healthy',
  'potato-late-blight': 'Potato___Late_blight',
  'potato-early-blight': 'Potato___Early_blight',
  'pepper-bacterial-spot': 'Pepper__bell___Bacterial_spot',
};

const SI_LIBRARY_ADDITIONS = {
  'apple-scab': {
    diseaseName: 'ඇපල් කොරපොතු රෝගය (Apple Scab)',
    summary: 'වසන්තයේ මුල් කාලයේ පත්‍ර මත ඔලිව් කොළ පැහැති වෙල්වට් ලප ඇතිකර පසුව පත්‍ර විකෘති කර අකාලයේ හෙළන දිලීර රෝගයකි.',
    symptoms: [
      'පත්‍රවල උඩ සහ යටි මතුපිට ඔලිව්-කොළ සිට තද දුඹුරු දක්වා වෙල්වට් ලප හටගැනීම.',
      'පත්‍ර රැලි වැටීම, ඇඹරීම සහ දැඩි ආසාදනවලදී අකාලයේ හැලී යාම.',
      'වර්ධනය වන ඇපල් ගෙඩි මත කොරපොතු වැනි තුවාල ඇතිවීම.',
    ],
    causes: [
      'බිම වැටී ඇති පැරණි පත්‍රවලින් වසන්ත වැසි සමඟ දිලීර බීජාණු මුදාහැරීම.',
      'සිසිල් හා තෙත් වසන්ත කාලගුණය.',
    ],
    treatments: [
      'ජීවන චක්‍රය බිඳ දැමීම සඳහා වැටී ඇති පත්‍ර එකතු කර විනාශ කිරීම.',
      'වසන්තයේ පොහොට්ටු පිපෙන කාලයේදී නිර්දේශිත දිලීර නාශක යෙදීම.',
    ],
    prevention: ['රෝගයට ඔරොත්තු දෙන ඇපල් ප්‍රභේද වගා කිරීම.'],
  },
  'apple-black-rot': {
    diseaseName: 'ඇපල් කළු කුණුවීම (Apple Black Rot)',
    summary: 'පත්‍ර මත මැඩි ඇසක් වැනි ලප (Frogeye leaf spot), ගෙඩි කුණුවීම සහ අතු පිළිකා ඇතිකරන දිලීර රෝගයකි.',
    symptoms: [
      'දම් පැහැති දාරයක් සහ දුඹුරු මධ්‍යස්ථානයක් සහිත වෘත්තාකාර ලප (මැඩි ඇසක් වැනි රටාව).',
      'දැඩි ආසාදිත පත්‍ර කහ වී අකාලයේ හැලී යාම.',
    ],
    causes: [
      'වියළී ගිය ගෙඩි සහ මැරුණු අතුවල දිලීර බීජාණු රැඳී පැවතීම.',
      'උණුසුම් හා ආර්ද්‍රතාවය අධික කාලගුණය.',
    ],
    treatments: [
      'මැරුණු අතු, පිළිකා තුවාල සහ වියළි ගෙඩි කපා ඉවත් කර විනාශ කිරීම.',
      'මල් පෙති හැලෙන අවධියේ සිට සුදුසු ආරක්ෂක දිලීර නාශක යෙදීම.',
    ],
    prevention: ['වගාව අවට ඇති කැළෑ ධාරක ශාක ඉවත් කිරීම.'],
  },
  'corn-northern-leaf-blight': {
    diseaseName: 'බඩඉරිඟු උතුරු පත්‍ර අංගමාරය',
    summary: 'බඩඉරිඟු පත්‍ර මත දිගටි සුරුට්ටු හැඩැති විශාල අළු-දුඹුරු ලප ඇතිකරමින් ප්‍රභාසංස්ලේෂණය අඩාල කරන ප්‍රධාන දිලීර රෝගයකි.',
    symptoms: [
      'පත්‍ර නහරවලට සමාන්තරව විහිදෙන දිගටි, අළු-කොළ හෝ දුඹුරු සුරුට්ටු හැඩැති ලප (සෙ.මී. 2.5–15).',
      'ලප එකිනෙක එකතු වී මුළු පත්‍රයම වියළී යාම.',
    ],
    causes: [
      'පෙර කන්නයේ බඩඉරිඟු සුන්බුන්වල දිලීරය නොනැසී පැවතීම.',
      'මධ්‍යස්ථ උෂ්ණත්වය (18°C–27°C) සහ අධික පිනි හෝ නිරන්තර වර්ෂාව.',
    ],
    treatments: [
      'ආසාදිත මට්ටම ආර්ථික හානි මට්ටම ඉක්මවා යන්නේ නම් නිර්දේශිත පත්‍ර දිලීර නාශක යෙදීම.',
    ],
    prevention: ['ප්‍රතිරෝධී බඩඉරිඟු ප්‍රභේද වගා කිරීම සහ බෝග මාරුව.'],
  },
  'corn-common-rust': {
    diseaseName: 'බඩඉරිඟු සාමාන්‍ය මලකඩ රෝගය',
    summary: 'සුළඟ මඟින් බෝවන, පත්‍ර දෙපසම ගඩොල් රතු පැහැති මලකඩ බිබිලි ඇතිකරන දිලීර ආසාදනයකි.',
    symptoms: [
      'පත්‍රවල උඩ සහ යටි මතුපිට කුඩා ඉලිප්සාකාර කුරුඳු-දුඹුරු පැහැති මලකඩ බිබිලි හටගැනීම.',
      'ඇඟිල්ලෙන් ස්පර්ශ කළ විට කුඩු වැනි මලකඩ බීජාණු තැවරීම.',
    ],
    causes: [
      'සුළඟ මඟින් දිලීර බීජාණු ක්ෂේත්‍රයට ගසාගෙන ඒම.',
      'සිසිල් උෂ්ණත්වය (16°C–23°C) සහ අධික ආර්ද්‍රතාවය.',
    ],
    treatments: [
      'නූතන බොහෝ ප්‍රභේද සඳහා ඉසීම් අවශ්‍ය නොවේ; ආසාදනය උග්‍ර වුවහොත් පමණක් දිලීර නාශක යෙදීම.',
    ],
    prevention: ['මලකඩ රෝගයට ප්‍රතිරෝධී දෙමුහුන් බඩඉරිඟු ප්‍රභේද සිටුවීම.'],
  },
  'grape-black-rot': {
    diseaseName: 'මිදි කළු කුණුවීම (Grape Black Rot)',
    summary: 'පත්‍ර මත රතු-දුඹුරු ලප ඇතිකරමින් මිදි පොකුරු හැකිලී කළු පැහැති දැඩි වියළි ගෙඩි බවට පත් කරන විනාශකාරී දිලීරයකි.',
    symptoms: [
      'තද දුඹුරු දාරයක් සහිත රතු-දුඹුරු පැහැති වෘත්තාකාර පත්‍ර ලප.',
      'ලප තුළ කුඩා කළු තිත් වළලු ආකාරයෙන් දැකගත හැකි වීම.',
    ],
    causes: [
      'පරණ වියළී ගිය මිදි ගෙඩි සහ වැල් කොටස්වල දිලීර බීජාණු ශීත කාලය පසුකර පැවතීම.',
      'වසන්ත වැසි සහ උණුසුම් කාලගුණය.',
    ],
    treatments: [
      'කප්පාදු කිරීමේදී සියලුම වියළි ගෙඩි සහ ආසාදිත වැල් කොටස් ඉවත් කිරීම.',
      'නව දළු මෝදු වන අවධියේ සිට ආරක්ෂක දිලීර නාශක යෙදීම.',
    ],
    prevention: ['හිරු එළිය සහ වාතය හොඳින් ලැබෙන සේ වැල් පුහුණු කිරීම.'],
  },
  'rice-brown-spot': {
    diseaseName: 'ගොයමේ දුඹුරු ලප රෝගය',
    summary: 'පෝෂණ ඌනතා හෝ ජල හිඟය සහිත කුඹුරුවල ගොයම් පත්‍ර මත දුඹුරු ලප ඇතිකරමින් ධාන්‍ය බර අඩු කරන දිලීර රෝගයකි.',
    symptoms: [
      'ලා අළු කේන්ද්‍රයක් සහ කහ රැස් වළල්ලක් සහිත ඉලිප්සාකාර හෝ වෘත්තාකාර තද දුඹුරු ලප.',
      'පත්‍ර මත ලප එකතු වී ධජ පත්‍රය වියළී යාම.',
    ],
    causes: [
      'පොටෑසියම්, සිලිකන් හෝ නයිට්‍රජන් ඌනතාවය නිසා ශාක පටක දුර්වල වීම.',
      'ආසාදිත බීජ සහ අධික ආර්ද්‍රතාවය.',
    ],
    treatments: [
      'සමබර පොහොර යෙදීම (විශේෂයෙන් පොටෑසියම්) මඟින් පසෙහි පෝෂණ ඌනතා නිවැරදි කිරීම.',
      'ධජ පත්‍ර දැඩි ලෙස ආසාදනය වන්නේ නම් නිර්දේශිත දිලීර නාශක යෙදීම.',
    ],
    prevention: ['බීජ ප්‍රතිකාර කිරීම සහ නිසි ජල කළමනාකරණය.'],
  },
};

export default function DiseaseLibrary() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'si' ? 'si' : 'en';

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedIds, setExpandedIds] = useState(() => new Set([DISEASES[0]?.id]));

  const plantOptions = useMemo(
    () => ['All', ...SUPPORTED_PLANTS.map((plant) => plant.name)],
    []
  );

  const requestedPlant = searchParams.get('plant');
  const selectedPlant =
    requestedPlant && plantOptions.includes(requestedPlant) ? requestedPlant : 'All';

  const filteredDiseases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return DISEASES.filter((item) => {
      const matchesPlant =
        selectedPlant === 'All' || item.plant === selectedPlant;
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      if (!matchesPlant || !matchesCategory) return false;
      if (!query) return true;

      const searchableText = [
        item.diseaseName,
        item.plant,
        item.scientificName,
        item.summary,
        ...item.symptoms,
        ...item.causes,
        ...item.treatments,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [searchQuery, selectedPlant, selectedCategory]);

  const handlePlantChange = (plantName) => {
    if (plantName === 'All') {
      searchParams.delete('plant');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ plant: plantName }, { replace: true });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    searchParams.delete('plant');
    setSearchParams(searchParams, { replace: true });
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getLocalizedDisease = (disease) => {
    if (currentLang !== 'si') return disease;

    const classLabel = DISEASE_ID_TO_LABEL_MAP[disease.id];
    if (classLabel) {
      const siName = translateDiseaseName(classLabel, disease.diseaseName, 'si');
      return {
        ...disease,
        plant: translateCrop(disease.plant, 'si'),
        diseaseName: siName,
      };
    }

    const customSi = SI_LIBRARY_ADDITIONS[disease.id];
    if (customSi) {
      return {
        ...disease,
        plant: translateCrop(disease.plant, 'si'),
        diseaseName: customSi.diseaseName,
        summary: customSi.summary || disease.summary,
        symptoms: customSi.symptoms || disease.symptoms,
        causes: customSi.causes || disease.causes,
        treatments: customSi.treatments || disease.treatments,
        prevention: customSi.prevention || disease.prevention,
      };
    }

    return {
      ...disease,
      plant: translateCrop(disease.plant, 'si'),
    };
  };

  const categoryLabels = {
    All: currentLang === 'si' ? 'සියල්ල' : 'All',
    Fungal: currentLang === 'si' ? 'දිලීර' : 'Fungal',
    Bacterial: currentLang === 'si' ? 'බැක්ටීරියා' : 'Bacterial',
    Healthy: currentLang === 'si' ? 'නිරෝගී' : 'Healthy',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('library.tag')}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#14532D] sm:text-4xl">
            {t('library.title')}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#4B5E51] sm:text-base">
            {t('library.subtitle')}
          </p>
        </div>

        <Link
          to="/detect"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-emerald-800 md:self-auto"
        >
          <ScanSearch className="h-4 w-4" aria-hidden="true" />
          <span>{t('nav.scan_leaf')}</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-xs">
        <div className="grid gap-4 md:grid-cols-12">
          <div className="relative md:col-span-6">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#4B5E51]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentLang === 'si'
                  ? 'රෝගය, බෝගය, ලක්ෂණය හෝ රෝග කාරකය අනුව සොයන්න...'
                  : 'Search by disease, crop, symptom, or pathogen...'
              }
              aria-label="Search diseases"
              className="w-full rounded-xl border border-emerald-900/15 bg-[#F7FAF7] py-2.5 pr-4 pl-10 text-sm text-[#1C2A21] placeholder:text-[#4B5E51]/70 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="plant-filter" className="sr-only">
              Filter by crop
            </label>
            <select
              id="plant-filter"
              value={selectedPlant}
              onChange={(e) => handlePlantChange(e.target.value)}
              className="w-full rounded-xl border border-emerald-900/15 bg-[#F7FAF7] px-3.5 py-2.5 text-sm font-medium text-[#1C2A21] focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            >
              {plantOptions.map((plant) => (
                <option key={plant} value={plant}>
                  {plant === 'All'
                    ? currentLang === 'si'
                      ? 'සියලුම බෝග'
                      : 'All Supported Plants'
                    : translateCrop(plant, currentLang)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 md:col-span-3 md:justify-end">
            <span className="text-xs font-medium text-[#4B5E51]">
              {currentLang === 'si' ? (
                <>
                  පෙන්වන්නේ <strong className="text-[#1C2A21]">{filteredDiseases.length}</strong> න්{' '}
                  {DISEASES.length} කි
                </>
              ) : (
                <>
                  Showing <strong className="text-[#1C2A21]">{filteredDiseases.length}</strong> of{' '}
                  {DISEASES.length}
                </>
              )}
            </span>
            {(searchQuery || selectedPlant !== 'All' || selectedCategory !== 'All') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-900/15 px-3 py-2 text-xs font-semibold text-[#1C2A21] hover:bg-emerald-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{currentLang === 'si' ? 'පෙරහන් ඉවත් කරන්න' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-emerald-950/10 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5E51]">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('library.filter_category')}</span>
          </span>
          {DISEASE_CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#EFF4EF] text-[#1C2A21] hover:bg-emerald-100'
                }`}
              >
                {categoryLabels[category] || category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results List */}
      {filteredDiseases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-900/20 bg-white px-6 py-14 text-center">
          <Leaf className="mx-auto h-10 w-10 text-emerald-700/40" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-[#1C2A21]">
            {t('library.no_results_title')}
          </h2>
          <p className="mt-1 text-sm text-[#4B5E51]">
            {t('library.no_results_desc')}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('library.reset_filters')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDiseases.map((rawDisease) => {
            const disease = getLocalizedDisease(rawDisease);
            const isExpanded = expandedIds.has(disease.id);
            const severityBadge =
              SEVERITY_BADGE_STYLES[disease.severity] ||
              'border-emerald-900/15 bg-[#EFF4EF] text-[#1C2A21]';

            return (
              <article
                key={disease.id}
                className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          {disease.plant}
                        </span>
                        <span className="rounded-full bg-[#EFF4EF] px-2.5 py-0.5 text-xs font-medium text-[#1C2A21]">
                          {categoryLabels[disease.category] || disease.category}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${severityBadge}`}
                        >
                          {disease.severity === 'None'
                            ? currentLang === 'si'
                              ? 'නිරෝගී මට්ටම'
                              : 'Healthy Baseline'
                            : `${currentLang === 'si' ? 'අවදානම: ' : 'Severity: '}${translateSeverity(disease.severity, currentLang)}`}
                        </span>
                      </div>

                      <h2 className="text-xl font-bold text-[#1C2A21]">
                        {disease.diseaseName}
                      </h2>
                      <p className="text-xs italic text-[#4B5E51]">
                        {currentLang === 'si' ? 'විද්‍යාත්මක නාමය:' : 'Pathogen / Species:'}{' '}
                        {disease.scientificName}
                      </p>
                      <p className="pt-1 text-sm leading-relaxed text-[#4B5E51]">
                        {disease.summary}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(disease.id)}
                      aria-expanded={isExpanded}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-900/15 bg-[#F7FAF7] px-3.5 py-2 text-xs font-semibold text-[#1C2A21] transition-colors hover:bg-emerald-50"
                    >
                      <span>
                        {isExpanded
                          ? currentLang === 'si'
                            ? 'මාර්ගෝපදේශය සඟවන්න'
                            : 'Hide Care Guide'
                          : currentLang === 'si'
                            ? 'මාර්ගෝපදේශය බලන්න'
                            : 'View Care Guide'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 grid gap-5 border-t border-emerald-950/10 pt-5 md:grid-cols-3">
                      <div className="rounded-xl bg-[#F7FAF7] p-4">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[#1C2A21]">
                          <Leaf className="h-4 w-4 text-amber-700" aria-hidden="true" />
                          <span>{t('predictionCard.symptoms_title')}</span>
                        </h3>
                        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#4B5E51]">
                          {disease.symptoms.map((sym, i) => (
                            <li key={i}>• {sym}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl bg-[#F7FAF7] p-4">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[#1C2A21]">
                          <Microscope
                            className="h-4 w-4 text-emerald-700"
                            aria-hidden="true"
                          />
                          <span>{t('predictionCard.causes_title')}</span>
                        </h3>
                        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#4B5E51]">
                          {disease.causes.map((cause, i) => (
                            <li key={i}>• {cause}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl bg-emerald-50/70 p-4">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[#14532D]">
                          <ShieldCheck
                            className="h-4 w-4 text-emerald-700"
                            aria-hidden="true"
                          />
                          <span>
                            {currentLang === 'si'
                              ? 'ප්‍රතිකාර සහ කළමනාකරණය'
                              : 'Treatment & Prevention'}
                          </span>
                        </h3>
                        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#1C2A21]">
                          {disease.treatments.map((treatmentText, i) => (
                            <li key={i}>• {treatmentText}</li>
                          ))}
                        </ul>
                        {disease.prevention && disease.prevention.length > 0 && (
                          <div className="mt-3 border-t border-emerald-900/10 pt-2.5">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                              <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{t('predictionCard.prevention_title')}</span>
                            </p>
                            <ul className="mt-1.5 space-y-1 text-xs text-[#4B5E51]">
                              {disease.prevention.map((tip, i) => (
                                <li key={i}>• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
