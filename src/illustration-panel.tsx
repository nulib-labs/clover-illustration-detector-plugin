import * as React from "react";
import type { PluginInformationPanel } from "@samvera/clover-iiif";
import { getValue } from "@iiif/helpers";
import { env, pipeline } from "@huggingface/transformers";

type ClassificationResult = {
  label: "illustrated" | "not-illustrated";
  score: number;
  illustratedConfidence: number;
};

type CanvasStatus =
  | "pending"
  | "classifying"
  | "classified"
  | "error"
  | "skipped";

type CanvasClassificationState = {
  id: string;
  label: string;
  thumbnail?: Array<{ id: string; type: "Image"; format?: string }>;
  imageUrl?: string;
  status: CanvasStatus;
  confidence?: number;
  predictedLabel?: "illustrated" | "not-illustrated";
  error?: string;
};

type CanvasLike = {
  id: string;
  label?: unknown;
  thumbnail?: Array<{ id: string; format?: string }>;
  items?: Array<unknown>;
};

type ManifestLike = {
  items?: Array<unknown>;
};

type ImageClassifier = (image: string) => Promise<
  Array<{
    label: string;
    score: number;
  }>
>;

const MODEL_ID = "small-models-for-glam/historical-illustration-detector";
const MAX_CONCURRENCY = 3;
let classifierPromise: Promise<ImageClassifier> | null = null;

function getClassifier(): Promise<ImageClassifier> {
  if (!classifierPromise) {
    env.allowLocalModels = false;
    const createPipeline = pipeline as unknown as (
      task: string,
      model: string,
    ) => Promise<ImageClassifier>;
    classifierPromise = createPipeline("image-classification", MODEL_ID);
  }

  return classifierPromise;
}

function getFirstBodyId(body: unknown): string | undefined {
  if (!body) {
    return undefined;
  }

  if (Array.isArray(body)) {
    return getFirstBodyId(body[0]);
  }

  if (typeof body === "string") {
    return body;
  }

  if (typeof body === "object" && "id" in body) {
    const bodyId = (body as { id?: unknown }).id;
    return typeof bodyId === "string" ? bodyId : undefined;
  }

  return undefined;
}

function getCanvasImageUrl(
  canvas: CanvasLike,
  vault: { get: (idOrRef: any) => unknown },
): string | undefined {
  const firstPageRef = canvas.items?.[0];
  if (firstPageRef) {
    const page = vault.get(firstPageRef) as { items?: Array<unknown> } | undefined;
    const firstAnnotationRef = page?.items?.[0];

    if (firstAnnotationRef) {
      const annotation = vault.get(firstAnnotationRef) as { body?: unknown } | undefined;
      const bodyId = getFirstBodyId(annotation?.body);
      if (bodyId) {
        return bodyId;
      }
    }
  }

  const thumbnail = canvas.thumbnail?.[0];
  return thumbnail?.id;
}

function getCanvasThumbnail(
  canvas: CanvasLike,
): CanvasClassificationState["thumbnail"] {
  const first = canvas.thumbnail?.[0];
  if (!first?.id) {
    return undefined;
  }

  return [
    {
      id: first.id,
      type: "Image",
      format: first.format,
    },
  ];
}

function mapScoresToClassification(
  scores: Array<{ label: string; score: number }>,
): ClassificationResult {
  const illustrated = scores.find(
    (item) => item.label.toLowerCase() === "illustrated",
  );
  const notIllustrated = scores.find(
    (item) =>
      item.label.toLowerCase() === "not-illustrated" ||
      item.label.toLowerCase() === "not illustrated",
  );

  if (illustrated && notIllustrated) {
    return {
      label: illustrated.score >= notIllustrated.score ? "illustrated" : "not-illustrated",
      score: Math.max(illustrated.score, notIllustrated.score),
      illustratedConfidence: illustrated.score,
    };
  }

  const best = scores[0];
  const normalizedLabel =
    best?.label?.toLowerCase() === "illustrated"
      ? "illustrated"
      : "not-illustrated";

  return {
    label: normalizedLabel,
    score: best?.score ?? 0,
    illustratedConfidence:
      normalizedLabel === "illustrated" ? best?.score ?? 0 : 1 - (best?.score ?? 0),
  };
}

export const IllustrationPanel: React.FC<PluginInformationPanel> = ({
  canvas,
  useViewerDispatch,
  useViewerState,
}) => {
  const viewerState = useViewerState();
  const viewerDispatch = (useViewerDispatch as unknown as () => (action: any) => void)();
  const [results, setResults] = React.useState<CanvasClassificationState[]>([]);
  const [isClassifying, setIsClassifying] = React.useState(false);
  const [panelError, setPanelError] = React.useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = React.useState(50);

  const activeCanvasId = canvas?.id;
  const manifest = React.useMemo(() => {
    if (!viewerState.activeManifest) {
      return undefined;
    }
    return viewerState.vault.get(viewerState.activeManifest) as ManifestLike | undefined;
  }, [viewerState.activeManifest, viewerState.vault]);

  const manifestCanvases = React.useMemo(() => {
    if (!manifest?.items?.length) {
      return [];
    }

    return (manifest.items as any[])
      .map((canvasRef) => viewerState.vault.get(canvasRef as any) as CanvasLike | undefined)
      .filter((item: CanvasLike | undefined): item is CanvasLike => Boolean(item));
  }, [manifest, viewerState.vault]);

  const baseCanvasStates = React.useMemo<CanvasClassificationState[]>(
    () =>
      manifestCanvases.map((manifestCanvas) => {
        const imageUrl = getCanvasImageUrl(manifestCanvas, viewerState.vault);
        return {
          id: manifestCanvas.id,
          label: getValue(manifestCanvas.label as any) ?? manifestCanvas.id,
          thumbnail: getCanvasThumbnail(manifestCanvas),
          imageUrl,
          status: imageUrl ? "pending" : "skipped",
          error: imageUrl ? undefined : "No canvas image found",
        };
      }),
    [manifestCanvases, viewerState.vault],
  );

  React.useEffect(() => {
    setResults(baseCanvasStates);
    setPanelError(null);
    setIsClassifying(false);
  }, [baseCanvasStates]);

  const classifyManifest = React.useCallback(async () => {
    setPanelError(null);
    setIsClassifying(true);

    setResults((previous) =>
      previous.map((entry) =>
        entry.imageUrl
          ? {
              ...entry,
              status: "pending",
              error: undefined,
              predictedLabel: undefined,
              confidence: undefined,
            }
          : entry,
      ),
    );

    const idsToClassify = baseCanvasStates
      .filter((entry) => entry.imageUrl)
      .map((entry) => entry.id);

    if (idsToClassify.length === 0) {
      setIsClassifying(false);
      return;
    }

    try {
      const classifier = await getClassifier();
      const pendingQueue = [...idsToClassify];

      const classifyNext = async () => {
        while (pendingQueue.length) {
          const nextId = pendingQueue.shift();
          if (!nextId) {
            return;
          }

          const current = baseCanvasStates.find((entry) => entry.id === nextId);
          if (!current?.imageUrl) {
            continue;
          }

          setResults((previous) =>
            previous.map((entry) =>
              entry.id === nextId ? { ...entry, status: "classifying", error: undefined } : entry,
            ),
          );

          try {
            const scoreList = await classifier(current.imageUrl);
            const classification = mapScoresToClassification(scoreList);

            setResults((previous) =>
              previous.map((entry) =>
                entry.id === nextId
                  ? {
                      ...entry,
                      status: "classified",
                      predictedLabel: classification.label,
                      confidence: classification.illustratedConfidence,
                    }
                  : entry,
              ),
            );
          } catch (error) {
            setResults((previous) =>
              previous.map((entry) =>
                entry.id === nextId
                  ? {
                      ...entry,
                      status: "error",
                      error: error instanceof Error ? error.message : "Classification failed",
                    }
                  : entry,
              ),
            );
          }
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(MAX_CONCURRENCY, idsToClassify.length) }).map(() =>
          classifyNext(),
        ),
      );
    } catch (error) {
      setPanelError(
        error instanceof Error ? error.message : "Unable to initialize classifier",
      );
    } finally {
      setIsClassifying(false);
    }
  }, [baseCanvasStates]);

  const pendingCount = results.filter(
    (item) => item.status === "pending" || item.status === "classifying",
  ).length;
  const classifiedCount = results.filter((item) => item.status === "classified").length;
  const errorCount = results.filter((item) => item.status === "error").length;
  const visibleResults = React.useMemo(
    () =>
      results.filter((item) => {
        if (item.status !== "classified") {
          return true;
        }
        if (typeof item.confidence !== "number") {
          return false;
        }
        return item.confidence * 100 >= confidenceThreshold;
      }),
    [results, confidenceThreshold],
  );

  const navigateToCanvas = React.useCallback(
    (canvasId: string) => {
      viewerDispatch({
        type: "updateActiveCanvas",
        canvasId,
      });
    },
    [viewerDispatch],
  );

  return (
    <div style={{ padding: "0 1rem 1rem" }}>
      <button
        type="button"
        onClick={classifyManifest}
        disabled={isClassifying}
        style={{
          background: isClassifying ? "#94a3b8" : "#0f5bd8",
          color: "#ffffff",
          border: "none",
          borderRadius: "999px",
          padding: "0.5rem 0.9rem",
          fontWeight: 700,
          fontSize: "0.9rem",
          cursor: isClassifying ? "not-allowed" : "pointer",
          boxShadow: "0 2px 8px rgba(15, 91, 216, 0.25)",
          marginBottom: "0.35rem",
        }}
      >
        {isClassifying ? "Classifying..." : "Classify Manifest"}
      </button>
      <p style={{ marginBottom: "0.5rem" }}>
        Classified: {classifiedCount} | Pending: {pendingCount} | Errors: {errorCount}
      </p>
      <label
        htmlFor="confidence-threshold"
        style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem" }}
      >
        Show canvases classified above confidence threshold %: {confidenceThreshold}
      </label>
      <input
        id="confidence-threshold"
        type="range"
        min={0}
        max={100}
        step={1}
        value={confidenceThreshold}
        onChange={(event) => setConfidenceThreshold(Number(event.target.value))}
        style={{ width: "100%", marginBottom: "0.5rem" }}
      />
      {panelError ? <p style={{ color: "crimson" }}>{panelError}</p> : null}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {visibleResults.map((result) => (
          <li
            key={result.id}
            style={{
              border: activeCanvasId === result.id ? "2px solid #4f46e5" : "1px solid #ddd",
              borderRadius: "6px",
              marginBottom: "0.5rem",
              padding: "0.55rem",
              background: "#ffffff",
            }}
          >
            <button
              type="button"
              onClick={() => navigateToCanvas(result.id)}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                padding: 0,
                margin: 0,
                textAlign: "left",
                cursor: "pointer",
              }}
              aria-label={`Navigate to canvas ${result.label}`}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px minmax(0, 1fr)",
                  gap: "0.6rem",
                  alignItems: "start",
                }}
              >
                <div style={{ width: "56px", height: "74px", overflow: "hidden", borderRadius: "4px" }}>
                  {result.thumbnail ? (
                    <img
                      src={result.thumbnail[0].id}
                      alt={result.label}
                      style={{
                        width: "56px",
                        height: "74px",
                        objectFit: "cover",
                        display: "block",
                        border: "1px solid #d6d6d6",
                        borderRadius: "4px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#6b7280",
                        lineHeight: 1.2,
                      }}
                    >
                      No thumbnail
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{result.label}</div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "#4b5563",
                      wordBreak: "break-word",
                      lineHeight: 1.25,
                      marginTop: "0.1rem",
                    }}
                  >
                    {result.id}
                  </div>
                  <div style={{ fontSize: "0.8rem" }}>
                    Status: {result.status}
                    {result.predictedLabel ? ` | Label: ${result.predictedLabel}` : ""}
                    {typeof result.confidence === "number"
                      ? ` | Illustrated confidence: ${(result.confidence * 100).toFixed(1)}%`
                      : ""}
                  </div>
                  {result.error ? (
                    <div style={{ fontSize: "0.8rem", color: "crimson" }}>{result.error}</div>
                  ) : null}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const illustrationPanel = IllustrationPanel;
