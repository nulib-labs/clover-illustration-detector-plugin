import i18next from "i18next";
import { initCloverI18n } from "@samvera/clover-iiif/i18n";

export const ILLUSTRATION_DETECTOR_I18N_NAMESPACE = "illustrationDetector";

export type IllustrationDetectorTranslationStrings = {
  classifyManifest: string;
  classifying: string;
  summaryClassified: string;
  summaryPending: string;
  summaryErrors: string;
  confidenceThresholdLabel: string;
  noThumbnail: string;
  navigateToCanvasAriaLabel: string;
  status: string;
  label: string;
  illustratedConfidence: string;
  classificationFailed: string;
  unableToInitializeClassifier: string;
  noCanvasImageFound: string;
  statusPending: string;
  statusClassifying: string;
  statusClassified: string;
  statusError: string;
  statusSkipped: string;
  labelIllustrated: string;
  labelNotIllustrated: string;
  tabLabel: string;
};

export type IllustrationDetectorTranslationOverrides = Partial<
  IllustrationDetectorTranslationStrings
>;

export type IllustrationDetectorTranslationResources = Record<
  string,
  IllustrationDetectorTranslationOverrides
>;

const DEFAULT_TRANSLATIONS: IllustrationDetectorTranslationStrings = {
  classifyManifest: "Classify Manifest",
  classifying: "Classifying...",
  summaryClassified: "Classified",
  summaryPending: "Pending",
  summaryErrors: "Errors",
  confidenceThresholdLabel: "Show canvases classified above confidence threshold %: {{value}}",
  noThumbnail: "No thumbnail",
  navigateToCanvasAriaLabel: "Navigate to canvas {{label}}",
  status: "Status",
  label: "Label",
  illustratedConfidence: "Illustrated confidence",
  classificationFailed: "Classification failed",
  unableToInitializeClassifier: "Unable to initialize classifier",
  noCanvasImageFound: "No canvas image found",
  statusPending: "pending",
  statusClassifying: "classifying",
  statusClassified: "classified",
  statusError: "error",
  statusSkipped: "skipped",
  labelIllustrated: "illustrated",
  labelNotIllustrated: "not-illustrated",
  tabLabel: "Illustrations",
};

const BUILTIN_TRANSLATIONS: IllustrationDetectorTranslationResources = {
  fr: {
    classifyManifest: "Classifier le manifeste",
    classifying: "Classification...",
    summaryClassified: "Classés",
    summaryPending: "En attente",
    summaryErrors: "Erreurs",
    confidenceThresholdLabel:
      "Afficher les canevas classés au-dessus du seuil de confiance %: {{value}}",
    noThumbnail: "Pas de vignette",
    navigateToCanvasAriaLabel: "Aller au canevas {{label}}",
    status: "Statut",
    label: "Libellé",
    illustratedConfidence: "Confiance illustration",
    classificationFailed: "La classification a échoué",
    unableToInitializeClassifier: "Impossible d'initialiser le classificateur",
    noCanvasImageFound: "Aucune image de canevas trouvée",
    statusPending: "en attente",
    statusClassifying: "classification",
    statusClassified: "classé",
    statusError: "erreur",
    statusSkipped: "ignoré",
    labelIllustrated: "illustré",
    labelNotIllustrated: "non illustré",
    tabLabel: "Illustrations",
  },
  es: {
    classifyManifest: "Clasificar manifiesto",
    classifying: "Clasificando...",
    summaryClassified: "Clasificados",
    summaryPending: "Pendientes",
    summaryErrors: "Errores",
    confidenceThresholdLabel:
      "Mostrar lienzos clasificados por encima del umbral de confianza %: {{value}}",
    noThumbnail: "Sin miniatura",
    navigateToCanvasAriaLabel: "Ir al lienzo {{label}}",
    status: "Estado",
    label: "Etiqueta",
    illustratedConfidence: "Confianza de ilustración",
    classificationFailed: "La clasificación falló",
    unableToInitializeClassifier: "No se pudo iniciar el clasificador",
    noCanvasImageFound: "No se encontró imagen del lienzo",
    statusPending: "pendiente",
    statusClassifying: "clasificando",
    statusClassified: "clasificado",
    statusError: "error",
    statusSkipped: "omitido",
    labelIllustrated: "ilustrado",
    labelNotIllustrated: "no ilustrado",
    tabLabel: "Ilustraciones",
  },
};

export function registerIllustrationDetectorTranslations(
  resources?: IllustrationDetectorTranslationResources,
): void {
  initCloverI18n();

  i18next.addResourceBundle(
    "en",
    ILLUSTRATION_DETECTOR_I18N_NAMESPACE,
    DEFAULT_TRANSLATIONS,
    true,
    true,
  );

  for (const [language, resource] of Object.entries(BUILTIN_TRANSLATIONS)) {
    i18next.addResourceBundle(
      language,
      ILLUSTRATION_DETECTOR_I18N_NAMESPACE,
      resource,
      true,
      true,
    );
  }

  if (!resources) {
    return;
  }

  for (const [language, resource] of Object.entries(resources)) {
    if (!resource) {
      continue;
    }

    i18next.addResourceBundle(
      language,
      ILLUSTRATION_DETECTOR_I18N_NAMESPACE,
      resource,
      true,
      true,
    );
  }
}

export function createInternationalStringLabel(
  options: {
    tabLabel?: string;
    tabLabelByLanguage?: Record<string, string>;
  },
): InternationalStringLike {
  if (options.tabLabelByLanguage && Object.keys(options.tabLabelByLanguage).length > 0) {
    return Object.fromEntries(
      Object.entries(options.tabLabelByLanguage).map(([language, label]) => [language, [label]]),
    );
  }

  const tabLabel = options.tabLabel ?? DEFAULT_TRANSLATIONS.tabLabel;
  return {
    none: [tabLabel],
  };
}
type InternationalStringLike = Record<string, string[]>;
