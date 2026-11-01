import { describe, expect, it } from "vitest";
import { resumeBlocks } from "@/lib/resume-export";

describe("resume exports", () => {
  it("preserves provided facts and accents without adding experience", () => {
    expect(resumeBlocks("# João Silva\n\n## Experiência Profissional\n- Reduzi o prazo em 20%\nAção e comunicação")).toEqual([
      { kind: "title", text: "João Silva" },
      { kind: "heading", text: "Experiência Profissional" },
      { kind: "bullet", text: "Reduzi o prazo em 20%" },
      { kind: "body", text: "Ação e comunicação" },
    ]);
  });
});