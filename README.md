# Clover Illustration Detector Plugin

A plugin for [`@samvera/clover-iiif`](https://www.npmjs.com/package/@samvera/clover-iiif) that adds an Information Panel tab to classify IIIF canvases as `illustrated` or `not-illustrated` using a lightweight Hugging Face image classification model.

## Screenshot

![Clover Illustration Detector Plugin screenshot](docs/images/screenshot.png)

## Features

- Adds an Information Panel tab (`Illustrations` by default)
- Classifies every canvas in the active manifest
- Shows status, predicted label, and illustrated confidence per canvas
- Supports confidence threshold filtering in the panel UI
- Lets users click a result to navigate to that canvas

## Development

```bash
npm install
```

Run local dev viewer (Vite, port `3003`):

```bash
npm run dev
```

Build distributable output (`dist/`, ESM + CJS + types):

```bash
npm run build
```

Watch library build:

```bash
npm run watch
```

Type-check:

```bash
npm run typecheck
```

## Notes

- The classifier model is loaded from Hugging Face:  
  `small-models-for-glam/historical-illustration-detector`
- Classification runs client-side and processes canvases concurrently.
- Canvases without an image body/thumbnail are marked as skipped.
