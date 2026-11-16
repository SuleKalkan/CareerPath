import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";
import { parseCourseTranscriptText } from "./course-extraction.js";

const maxPdfPages = 30;

function getPageText(items) {
  const positionedItems = items
    .filter((item) => typeof item.str === "string" && item.str.trim())
    .map((item) => ({ text: item.str.trim(), x: item.transform[4], y: item.transform[5] }))
    .sort((left, right) => right.y - left.y || left.x - right.x);
  const lines = [];

  for (const item of positionedItems) {
    let line = lines.at(-1);
    if (!line || Math.abs(line.y - item.y) > 2.5) {
      line = { y: item.y, items: [] };
      lines.push(line);
    }
    line.items.push(item.text);
  }

  return lines.map((line) => line.items.join(" ")).join("\n");
}

function hasCourseRows(text) {
  try {
    parseCourseTranscriptText(text);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("No course rows")) return false;
    throw error;
  }
}

async function recognizePage(page, worker) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  await page.render({ canvasContext: context, viewport }).promise;
  const result = await worker.recognize(canvas.toBuffer("image/png"));
  return result.data.text;
}

export async function parseCoursePdf(input) {
  if (input.length < 5 || input.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error("The selected file is not a valid PDF.");
  }

  const loadingTask = getDocument({
    data: new Uint8Array(input),
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0,
  });
  let document;
  let worker;

  try {
    document = await loadingTask.promise;
    if (document.numPages > maxPdfPages) {
      throw new Error(`PDF transcripts can contain at most ${maxPdfPages} pages.`);
    }

    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let text = getPageText(content.items);

      if (!hasCourseRows(text)) {
        worker ??= await createWorker("eng");
        text = await recognizePage(page, worker);
      }

      pages.push(text);
      page.cleanup();
    }

    return parseCourseTranscriptText(pages.join("\n"));
  } finally {
    try {
      if (worker) await worker.terminate();
    } finally {
      await loadingTask.destroy();
    }
  }
}
