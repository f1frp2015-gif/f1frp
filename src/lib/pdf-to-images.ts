"use client";

// Rasterize a PDF File → JPEG data URLs (one per page) in the browser, so vision
// models that can't ingest PDF directly — Qwen-VL via DashScope on the domestic
// (f1frp.com) side — can read drawings as images. Overseas (Gemini) reads PDF
// natively and never calls this.
//
// pdfjs-dist is lazy-imported (dynamic import) so it stays out of the main bundle
// and never evaluates during SSR. Output is bounded by maxPages and a per-page
// canvas-dimension cap (A0 drawings would otherwise blow up memory / toDataURL).
//
// Any failure throws — callers fall back to sending the original PDF, which the
// chat route then strips with a graceful "upload an image" message. So a pdf.js
// hiccup degrades gracefully and never hard-fails the upload.

export const MAX_PDF_PAGES = 4;
// Cap the longest canvas side so oversized sheets (A0/A1 engineering drawings)
// don't exhaust memory; normal A4 still renders at the full MAX_SCALE.
const TARGET_MAX_DIM = 2200;
const MAX_SCALE = 2;
const JPEG_QUALITY = 0.85;

export async function pdfToImageDataUrls(
  file: File,
  opts?: { maxPages?: number },
): Promise<string[]> {
  const maxPages = opts?.maxPages ?? MAX_PDF_PAGES;
  if (maxPages <= 0) return [];

  const pdfjs = await import("pdfjs-dist");
  // Worker asset URL — Turbopack/Webpack resolve `new URL(…, import.meta.url)`
  // at build time and emit the worker as a chunk.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buf = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) });
  const doc = await loadingTask.promise;
  try {
    const count = Math.min(doc.numPages, maxPages);
    const urls: string[] = [];
    for (let i = 1; i <= count; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(
        MAX_SCALE,
        TARGET_MAX_DIM / Math.max(base.width, base.height),
      );
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      // `background` paints a white page backdrop (JPEG has no alpha, and many
      // PDFs rely on the viewer's white background).
      await page.render({ canvas, viewport, background: "#ffffff" }).promise;
      urls.push(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      page.cleanup();
    }
    if (urls.length === 0) throw new Error("PDF has no renderable pages");
    return urls;
  } finally {
    // loadingTask.destroy() tears down the document + worker (PDFDocumentProxy
    // itself has no destroy() in v6).
    await loadingTask.destroy();
  }
}
