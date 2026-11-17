const RAW_API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');
export const PREDICT_ENDPOINT = `${API_BASE_URL}/api/predict`;
export const HEALTH_ENDPOINT = `${API_BASE_URL}/api/health`;
export const TREATMENTS_ENDPOINT = `${API_BASE_URL}/api/treatments`;

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class PredictionApiError extends Error {
  constructor(
    message,
    { code = 'API_ERROR', status = null, modelReady = null, details = null } = {}
  ) {
    super(message);
    this.name = 'PredictionApiError';
    this.code = code;
    this.status = status;
    this.modelReady = modelReady;
    this.details = details;
  }
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateLeafImage(file) {
  if (!file) {
    return {
      valid: false,
      error: 'Please select a plant leaf image before submitting.',
    };
  }

  const lowerName = (file.name || '').toLowerCase();
  const hasValidExtension = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );
  const hasValidMimeType =
    !file.type || ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase());

  if (!hasValidExtension || !hasValidMimeType) {
    return {
      valid: false,
      error:
        'Unsupported file format. Please upload a JPG, JPEG, or PNG leaf image.',
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The selected file is empty. Please choose a valid image file.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size (${formatFileSize(file.size)}) exceeds the 5 MB upload limit.`,
    };
  }

  return { valid: true, error: null };
}

function normalizeAlternative(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    classLabel: item.class_label ?? item.classLabel ?? '',
    plantName: item.plant_name ?? item.plantName ?? 'Unknown Plant',
    diseaseName: item.disease_name ?? item.diseaseName ?? 'Unknown Condition',
    confidenceScore:
      typeof item.confidence_score === 'number'
        ? item.confidence_score
        : typeof item.confidenceScore === 'number'
          ? item.confidenceScore
          : 0,
  };
}

function normalizePredictionResponse(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new PredictionApiError(
      'Received an invalid response format from the prediction API.',
      { code: 'INVALID_RESPONSE' }
    );
  }

  const isUncertain = Boolean(
    payload.is_uncertain ?? payload.isUncertain ?? payload.status === 'uncertain'
  );
  const isSupported = Boolean(
    payload.is_supported ?? payload.isSupported ?? (payload.status !== 'unsupported')
  );
  const rawAlternatives = Array.isArray(payload.top_alternatives)
    ? payload.top_alternatives
    : Array.isArray(payload.topAlternatives)
      ? payload.topAlternatives
      : [];

  return {
    status: payload.status ?? (isUncertain ? 'uncertain' : 'confirmed'),
    isSupported,
    isUncertain,
    classLabel: payload.class_label ?? payload.classLabel ?? null,
    diseaseName: payload.disease_name ?? payload.diseaseName ?? '',
    plantName: payload.plant_name ?? payload.plantName ?? '',
    confidenceScore:
      typeof payload.confidence_score === 'number'
        ? payload.confidence_score
        : typeof payload.confidenceScore === 'number'
          ? payload.confidenceScore
          : null,
    confidenceThreshold:
      typeof payload.confidence_threshold === 'number'
        ? payload.confidence_threshold
        : typeof payload.confidenceThreshold === 'number'
          ? payload.confidenceThreshold
          : null,
    message: payload.message ?? null,
    topAlternatives: rawAlternatives.map(normalizeAlternative).filter(Boolean),
    severity: payload.severity ?? null,
    symptoms: Array.isArray(payload.symptoms) ? payload.symptoms : [],
    causes: Array.isArray(payload.causes) ? payload.causes : [],
    treatments: Array.isArray(payload.treatments)
      ? payload.treatments
      : Array.isArray(payload.treatment_recommendations)
        ? payload.treatment_recommendations
        : [],
    prevention: Array.isArray(payload.prevention) ? payload.prevention : [],
    treatmentRecommendation:
      payload.treatment_recommendation ?? payload.treatmentRecommendation ?? null,
    predictedAt: payload.predicted_at ?? payload.predictedAt ?? null,
  };
}

/**
 * Sends a validated leaf image using FormData to POST /api/predict.
 * Never fabricates fallback or mock prediction results on errors.
 */
export async function analyzeLeafImage(file, { signal } = {}) {
  const validation = validateLeafImage(file);
  if (!validation.valid) {
    throw new PredictionApiError(validation.error, { code: 'INVALID_FILE' });
  }

  const formData = new FormData();
  formData.append('file', file);

  let response;
  try {
    response = await fetch(PREDICT_ENDPOINT, {
      method: 'POST',
      body: formData,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new PredictionApiError('Analysis request was cancelled.', {
        code: 'ABORTED',
      });
    }
    throw new PredictionApiError(
      `Unable to connect to the PlantCare AI prediction server at ${PREDICT_ENDPOINT}. Please ensure the FastAPI backend is running.`,
      { code: 'BACKEND_UNAVAILABLE', details: error.message }
    );
  }

  if (!response.ok) {
    let errorMessage = `Prediction request failed with HTTP status ${response.status}.`;
    let errorCode = 'API_HTTP_ERROR';
    let modelReady = null;

    try {
      const errorData = await response.json();
      if (errorData?.code) {
        errorCode = errorData.code;
      }
      if (typeof errorData?.model_ready === 'boolean') {
        modelReady = errorData.model_ready;
      }
      if (errorData?.detail) {
        errorMessage =
          typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Preserve HTTP status error message when response body is not JSON.
    }

    throw new PredictionApiError(errorMessage, {
      code: errorCode,
      status: response.status,
      modelReady,
    });
  }

  const data = await response.json();
  return normalizePredictionResponse(data);
}

export async function checkPredictionApiHealth({ signal } = {}) {
  try {
    const response = await fetch(HEALTH_ENDPOINT, { method: 'GET', signal });
    if (!response.ok) {
      return { online: false, status: response.status, modelReady: false };
    }
    const data = await response.json();
    return {
      online: true,
      status: response.status,
      modelReady: Boolean(data?.model_ready),
      classCount: typeof data?.class_count === 'number' ? data.class_count : 0,
      confidenceThreshold:
        typeof data?.confidence_threshold === 'number' ? data.confidence_threshold : null,
      message: data?.message ?? '',
    };
  } catch {
    return { online: false, status: null, modelReady: false };
  }
}

/**
 * Fetch comprehensive agronomic treatment recommendations for a given disease ID or class label.
 */
export async function fetchTreatmentRecommendation(diseaseId, { signal } = {}) {
  if (!diseaseId) {
    throw new PredictionApiError('Disease identifier is required to fetch treatments.', {
      code: 'INVALID_ID',
    });
  }

  const encodedId = encodeURIComponent(diseaseId.trim());
  const url = `${TREATMENTS_ENDPOINT}/${encodedId}`;

  let response;
  try {
    response = await fetch(url, { method: 'GET', signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new PredictionApiError('Treatment fetch request was cancelled.', {
        code: 'ABORTED',
      });
    }
    throw new PredictionApiError(
      `Unable to connect to the treatment API at ${url}. Please verify the FastAPI backend is running.`,
      { code: 'BACKEND_UNAVAILABLE', details: error.message }
    );
  }

  if (!response.ok) {
    let errorDetail = `Failed to fetch treatment recommendations (HTTP ${response.status}).`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) errorDetail = errJson.detail;
    } catch {
      // Keep default error text
    }
    throw new PredictionApiError(errorDetail, {
      code: response.status === 404 ? 'TREATMENT_NOT_FOUND' : 'API_HTTP_ERROR',
      status: response.status,
    });
  }

  return response.json();
}

/**
 * Fetch available treatment categories and condition counts.
 */
export async function fetchTreatmentCategories({ signal } = {}) {
  const url = `${TREATMENTS_ENDPOINT}/categories`;
  try {
    const response = await fetch(url, { method: 'GET', signal });
    if (!response.ok) {
      throw new PredictionApiError(`Failed to fetch categories (HTTP ${response.status}).`, {
        status: response.status,
      });
    }
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new PredictionApiError('Request cancelled.', { code: 'ABORTED' });
    }
    throw new PredictionApiError(
      `Unable to fetch treatment categories from ${url}.`,
      { code: 'BACKEND_UNAVAILABLE', details: error.message }
    );
  }
}
