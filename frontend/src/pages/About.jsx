import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BrainCircuit,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Leaf,
  ScanSearch,
  Server,
  ShieldAlert,
} from 'lucide-react';
import { ACTIVE_PLANTS, PLANNED_PLANTS } from '../data/diseases';
import { translateCrop } from '../utils/diseaseTranslator';

export default function About() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'si' ? 'si' : 'en';

  const architectureLayers = [
    {
      icon: Layers,
      stage: currentLang === 'si' ? 'අදියර 1 — සක්‍රීයයි' : 'Stage 1 — Active',
      title:
        currentLang === 'si'
          ? 'ඉදිරිපස වෙබ් අතුරුමුහුණත (React + Vite)'
          : 'Frontend Interface (React + Vite)',
      description:
        currentLang === 'si'
          ? 'React Router, Tailwind CSS, Lucide අයිකන සහ ද්විභාෂා (සිංහල / English) සහාය සහිත කෘෂිකාර්මික වෙබ් අතුරුමුහුණත.'
          : 'Responsive agricultural web interface built with React Router, Tailwind CSS, Lucide icons, client-side image validation, and i18n English/Sinhala toggle.',
      active: true,
    },
    {
      icon: Server,
      stage: currentLang === 'si' ? 'අදියර 2 — සම්බන්ධිතයි' : 'Stage 2 — Connected',
      title:
        currentLang === 'si'
          ? 'පසුබිම් REST API (FastAPI)'
          : 'Backend REST API (FastAPI)',
      description:
        currentLang === 'si'
          ? 'Pillow පූර්ව සැකසුම්, විශ්වාසනීයතා සීමා පරීක්ෂාවන් සහ ව්‍යුහගත JSON රෝග විනිශ්චය ප්‍රතිචාර සහිත Python සේවාව.'
          : 'Dedicated Python inference service with request schema validation, Pillow preprocessing, confidence threshold checks, and structured JSON diagnostic responses.',
      active: true,
    },
    {
      icon: BrainCircuit,
      stage:
        currentLang === 'si'
          ? 'අදියර 3 — MobileNetV2 සක්‍රීයයි'
          : 'Stage 3 — MobileNetV2 Active',
      title:
        currentLang === 'si'
          ? 'ගැඹුරු ඉගෙනුම් ආකෘතිය (TensorFlow / Keras)'
          : 'Deep Learning Model (TensorFlow / Keras)',
      description:
        currentLang === 'si'
          ? 'තක්කාලි, අර්තාපල් සහ මාළු මිරිස් (කාණ්ඩ 15ක්) සඳහා සජීවීව ක්‍රියාත්මක වන MobileNetV2 ආකෘතිය සහ BioCLIP පූර්ව පරීක්ෂාව.'
          : 'MobileNetV2 transfer learning pipeline trained on processed PlantVillage leaf splits. Live model inference currently active for Tomato, Potato, and Bell Pepper foliage (15 disease classes).',
      active: true,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('about.tag')}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#14532D] sm:text-4xl">
          {t('about.title')}
        </h1>
        <p className="text-sm leading-relaxed text-[#4B5E51] sm:text-base">
          {t('about.desc')}
        </p>
      </div>

      {/* Mission & Highlights */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-xs">
          <h2 className="text-lg font-bold text-[#1C2A21]">{t('about.objectives_title')}</h2>
          <ul className="mt-4 space-y-3 text-sm text-[#4B5E51]">
            <li className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>{t('about.obj_1')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>{t('about.obj_2')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>{t('about.obj_3')}</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800">
              <Cpu className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-lg font-bold text-[#1C2A21]">
                {currentLang === 'si' ? 'ඉලක්කගත බෝග ආවරණය' : 'Target Crop Coverage'}
              </h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {currentLang === 'si' ? 'පුහුණු 3ක් + සැලසුම්ගත 4ක්' : '3 Trained + 4 Planned'}
            </span>
          </div>

          <p className="mt-2 text-sm text-[#4B5E51]">
            {currentLang === 'si'
              ? 'පරිශීලක අපේක්ෂාවන් පැහැදිලිව තබා ගැනීම සඳහා, PlantCare AI සක්‍රීය පුහුණු කළ බෝග සහ ඉදිරි සැලසුමේ ඇති බෝග පැහැදිලිව වෙන් කර දක්වයි:'
              : 'To ensure clear user expectations, PlantCare AI explicitly distinguishes between active AI-trained models and upcoming roadmap crops:'}
          </p>

          {/* Active AI Crops */}
          <div className="mt-4 rounded-xl border border-emerald-600/25 bg-emerald-50/60 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                <span>
                  {currentLang === 'si'
                    ? 'AI ආකෘතියේ සක්‍රීය බෝග (බෝග 3ක්)'
                    : 'Active in AI Model (3 Crops)'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">
                {currentLang === 'si' ? 'ආකෘතියේ සක්‍රීයයි' : 'Live in Model'}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#4B5E51]">
              {currentLang === 'si'
                ? 'ක්ෂණික පත්‍ර රෝග විනිශ්චය සඳහා සම්පූර්ණයෙන්ම සහාය දක්වයි:'
                : 'Supported for immediate leaf image classification via the FastAPI inference engine:'}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {ACTIVE_PLANTS.map((plant) => (
                <Link
                  key={plant.name}
                  to={`/library?plant=${encodeURIComponent(plant.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/30 bg-white px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs transition-colors hover:bg-emerald-100"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>{translateCrop(plant.name, currentLang)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Planned Crops */}
          <div className="mt-4 rounded-xl border border-amber-300/70 bg-amber-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                <Clock className="h-4 w-4 text-amber-700" aria-hidden="true" />
                <span>
                  {currentLang === 'si'
                    ? 'එක් කිරීමට නියමිත බෝග (බෝග 4ක්)'
                    : 'Planned Crop Additions (4 Crops)'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-amber-800">
                {currentLang === 'si' ? 'ඉදිරි සැලසුමේ' : 'In Roadmap'}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#4B5E51]">
              {currentLang === 'si'
                ? 'රෝග පුස්තකාලයේ ලේඛනගත කර ඇත; ඉදිරි පුහුණු චක්‍ර සඳහා සැලසුම් කර ඇත:'
                : 'Documented in our Disease Library; AI training dataset integration planned in future cycles:'}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {PLANNED_PLANTS.map((plant) => (
                <Link
                  key={plant.name}
                  to={`/library?plant=${encodeURIComponent(plant.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 shadow-2xs transition-colors hover:bg-amber-100"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>{translateCrop(plant.name, currentLang)}</span>
                  <span className="text-[10px] text-amber-700/80">
                    {currentLang === 'si' ? '(සැලසුම්ගත)' : '(Planned)'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Architecture & Development Stages */}
      <section className="mt-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1C2A21]">
            {currentLang === 'si'
              ? 'මොඩියුලර් ගෘහ නිර්මාණ ශිල්පය සහ සංවර්ධන අදියර'
              : 'Modular Architecture & Development Stages'}
          </h2>
          <p className="mt-1 text-sm text-[#4B5E51]">
            {currentLang === 'si'
              ? 'PlantCare AI ස්ථර ක්‍රමයෙන් ගොඩනගා ඇති බැවින් එක් එක් අංශය ස්වාධීනව පරීක්ෂා කර වලංගු කළ හැක.'
              : 'PlantCare AI is being built incrementally so each layer can be tested and validated independently.'}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {architectureLayers.map(({ icon: LayerIcon, stage, title, description, active }) => (
            <div
              key={title}
              className={`rounded-2xl border p-6 ${
                active
                  ? 'border-emerald-600/30 bg-white shadow-sm'
                  : 'border-emerald-900/10 bg-[#F2F7F3]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-emerald-800 border border-emerald-900/10'
                  }`}
                >
                  <LayerIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-white text-[#4B5E51]'
                  }`}
                >
                  {active ? (
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Clock className="h-3 w-3" aria-hidden="true" />
                  )}
                  <span>{stage}</span>
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-[#1C2A21]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4B5E51]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agricultural Disclaimer */}
      <div className="mt-10 flex flex-col justify-between gap-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-bold text-amber-950">
              {currentLang === 'si' ? 'කෘෂිකාර්මික උපදේශන නිවේදනය' : 'Decision-Support Notice'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-amber-900">
              {currentLang === 'si'
                ? 'PlantCare AI නිර්මාණය කර ඇත්තේ අධ්‍යාපනික සහ ක්ෂේත්‍ර තීරණ ගැනීමේ ආධාරකයක් වශයෙනි. රසායනික ප්‍රතිකාර, මාත්‍රාවන් සහ නිරෝධායන පියවර සැමවිටම සහතිකලත් කෘෂි විද්‍යාඥයින් හෝ ප්‍රාදේශීය කෘෂිකර්ම උපදේශක නිලධාරීන් (AI) මඟින් තහවුරු කරගන්න.'
                : 'PlantCare AI is built as an educational and field-triage assistant. Always verify chemical treatments, dosages, and quarantine steps with certified agronomists or local agricultural extension officers.'}
            </p>
          </div>
        </div>

        <Link
          to="/detect"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800"
        >
          <ScanSearch className="h-4 w-4" aria-hidden="true" />
          <span>
            {currentLang === 'si' ? 'රෝග හඳුනාගැනීමේ පිටුවට' : 'Open Detection Page'}
          </span>
        </Link>
      </div>
    </div>
  );
}
