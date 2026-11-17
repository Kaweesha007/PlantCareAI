import i18n from '../i18n/i18n';
import en from '../i18n/locales/en.json';
import si from '../i18n/locales/si.json';

const RESOURCES = { en, si };

export function getCurrentLanguage() {
  return i18n.language === 'si' ? 'si' : 'en';
}

export function translateCrop(cropName, lang = getCurrentLanguage()) {
  if (!cropName) return '';
  const dict = RESOURCES[lang]?.plants || {};
  return dict[cropName] || cropName;
}

export function translateSeverity(severity, lang = getCurrentLanguage()) {
  if (!severity) return '';
  const dict = RESOURCES[lang]?.severities || {};
  return dict[severity] || severity;
}

export function translateDiseaseName(classLabel, defaultName, lang = getCurrentLanguage()) {
  if (classLabel && RESOURCES[lang]?.diseases?.[classLabel]?.disease_name) {
    return RESOURCES[lang].diseases[classLabel].disease_name;
  }
  return defaultName || classLabel || '';
}

export function getTranslatedDiseaseInfo(classLabel, lang = getCurrentLanguage()) {
  if (!classLabel) return null;
  return RESOURCES[lang]?.diseases?.[classLabel] || RESOURCES.en?.diseases?.[classLabel] || null;
}

export function translatePredictionResult(prediction, lang = getCurrentLanguage()) {
  if (!prediction) return prediction;
  if (lang !== 'si') return prediction;

  const classLabel = prediction.classLabel || prediction.class_label;
  const diseaseInfo = getTranslatedDiseaseInfo(classLabel, 'si');

  const translatedCrop = translateCrop(prediction.plantName || prediction.plant_name, 'si');
  const translatedDisease = translateDiseaseName(
    classLabel,
    prediction.diseaseName || prediction.disease_name,
    'si'
  );
  const translatedSeverity = translateSeverity(prediction.severity, 'si');

  let translatedAlternatives = prediction.topAlternatives || prediction.top_alternatives;
  if (Array.isArray(translatedAlternatives)) {
    translatedAlternatives = translatedAlternatives.map((alt) => {
      const altLabel = alt.classLabel || alt.class_label;
      return {
        ...alt,
        plantName: translateCrop(alt.plantName || alt.plant_name, 'si'),
        diseaseName: translateDiseaseName(
          altLabel,
          alt.diseaseName || alt.disease_name,
          'si'
        ),
      };
    });
  }

  // If diseaseInfo is available, use its authentic Sinhala symptoms, actions, and prevention
  const translatedSymptoms =
    diseaseInfo?.common_symptoms && diseaseInfo.common_symptoms.length > 0
      ? diseaseInfo.common_symptoms
      : prediction.symptoms;

  const translatedCauses =
    diseaseInfo?.causes && diseaseInfo.causes.length > 0
      ? diseaseInfo.causes
      : prediction.causes;

  const translatedTreatments =
    diseaseInfo?.immediate_actions && diseaseInfo.immediate_actions.length > 0
      ? diseaseInfo.immediate_actions
      : prediction.treatments;

  const translatedPrevention =
    diseaseInfo?.prevention_tips && diseaseInfo.prevention_tips.length > 0
      ? diseaseInfo.prevention_tips
      : prediction.prevention;

  return {
    ...prediction,
    plantName: translatedCrop,
    diseaseName: translatedDisease,
    severity: translatedSeverity,
    symptoms: translatedSymptoms,
    causes: translatedCauses,
    treatments: translatedTreatments,
    prevention: translatedPrevention,
    topAlternatives: translatedAlternatives,
  };
}

export function translateTreatmentRecommendation(treatment, lang = getCurrentLanguage()) {
  if (!treatment) return treatment;
  if (lang !== 'si') return treatment;

  const classLabel = treatment.class_label || treatment.classLabel;
  const localized = getTranslatedDiseaseInfo(classLabel, 'si');
  if (!localized) return treatment;

  return {
    ...treatment,
    disease_name: localized.disease_name || treatment.disease_name,
    crop: localized.crop || treatment.crop,
    short_description: localized.short_description || treatment.short_description,
    common_symptoms: localized.common_symptoms || treatment.common_symptoms,
    immediate_actions: localized.immediate_actions || treatment.immediate_actions,
    cultural_and_preventive_practices:
      localized.cultural_and_preventive_practices || treatment.cultural_and_preventive_practices,
    biological_control_options:
      localized.biological_control_options || treatment.biological_control_options,
    chemical_control_options:
      localized.chemical_control_options || treatment.chemical_control_options,
    prevention_tips: localized.prevention_tips || treatment.prevention_tips,
  };
}
