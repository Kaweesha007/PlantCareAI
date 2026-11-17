import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Focus,
  RefreshCw,
  Sun,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { formatFileSize } from '../services/predictionService';

export default function ImageUploader({
  selectedFile,
  previewUrl,
  error,
  disabled = false,
  onFileSelect,
  onRemove,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState(null);

  const captureTips = [
    {
      icon: Sun,
      title: t('uploader.tip_lighting_title'),
      detail: t('uploader.tip_lighting_desc'),
    },
    {
      icon: Focus,
      title: t('uploader.tip_focus_title'),
      detail: t('uploader.tip_focus_desc'),
    },
    {
      icon: FileImage,
      title: t('uploader.tip_frame_title'),
      detail: t('uploader.tip_frame_desc'),
    },
  ];

  const openFilePicker = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setDimensions(null);
      onFileSelect(file);
    }
    event.target.value = '';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      setDimensions(null);
      onFileSelect(file);
    }
  };

  const handleRemove = () => {
    setDimensions(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onRemove();
  };

  return (
    <div className="space-y-5">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Upload plant leaf image"
        disabled={disabled}
      />

      {!selectedFile || !previewUrl ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={openFilePicker}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
            isDragging
              ? 'border-emerald-600 bg-emerald-50/90'
              : 'border-emerald-800/25 bg-white hover:border-emerald-600/70 hover:bg-emerald-50/40'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition-transform group-hover:scale-105">
            <UploadCloud className="h-8 w-8" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-[#1C2A21]">
            {t('uploader.drop_title')}
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-[#4B5E51]">
            {t('uploader.drop_desc')}{' '}
            <span className="font-semibold text-emerald-700 underline decoration-emerald-700/40 underline-offset-4">
              {t('uploader.browse')}
            </span>
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-[#4B5E51]">
            <span className="rounded-full bg-[#EFF4EF] px-3 py-1 font-medium text-[#1C2A21]">
              JPG / JPEG / PNG
            </span>
            <span className="rounded-full bg-[#EFF4EF] px-3 py-1 font-medium text-[#1C2A21]">
              {t('uploader.max_size')}
            </span>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-emerald-900/15 bg-white shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 border-b border-emerald-950/10 bg-[#F7FAF7] px-5 py-3.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#1C2A21] break-all">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[#4B5E51]">
                  {formatFileSize(selectedFile.size)}
                  {dimensions ? ` • ${dimensions.width} × ${dimensions.height} px` : ''}
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={openFilePicker}
                disabled={disabled}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-900/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#1C2A21] transition-colors hover:bg-emerald-50 disabled:opacity-50 sm:flex-initial"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('uploader.replace')}</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 sm:flex-initial"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('uploader.remove')}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center bg-[#F2F7F3] p-4 sm:p-6">
            <img
              src={previewUrl}
              alt={`Preview of ${selectedFile.name}`}
              onLoad={(e) =>
                setDimensions({
                  width: e.currentTarget.naturalWidth,
                  height: e.currentTarget.naturalHeight,
                })
              }
              className="max-h-80 w-auto rounded-xl border border-emerald-900/10 bg-white object-contain shadow-sm"
            />
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t('uploader.validation_failed')}</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-3 pt-1 sm:grid-cols-3">
        {captureTips.map(({ icon: TipIcon, title, detail }) => (
          <div
            key={title}
            className="rounded-xl border border-emerald-900/10 bg-white/80 p-3.5"
          >
            <div className="flex items-center gap-2 text-emerald-800">
              <TipIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold">{title}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#4B5E51]">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
