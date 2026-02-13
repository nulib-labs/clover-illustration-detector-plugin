import type { PluginConfig } from "@samvera/clover-iiif";
import {
  createInternationalStringLabel,
  registerIllustrationDetectorTranslations,
  type IllustrationDetectorTranslationResources,
} from "./i18n";
import { illustrationPanel } from "./illustration-panel";

export type CreateIllustrationDetectorPluginOptions = {
  id?: string;
  tabLabel?: string;
  tabLabelByLanguage?: Record<string, string>;
  translations?: IllustrationDetectorTranslationResources;
};

export function createIllustrationDetectorPlugin(
  options: CreateIllustrationDetectorPluginOptions = {},
): PluginConfig {
  registerIllustrationDetectorTranslations(options.translations);

  return {
    id: options.id ?? "illustration-detector",
    informationPanel: {
      component: illustrationPanel,
      label: createInternationalStringLabel({
        tabLabel: options.tabLabel,
        tabLabelByLanguage: options.tabLabelByLanguage,
      }),
    },
  };
}

export { illustrationPanel };
export {
  ILLUSTRATION_DETECTOR_I18N_NAMESPACE,
  type IllustrationDetectorTranslationOverrides,
  type IllustrationDetectorTranslationResources,
  type IllustrationDetectorTranslationStrings,
} from "./i18n";
