import type { PluginConfig } from "@samvera/clover-iiif";
import { illustrationPanel } from "./illustration-panel";

export type CreateIllustrationDetectorPluginOptions = {
  id?: string;
  tabLabel?: string;
};

export function createIllustrationDetectorPlugin(
  options: CreateIllustrationDetectorPluginOptions = {},
): PluginConfig {
  return {
    id: options.id ?? "illustration-detector",
    informationPanel: {
      component: illustrationPanel,
      label: {
        none: [options.tabLabel ?? "Illustrations"],
      },
    },
  };
}

export { illustrationPanel };
