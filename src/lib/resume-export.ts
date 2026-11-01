import regularFontUrl from "@/assets/fonts/resume-regular.ttf?url";
import boldFontUrl from "@/assets/fonts/resume-bold.ttf?url";

export type ResumeBlock = { kind: "title" | "heading" | "body" | "bullet"; text: string };

export function resumeBlocks(markdown: string): ResumeBlock[] {
  return markdown.split("\n").filter((line) => line.trim()).map((line) => {
    if (line.startsWith("# ")) return { kind: "title", text: line.slice(2) };
    if (line.startsWith("## ")) return { kind: "heading", text: line.slice(3) };
    if (line.startsWith("- ")) return { kind: "bullet", text: line.slice(2) };
    return { kind: "body", text: line };
  });
}

export async function createResumeDocx(markdown: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, LevelFormat, AlignmentType } = await import("docx");
  const doc = new Document({
    creator: "VibeMatch ATS",
    title: "Currículo",
    styles: {
      default: { document: { run: { font: "Arial", size: 22 }, paragraph: { spacing: { after: 100 } } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: "Arial", size: 36, bold: true }, paragraph: { outlineLevel: 0, spacing: { after: 200 }, keepNext: true } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: "Arial", size: 24, bold: true }, paragraph: { outlineLevel: 1, spacing: { before: 240, after: 120 }, keepNext: true } },
      ],
    },
    numbering: { config: [{ reference: "resume-bullets", levels: [{ level: 0, format: LevelFormat.BULLET,
      text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 180 } } } }] }] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children: resumeBlocks(markdown).map((block) => new Paragraph({
        ...(block.kind === "title" ? { heading: HeadingLevel.HEADING_1 } : block.kind === "heading" ? { heading: HeadingLevel.HEADING_2 } : {}),
        ...(block.kind === "bullet" ? { numbering: { reference: "resume-bullets", level: 0 } } : {}),
        children: [new TextRun(block.text)],
      })),
    }],
  });
  return Packer.toBlob(doc);
}

export async function createResumePdf(markdown: string): Promise<Blob> {
  const [{ PDFDocument }, { default: fontkit }, regularBytes, boldBytes] = await Promise.all([
    import("pdf-lib"), import("@pdf-lib/fontkit"),
    fetch(regularFontUrl).then((r) => { if (!r.ok) throw new Error("Font unavailable"); return r.arrayBuffer(); }),
    fetch(boldFontUrl).then((r) => { if (!r.ok) throw new Error("Font unavailable"); return r.arrayBuffer(); }),
  ]);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(regularBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
  doc.setTitle("Currículo");
  doc.setCreator("VibeMatch ATS");
  const width = 595.28;
  const height = 841.89;
  const margin = 56;
  let page = doc.addPage([width, height]);
  let y = height - margin;
  const newPage = () => { page = doc.addPage([width, height]); y = height - margin; };

  for (const block of resumeBlocks(markdown)) {
    const font = block.kind === "title" || block.kind === "heading" ? bold : regular;
    const size = block.kind === "title" ? 20 : block.kind === "heading" ? 12 : 10.5;
    const leading = size * 1.45;
    const indent = block.kind === "bullet" ? 12 : 0;
    const maxWidth = width - margin * 2 - indent;
    const lines: string[] = [];
    let line = "";
    // Split oversized words too, so long links cannot run off the page.
    for (const word of block.text.replace(/\t/g, " ").split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) { line = candidate; continue; }
      if (line) { lines.push(line); line = ""; }
      for (const char of word) {
        if (font.widthOfTextAtSize(line + char, size) > maxWidth && line) { lines.push(line); line = ""; }
        line += char;
      }
    }
    if (line) lines.push(line);
    const before = block.kind === "heading" ? 14 : 0;
    const keepLines = block.kind === "heading" ? lines.length + 1 : Math.min(lines.length, 2);
    if (y - before - leading * keepLines < margin) newPage();
    else y -= before;
    for (const [index, text] of lines.entries()) {
      if (y - leading < margin) newPage();
      y -= leading;
      if (block.kind === "bullet" && index === 0) page.drawText("•", { x: margin, y, font: regular, size });
      page.drawText(text, { x: margin + indent, y, font, size });
    }
    y -= block.kind === "title" ? 8 : 4;
  }
  return new Blob([new Uint8Array(await doc.save())], { type: "application/pdf" });
}

export async function deliverResumeFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (window.matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (error) { if ((error as DOMException).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}