// VibeMatch ATS — client-side matching engine. Pure functions, no I/O.

export type SkillStatus = "match" | "adjust" | "gap";
export interface SkillResult {
  skill: string;
  status: SkillStatus;
  found?: string; // synonym found in resume (for "adjust")
  required: boolean;
}
export interface StarSuggestion {
  before: string;
  after: string;
  tip: string;
}
export interface AnalysisResult {
  score: number;
  skills: SkillResult[];
  star: StarSuggestion[];
  feedback: string[];
  atsMarkdown: string;
  atsText: string;
}

// canonical term -> accepted synonyms/related terms
const SKILLS: Record<string, string[]> = {
  JavaScript: ["js", "ecmascript", "es6"],
  TypeScript: ["ts"],
  React: ["react.js", "reactjs"],
  "Next.js": ["nextjs"],
  "Vue.js": ["vue", "vuejs"],
  Angular: ["angularjs"],
  "Node.js": ["node", "nodejs"],
  Python: ["py"],
  Java: ["jvm", "spring"],
  "C#": [".net", "dotnet"],
  Go: ["golang"],
  SQL: ["mysql", "postgresql", "postgres", "sql server", "oracle"],
  NoSQL: ["mongodb", "dynamodb", "cassandra"],
  AWS: ["amazon web services", "ec2", "s3", "lambda"],
  Azure: ["microsoft azure"],
  GCP: ["google cloud"],
  Docker: ["containers", "conteineres"],
  Kubernetes: ["k8s", "eks", "gke"],
  "CI/CD": ["github actions", "jenkins", "gitlab ci", "pipeline", "integracao continua"],
  Git: ["github", "gitlab", "versionamento"],
  "REST API": ["rest", "restful", "api", "apis"],
  GraphQL: ["apollo"],
  Microservices: ["microsservicos", "microservicos"],
  "Testes automatizados": ["jest", "vitest", "cypress", "tdd", "unit tests", "testes unitarios"],
  Agile: ["scrum", "kanban", "metodologias ageis", "agil"],
  "Machine Learning": ["ml", "aprendizado de maquina", "deep learning"],
  "Power BI": ["powerbi", "tableau", "looker"],
  Excel: ["planilhas", "spreadsheets"],
  "Data Analysis": ["analise de dados", "analytics", "data analytics"],
  Figma: ["sketch", "adobe xd"],
  "UX/UI": ["ux", "ui", "user experience", "experiencia do usuario"],
  Linux: ["unix", "bash", "shell"],
  Terraform: ["iac", "infraestrutura como codigo"],
  Liderança: ["lideranca", "gestao de equipes", "leadership", "team lead", "lider"],
  Comunicação: ["comunicacao", "communication"],
  Inglês: ["ingles", "english"],
  SEO: ["search engine optimization"],
  Marketing: ["marketing digital", "growth"],
  Vendas: ["sales", "comercial"],
  CRM: ["salesforce", "hubspot"],
  "Gestão de projetos": ["gestao de projetos", "project management", "pmp", "pmo"],
  Kotlin: [],
  Swift: ["ios"],
  Flutter: ["dart"],
  PHP: ["laravel"],
  Ruby: ["rails"],
};

const STOP = new Set(
  "para com que uma das dos nas nos por como mais sua seu suas seus ser ter sera voce nossa nosso empresa vaga time area experiencia conhecimento conhecimentos trabalho atuar sobre entre desejavel diferencial requisitos responsabilidades atividades will with that this from have your team work the and for are you our about years anos".split(
    " ",
  ),
);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function has(text: string, term: string): boolean {
  const t = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9#+])${t}($|[^a-z0-9#+])`).test(text);
}

const REQUIRED_HINT = /(obrigatori|requisito|required|must|imprescindivel|essencial|necessari)/;

function isRequired(jd: string, term: string): boolean {
  const lines = jd.split(/\n|\.\s/);
  let section = false;
  for (const line of lines) {
    const l = normalize(line);
    if (/^\s*(requisitos|requirements|obrigatorio|must have)/.test(l)) section = true;
    else if (/^\s*(diferencia|desejavel|nice to have|beneficios|plus)/.test(l)) section = false;
    if (has(l, term) && (section || REQUIRED_HINT.test(l))) return true;
  }
  return false;
}

export function analyzeSkills(resume: string, jd: string): SkillResult[] {
  const r = normalize(resume);
  const j = normalize(jd);
  const out: SkillResult[] = [];
  const seen = new Set<string>();
  for (const [canon, syns] of Object.entries(SKILLS)) {
    const variants = [canon, ...syns];
    const jdHit = variants.find((v) => has(j, v));
    if (!jdHit) continue;
    seen.add(normalize(canon));
    syns.forEach((s) => seen.add(normalize(s)));
    const required = isRequired(jd, jdHit);
    // exact: same term the JD uses, or the canonical name
    if (has(r, jdHit) || has(r, canon)) {
      out.push({ skill: canon, status: "match", required });
    } else {
      const syn = variants.find((v) => has(r, v));
      out.push(
        syn
          ? { skill: canon, status: "adjust", found: syn, required }
          : { skill: canon, status: "gap", required },
      );
    }
  }
  // frequent JD keywords outside the dictionary
  const freq = new Map<string, number>();
  for (const w of j.match(/[a-z][a-z0-9+#]{4,}/g) ?? []) {
    if (STOP.has(w) || seen.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  [...freq.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([w]) => {
      const required = isRequired(jd, w);
      out.push({ skill: w, status: has(r, w) ? "match" : "gap", required });
    });
  return out;
}

export function computeScore(skills: SkillResult[]): number {
  if (!skills.length) return 0;
  let total = 0;
  let got = 0;
  for (const s of skills) {
    const w = s.required ? 2 : 1;
    total += w;
    if (s.status === "match") got += w;
    else if (s.status === "adjust") got += w * 0.6;
  }
  return Math.round((got / total) * 100);
}

const WEAK = /^(responsavel por|responsible for|ajudei|ajudar|participei|participacao|auxiliei|trabalhei|atuei|fazia|realizava|helped|worked on|was involved)/;
const VERB_MAP: [RegExp, string][] = [
  [/^(responsavel por|responsible for)\s*/i, "Liderei "],
  [/^(ajudei a|ajudei|auxiliei|helped)\s*/i, "Contribuí diretamente para "],
  [/^(participei d[aeo]s?|participei|participacao em|was involved in)\s*/i, "Conduzi "],
  [/^(trabalhei com|trabalhei em|worked on)\s*/i, "Desenvolvi soluções com "],
  [/^(atuei com|atuei em|atuei)\s*/i, "Executei "],
  [/^(fazia|realizava)\s*/i, "Realizei "],
];

export function starSuggestions(resume: string): StarSuggestion[] {
  const lines = resume
    .split("\n")
    .map((l) => l.replace(/^[\s•\-*–·]+/, "").trim())
    .filter((l) => l.length > 20 && l.length < 220);
  const picks = lines.filter((l) => !/\d/.test(l) && WEAK.test(normalize(l)));
  const fallback = lines.filter((l) => !/\d/.test(l) && !picks.includes(l) && /^[A-ZÀ-Ú]/.test(l) && l.split(" ").length > 5);
  return [...picks, ...fallback].slice(0, 4).map((before) => {
    const plain = before.replace(/\.$/, "");
    let rewritten = plain;
    for (const [re, rep] of VERB_MAP) {
      const norm = normalize(plain);
      const m = norm.match(re);
      if (m) {
        rewritten = rep + plain.slice(m[0].length);
        break;
      }
    }
    if (rewritten === plain) rewritten = "Implementei: " + plain.charAt(0).toLowerCase() + plain.slice(1);
    return {
      before,
      after: `${rewritten}, [contexto: equipe/projeto], resultando em [métrica real, ex.: +X% ou −Y horas].`,
      tip: "Preencha os colchetes apenas com dados reais que você consegue comprovar.",
    };
  });
}

// --- anonymization ---
export function maskPII(text: string): string {
  return text
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "***.***.***-**") // CPF
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, "**.***.***/****-**") // CNPJ
    .replace(/\b(RG|CPF|SSN|Passaporte)[:\s]*[\w.\-/]+/gi, "$1: [oculto]")
    .replace(
      /\b(Rua|R\.|Avenida|Av\.|Travessa|Alameda|Rodovia|Estrada|Street|St\.)\s+[^,\n]+,?\s*(n[ºo°.]?\s*)?\d+[^\n]*/gi,
      "[endereço residencial oculto]",
    )
    .replace(/\b\d{5}-?\d{3}\b/g, "*****-***"); // CEP
}

// --- ATS resume builder ---
const SECTION_RE: [keyof Sections, RegExp][] = [
  ["summary", /^(resumo|perfil|sobre|objetivo|summary|profile|about)/],
  ["skills", /^(habilidades|competencias|skills|tecnologias|conhecimentos)/],
  ["experience", /^(experiencia|historico profissional|experience|work)/],
  ["education", /^(formacao|educacao|escolaridade|education|academic)/],
];
interface Sections {
  contact: string[];
  summary: string[];
  skills: string[];
  experience: string[];
  education: string[];
}

export function splitSections(resume: string): Sections {
  const s: Sections = { contact: [], summary: [], skills: [], experience: [], education: [] };
  let cur: keyof Sections = "contact";
  for (const raw of resume.split("\n")) {
    const line = raw.replace(/^#+\s*/, "").trim();
    if (!line) continue;
    const n = normalize(line).replace(/[:\s]+$/, "");
    const hit = n.length < 40 ? SECTION_RE.find(([, re]) => re.test(n)) : undefined;
    if (hit) {
      cur = hit[0];
      continue;
    }
    s[cur].push(line.replace(/^[•\-*–·]\s*/, "- "));
  }
  return s;
}

export function buildAts(resume: string, skills: SkillResult[], role?: string) {
  const sec = splitSections(maskPII(resume));
  const skillList = new Set<string>();
  skills.filter((k) => k.status !== "gap").forEach((k) => skillList.add(k.skill));
  sec.skills
    .join(", ")
    .split(/[,;|•]/)
    .map((x) => x.replace(/^- /, "").trim())
    .filter((x) => x && x.length < 40)
    .forEach((x) => skillList.add(x));
  const name = sec.contact[0] ?? "Seu Nome";
  const contact = sec.contact.slice(1);
  const summary = sec.summary.length
    ? sec.summary.join(" ")
    : `Profissional${role ? ` com foco em ${role}` : ""}. Adicione um resumo de 3 linhas com seus fatos reais.`;
  const block = (title: string, lines: string[]) =>
    `## ${title}\n${lines.length ? lines.join("\n") : "- (adicione esta seção)"}\n`;
  const md = [
    `# ${name}`,
    "",
    block("Dados de Contato", contact),
    block("Resumo Profissional", [summary]),
    block("Habilidades Técnicas", [[...skillList].join(", ")].filter(Boolean)),
    block("Experiência Profissional", sec.experience),
    block("Formação Acadêmica", sec.education),
  ].join("\n");
  const txt = md
    .replace(/^# (.*)$/m, (_, t: string) => t.toUpperCase())
    .replace(/^## (.*)$/gm, (_, t: string) => `\n${t.toUpperCase()}\n${"-".repeat(t.length)}`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { md, txt };
}

export function analyze(resume: string, jd: string, role?: string): AnalysisResult {
  const skills = analyzeSkills(resume, jd);
  const score = computeScore(skills);
  const gaps = skills.filter((s) => s.status === "gap");
  const req = gaps.filter((s) => s.required);
  const adj = skills.filter((s) => s.status === "adjust");
  const feedback: string[] = [];
  if (!skills.length) feedback.push("Não identificamos requisitos claros na vaga. Cole a descrição completa.");
  if (score >= 80) feedback.push("Excelente aderência: seu currículo cobre a maioria dos requisitos.");
  else if (score >= 55) feedback.push("Boa base, mas há ajustes que podem colocar você no topo da triagem.");
  else if (skills.length) feedback.push("Aderência baixa: o ATS pode descartar este currículo antes de um humano lê-lo.");
  if (req.length) feedback.push(`Requisitos obrigatórios ausentes: ${req.map((s) => s.skill).join(", ")}. Inclua-os somente se você realmente os domina.`);
  if (adj.length) feedback.push(`Padronize termos: use "${adj[0].skill}" em vez de "${adj[0].found}" — robôs buscam o termo exato da vaga.`);
  if (!/\d/.test(resume)) feedback.push("Nenhuma métrica encontrada. Quantifique resultados (%, R$, prazos, volume).");
  const { md, txt } = buildAts(resume, skills, role);
  return { score, skills, star: starSuggestions(resume), feedback, atsMarkdown: md, atsText: txt };
}
