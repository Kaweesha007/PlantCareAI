import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Cpu,
  Info,
  ScanSearch,
  ServerOff,
} from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  analyzeLeafImage,
  API_BASE_URL,
  checkPredictionApiHealth,
  PREDICT_ENDPOINT,
  validateLeafImage,
} from '../services/predictionService';

const ERROR_TITLES_EN = {
  BACKEND_UNAVAILABLE: 'Prediction Server Unreachable',
  MODEL_NOT_READY: 'Trained AI Model Not Available Yet',
  INVALID_IMAGE: 'Unsupported or Corrupted Image',
  IMAGE_TOO_LARGE: 'Image Exceeds Maximum Upload Size',
  VALIDATION_ERROR: 'Invalid Upload Request',
  INVALID_FILE: 'Invalid Leaf Image File',
  ABORTED: 'Analysis Cancelled',
};

const ERROR_TITLES_SI = {
  BACKEND_UNAVAILABLE: 'අනාවැකි සේවාදායකය (FastAPI) හා සම්බන්ධ විය නොහැක',
  MODEL_NOT_READY: 'පුහුණු කළ AI ආකෘතිය තවමත් සූදානම් නැත',
  INVALID_IMAGE: 'සහාය නොදක්වන හෝ හානි වූ ඡායාරූපයකි',
  IMAGE_TOO_LARGE: 'ඡායාරූපය උපරිම ප්‍රමාණයට (5MB) වඩා වැඩිය',
  VALIDATION_ERROR: 'වලංගු නොවන උඩුගත කිරීමේ ඉල්ලීමකි',
  INVALID_FILE: 'වලංගු නොවන ශාක පත්‍ර ගොනුවකි',
  ABORTED: 'විශ්ලේෂණය අවලංගු කරන ලදී',
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image for preview.'));
    reader.readAsDataURL(file);
  });
}

export default function DetectDisease() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'si' ? 'si' : 'en';

  const navigate = useNavigate();
  const abortControllerRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    checkPredictionApiHealth({ signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) {
        setHealthStatus(result);
      }
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleFileSelect = (file) => {
    setApiError(null);
    const result = validateLeafImage(file);

    if (!result.valid) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setValidationError(result.error);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
    setValidationError(null);
  };

  const handleRemoveImage = () => {
    abortControllerRef.current?.abort();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    setApiError(null);
  };

  const handleAnalyzeSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile || isAnalyzing) {
      return;
    }

    setApiError(null);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    try {
      const prediction = await analyzeLeafImage(selectedFile, {
        signal: controller.signal,
      });
      const persistentPreview = await readFileAsDataUrl(selectedFile);

      navigate('/results', {
        state: {
          prediction,
          imagePreviewUrl: persistentPreview,
          fileName: selectedFile.name,
          analyzedAt: prediction.predictedAt || new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error.code === 'ABORTED') {
        return;
      }
      setApiError({
        code: error.code || 'API_ERROR',
        status: error.status ?? null,
        message: error.message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const errorTitles = currentLang === 'si' ? ERROR_TITLES_SI : ERROR_TITLES_EN;
  const errorTitle =
    errorTitles[apiError?.code] ||
    (currentLang === 'si' ? 'අනාවැකිය සම්පූර්ණ කළ නොහැක' : 'Unable to Complete Prediction');

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {currentLang === 'si'
                ? 'පත්‍ර ඡායාරූපය සහ AI රෝග විනිශ්චය'
                : 'Leaf Image Upload & AI Diagnosis'}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#14532D] sm:text-4xl">
            {currentLang === 'si' ? 'ශාක පත්‍ර රෝග හඳුනාගැනීම' : 'Detect Plant Leaf Disease'}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#4B5E51] sm:text-base">
            {currentLang === 'si'
              ? 'පැහැදිලි JPG, JPEG, හෝ PNG පත්‍ර ඡායාරූපයක් එක් කරන්න. රෝග වර්ගීකරණය සඳහා ඡායාරූපය FastAPI අනාවැකි පසුබිම් සේවාදායකය වෙත යොමු කරනු ලැබේ.'
              : 'Upload a clear JPG, JPEG, or PNG leaf photograph. The image is sent via FormData to the FastAPI prediction backend for disease classification.'}
          </p>
        </div>

        {healthStatus && (
          <div
            className={`inline-flex items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-xs font-semibold sm:self-auto ${
              healthStatus.online && healthStatus.modelReady
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : healthStatus.online
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {healthStatus.online && healthStatus.modelReady ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>
                  {currentLang === 'si'
                    ? `පසුබිම සක්‍රීයයි • ආකෘතිය සූදානම් (කාණ්ඩ ${healthStatus.classCount}ක්)`
                    : `Backend Online • Model Ready (${healthStatus.classCount} classes)`}
                </span>
              </>
            ) : healthStatus.online ? (
              <>
                <Cpu className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                <span>
                  {currentLang === 'si'
                    ? 'පසුබිම සක්‍රීයයි • ආකෘතිය අපේක්ෂාවෙන්'
                    : 'Backend Online • Trained Model Pending'}
                </span>
              </>
            ) : (
              <>
                <ServerOff className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                <span>
                  {currentLang === 'si'
                    ? `පසුබිම අක්‍රීයයි (${API_BASE_URL})`
                    : `Backend Offline (${API_BASE_URL})`}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <form onSubmit={handleAnalyzeSubmit} className="space-y-6 lg:col-span-8">
          <ImageUploader
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            error={validationError}
            disabled={isAnalyzing}
            onFileSelect={handleFileSelect}
            onRemove={handleRemoveImage}
          />

          {isAnalyzing && (
            <LoadingSpinner
              label={
                currentLang === 'si'
                  ? 'PlantCare AI මඟින් පත්‍ර ඡායාරූපය විශ්ලේෂණය කරමින්...'
                  : 'Analyzing leaf image with PlantCare AI...'
              }
              sublabel={`Uploading FormData to ${PREDICT_ENDPOINT}`}
            />
          )}

          {apiError && (
            <div
              role="alert"
              className={`rounded-2xl border p-5 text-sm ${
                apiError.code === 'MODEL_NOT_READY'
                  ? 'border-amber-300 bg-amber-50/90 text-amber-950'
                  : 'border-red-200 bg-red-50/90 text-red-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {apiError.code === 'BACKEND_UNAVAILABLE' ? (
                  <ServerOff
                    className="mt-0.5 h-5 w-5 shrink-0 text-red-700"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      apiError.code === 'MODEL_NOT_READY' ? 'text-amber-700' : 'text-red-700'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{errorTitle}</p>
                    {apiError.status && (
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold">
                        HTTP {apiError.status}
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed">{apiError.message}</p>
                  <p className="text-xs opacity-85">
                    {apiError.code === 'BACKEND_UNAVAILABLE'
                      ? currentLang === 'si'
                        ? 'කරුණාකර FastAPI පසුබිම් සේවාදායකය ආරම්භ කර නැවත උත්සාහ කරන්න.'
                        : 'Start the FastAPI backend server and try again. No simulated predictions are generated.'
                      : apiError.code === 'MODEL_NOT_READY'
                        ? currentLang === 'si'
                          ? 'MobileNetV2 ආකෘතිය පුහුණු කර සේවාදායකය නැවත ආරම්භ කරන්න.'
                          : 'Train the MobileNetV2 model to populate plant_disease_model.keras, then restart the backend.'
                        : currentLang === 'si'
                          ? 'කරුණාකර උඩුගත කළ ගොනුව පරීක්ෂා කරන්න හෝ රෝග පුස්තකාලය බලන්න.'
                          : 'Please check the uploaded file or review the Disease Library while resolving the issue.'}
                  </p>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <Link
                      to="/library"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 bg-white px-3.5 py-2 text-xs font-semibold hover:bg-white/80"
                    >
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('results.disease_library')}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-[#4B5E51]">
              {selectedFile ? (
                <span>
                  {currentLang === 'si' ? 'විශ්ලේෂණයට සූදානම්:' : 'Ready to analyze'}{' '}
                  <strong className="text-[#1C2A21]">{selectedFile.name}</strong>
                </span>
              ) : (
                <span>
                  {currentLang === 'si'
                    ? 'ඉදිරියට යාමට වලංගු JPG, JPEG හෝ PNG ඡායාරූපයක් (උපරිම 5 MB) තෝරන්න.'
                    : 'Select a valid JPG, JPEG, or PNG image (max 5 MB) to continue.'}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isAnalyzing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-700/40"
            >
              {isAnalyzing ? (
                <LoadingSpinner
                  size="sm"
                  inline
                  label={currentLang === 'si' ? 'විශ්ලේෂණය කරමින්...' : 'Analyzing...'}
                />
              ) : (
                <>
                  <ScanSearch className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {currentLang === 'si' ? 'පත්‍රය විශ්ලේෂණය කරන්න' : 'Analyze Leaf'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <Info className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="text-base font-bold text-[#1C2A21]">
                {currentLang === 'si' ? 'උඩුගත කිරීමේ අවශ්‍යතා' : 'Upload Requirements'}
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-[#4B5E51]">
              <li>
                {currentLang === 'si'
                  ? '• පිළිගත් ආකෘති: JPG, JPEG, සහ PNG'
                  : '• Accepted formats: JPG, JPEG, and PNG'}
              </li>
              <li>
                {currentLang === 'si'
                  ? '• උපරිම ගොනු ප්‍රමාණය: 5 MB'
                  : '• Maximum file size: 5 MB'}
              </li>
              <li>
                {currentLang === 'si'
                  ? '• තනි පත්‍රයක පැහැදිලි සමීප ඡායාරූපයක්'
                  : '• Clear close-up of a single leaf blade'}
              </li>
              <li>
                {currentLang === 'si'
                  ? '• අධික සෙලවීම් හෝ තද ආලෝක පරාවර්තන වළක්වා ගන්න'
                  : '• Avoid heavy motion blur or extreme glare'}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-5">
            <h2 className="text-sm font-bold text-[#14532D]">
              {currentLang === 'si' ? 'සම්බන්ධිත API අන්ත ලක්ෂ්‍යය' : 'Connected API Endpoint'}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#4B5E51]">
              {currentLang === 'si' ? (
                <>
                  ඡායාරූප{' '}
                  <code className="rounded bg-white px-1.5 py-0.5 text-[11px] text-[#1C2A21]">
                    src/services/predictionService.js
                  </code>{' '}
                  හරහා{' '}
                  <code className="rounded bg-white px-1.5 py-0.5 text-[11px] break-all text-[#1C2A21]">
                    {PREDICT_ENDPOINT}
                  </code>{' '}
                  වෙත යොමු කෙරේ.
                </>
              ) : (
                <>
                  Uploads are sent via{' '}
                  <code className="rounded bg-white px-1.5 py-0.5 text-[11px] text-[#1C2A21]">
                    src/services/predictionService.js
                  </code>{' '}
                  to{' '}
                  <code className="rounded bg-white px-1.5 py-0.5 text-[11px] break-all text-[#1C2A21]">
                    {PREDICT_ENDPOINT}
                  </code>
                  .
                </>
              )}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
