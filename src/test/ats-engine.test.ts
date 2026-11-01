import { describe, it, expect } from "vitest";
import { analyzeSkills, computeScore, maskPII } from "@/lib/ats-engine";

describe("ats engine", () => {
  it("classifies match, synonym and gap", () => {
    const r = analyzeSkills("Experiência com ReactJS e TypeScript", "Requisitos: React, TypeScript, Docker");
    const by = Object.fromEntries(r.map((s) => [s.skill, s.status]));
    expect(by["TypeScript"]).toBe("match");
    expect(by["React"]).toBe("adjust");
    expect(by["Docker"]).toBe("gap");
  });
  it("scores 100 when everything matches and 0 when nothing does", () => {
    expect(computeScore([{ skill: "a", status: "match", required: true }])).toBe(100);
    expect(computeScore([{ skill: "a", status: "gap", required: false }])).toBe(0);
  });
  it("masks CPF", () => {
    expect(maskPII("CPF 123.456.789-00")).not.toContain("123.456");
  });
});
