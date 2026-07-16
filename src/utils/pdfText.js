// ---------------------------------------------------------------------------
// PDF text-layer extraction — shared by every statement provider parser.
// Reads entirely in the browser via pdf.js; the file never leaves the device.
// ---------------------------------------------------------------------------
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return fullText;
}
