import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Sparkles,
  Upload,
  FileText,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Toaster } from "@/components/ui/sonner";
import { analyze, type AnalysisResult, type SkillStatus } from "@/lib/ats-engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VibeMatch ATS — Match de currículo e versão ATS-friendly" },
      {
        name: "description",
        content: "Compare seu currículo com a vaga, descubra lacunas e gere uma versão compatível com robôs ATS. Tudo no seu navegador.",
      },
      { property: "og:title", content: "VibeMatch ATS" },
      { property: "og:description", content: "Score de aderência, matriz de habilidades e currículo ATS-friendly em segundos." },
    ],
  }),
  component: Index,
});

async function readFile(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const c = await (await doc.getPage(i)).getTextContent();
      let line = "";
      let lastY: number | null = null;
      const out: string[] = [];
      for (const it of c.items as { str: string; transform: number[] }[]) {
        const y = it.transform[5] ?? 0;
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          out.push(line);
          line = "";
        }
        line += it.str;
        lastY = y;
      }
      out.push(line);
      pages.push(out.join("\n"));
    }
    return pages.join("\n");
  }
  return file.text();
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Index() {
  const [resume, setResume] = useState("");
  const [fileName, setFileName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const run = () => {
    if (resume.trim().length < 30 || jd.trim().length < 30) {
      toast.error("Preencha o currículo e a descrição da vaga.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setResult(analyze(resume, jd, role));
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, 700);
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      const t = await readFile(f);
      setResume(t);
      setFileName(f.name);
      toast.success("Arquivo lido localmente no seu navegador.");
    } catch {
      toast.error("Não foi possível ler o arquivo. Tente colar o texto.");
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <div className="relative min-h-screen overflow-hidden font-sans">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-vibe opacity-20 blur-3xl" />
        <main className="relative mx-auto max-w-6xl px-4 py-10 md:py-16">
          <header className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Matchmaking de currículos + otimização ATS
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight md:text-7xl">
              Vibe<span className="text-vibe">Match</span> ATS
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Descubra o quanto seu currículo combina com a vaga, corrija lacunas e gere uma versão que os robôs de triagem
              conseguem ler perfeitamente.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Seu currículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="paste">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="paste">Colar texto</TabsTrigger>
                    <TabsTrigger value="upload">Enviar arquivo</TabsTrigger>
                  </TabsList>
                  <TabsContent value="paste">
                    <Textarea
                      value={resume}
                      onChange={(e) => setResume(e.target.value)}
                      placeholder="Cole aqui o texto completo do seu currículo…"
                      className="min-h-[300px] resize-y"
                    />
                  </TabsContent>
                  <TabsContent value="upload">
                    <label
                      className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        onFile(e.dataTransfer.files[0]);
                      }}
                    >
                      <Upload className="h-10 w-10 text-primary" />
                      <span className="font-medium">{fileName || "Arraste ou clique para enviar"}</span>
                      <span className="text-xs text-muted-foreground">.pdf, .txt ou .md</span>
                      <input
                        type="file"
                        accept=".pdf,.txt,.md"
                        className="hidden"
                        onChange={(e) => onFile(e.target.files?.[0])}
                      />
                    </label>
                  </TabsContent>
                </Tabs>
                <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Processamento seguro e efêmero: seus dados não são salvos em servidores.
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" /> Vaga de emprego
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Cargo (opcional)" />
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Empresa (opcional)" />
                </div>
                <Textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Cole a descrição completa da vaga (requisitos, responsabilidades, diferenciais)…"
                  className="min-h-[300px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Dica: inclua a seção “Requisitos” — usamos ela para identificar o que é obrigatório.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="my-10 flex justify-center">
            <Button
              size="lg"
              onClick={run}
              disabled={loading}
              className="h-14 rounded-full bg-vibe px-8 text-base font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
            >
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Analisando…
                </>
              ) : (
                <>
                  Analisar Match & Gerar Versão ATS <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          {result && (
            <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-6 space-y-6 duration-700">
              <Dashboard result={result} role={role} company={company} />
              <AtsPreview result={result} />
              <div className="flex justify-center">
                <Button variant="ghost" onClick={() => setResult(null)}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Nova análise
                </Button>
              </div>
            </div>
          )}

          <footer className="mt-16 flex items-start justify-center gap-2 text-center text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            O VibeMatch aprimora a semântica e a clareza dos fatos reais que você fornece. Ele nunca inventa experiências —
            revise tudo antes de enviar.
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}

function ScoreRing({ score }: { score: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(score, n + 2);
      setV(n);
      if (n >= score) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [score]);
  const r = 70;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={r} stroke="var(--muted)" strokeWidth="14" fill="none" />
        <circle
          cx="80"
          cy="80"
          r={r}
          stroke="url(#g)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-bold">{v}%</span>
        <span className="text-xs text-muted-foreground">aderência</span>
      </div>
    </div>
  );
}

const STATUS: Record<SkillStatus, { label: string; cls: string; Icon: typeof CheckCircle2; help: string }> = {
  match: {
    label: "Match Confirmado",
    cls: "border-success/40 bg-success/15 text-success",
    Icon: CheckCircle2,
    help: "Presente na vaga e no seu currículo.",
  },
  adjust: {
    label: "Oportunidade de Ajuste",
    cls: "border-warning/40 bg-warning/15 text-warning",
    Icon: AlertTriangle,
    help: "Você usa um sinônimo. Padronize para o termo exato da vaga.",
  },
  gap: {
    label: "Lacunas Críticas",
    cls: "border-destructive/40 bg-destructive/15 text-destructive",
    Icon: XCircle,
    help: "Pedido na vaga e ausente no currículo.",
  },
};

function Dashboard({ result, role, company }: { result: AnalysisResult; role: string; company: string }) {
  const counts = (s: SkillStatus) => result.skills.filter((k) => k.status === s).length;
  return (
    <>
      <Card className="border-primary/30 bg-card/80 shadow-glow">
        <CardContent className="grid items-center gap-8 p-6 md:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <ScoreRing score={result.score} />
          </div>
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">
              Diagnóstico{role || company ? ` · ${[role, company].filter(Boolean).join(" @ ")}` : ""}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {(["match", "adjust", "gap"] as SkillStatus[]).map((s) => (
                <div key={s} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="font-display text-2xl font-bold">{counts(s)}</div>
                  <div className="text-xs text-muted-foreground">{STATUS[s].label}</div>
                  <Progress value={result.skills.length ? (counts(s) / result.skills.length) * 100 : 0} className="mt-2 h-1.5" />
                </div>
              ))}
            </div>
            <ul className="space-y-1.5 text-sm">
              {result.feedback.map((f) => (
                <li key={f} className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle className="font-display">Matriz semântica de habilidades</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          {(["match", "adjust", "gap"] as SkillStatus[]).map((s) => {
            const { label, cls, Icon, help } = STATUS[s];
            const items = result.skills.filter((k) => k.status === s);
            return (
              <div key={s}>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4" /> {label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.length === 0 && <span className="text-xs text-muted-foreground">Nenhum item</span>}
                  {items.map((k) => (
                    <Tooltip key={k.skill}>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={`${cls} cursor-default transition-transform hover:scale-105`}>
                          {k.skill}
                          {k.required && " *"}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {k.found ? `Você escreveu "${k.found}". ` : ""}
                        {help}
                        {k.required ? " (obrigatório)" : ""}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground md:col-span-3">* requisito obrigatório na vaga</p>
        </CardContent>
      </Card>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle className="font-display">Melhorias com metodologia STAR</CardTitle>
          <p className="text-sm text-muted-foreground">Ação + Contexto + Resultado Mensurável</p>
        </CardHeader>
        <CardContent>
          {result.star.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Suas frases já parecem orientadas a resultados. Ótimo trabalho!
            </p>
          ) : (
            <Accordion type="single" collapsible defaultValue="0">
              {result.star.map((s, i) => (
                <AccordionItem key={i} value={String(i)}>
                  <AccordionTrigger className="text-left text-sm">{s.before}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                        <div className="mb-1 text-xs font-semibold uppercase text-destructive">Antes</div>
                        <p className="text-sm">{s.before}</p>
                      </div>
                      <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                        <div className="mb-1 text-xs font-semibold uppercase text-success">Depois</div>
                        <p className="text-sm">{s.after}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{s.tip}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AtsPreview({ result }: { result: AnalysisResult }) {
  const [mode, setMode] = useState<"doc" | "raw">("doc");
  const copy = async () => {
    await navigator.clipboard.writeText(mode === "raw" ? result.atsText : result.atsMarkdown);
    toast.success("Copiado para a área de transferência!");
  };
  return (
    <Card className="bg-card/80">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="font-display">Currículo ATS-friendly</CardTitle>
          <p className="text-sm text-muted-foreground">Coluna única, seções canônicas, documentos e endereços mascarados.</p>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "doc" | "raw")}>
          <TabsList>
            <TabsTrigger value="doc">Documento Limpo</TabsTrigger>
            <TabsTrigger value="raw">Texto Puro ATS</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "doc" ? (
          <article className="mx-auto max-w-3xl rounded-lg bg-foreground p-8 text-background">
            {result.atsMarkdown.split("\n").map((l, i) =>
              l.startsWith("# ") ? (
                <h3 key={i} className="font-display text-3xl font-bold">{l.slice(2)}</h3>
              ) : l.startsWith("## ") ? (
                <h4 key={i} className="mt-6 border-b border-background/20 pb-1 text-sm font-bold uppercase tracking-wider">
                  {l.slice(3)}
                </h4>
              ) : l.trim() ? (
                <p key={i} className="mt-1.5 text-sm leading-relaxed">{l}</p>
              ) : null,
            )}
          </article>
        ) : (
          <pre className="mx-auto max-h-[600px] max-w-3xl overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-6 font-mono text-xs leading-relaxed">
            {result.atsText}
          </pre>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={copy} className="bg-vibe text-primary-foreground">
            <Copy className="mr-2 h-4 w-4" /> Copiar
          </Button>
          <Button variant="outline" onClick={() => download("curriculo-ats.txt", result.atsText, "text/plain")}>
            <Download className="mr-2 h-4 w-4" /> Baixar TXT
          </Button>
          <Button variant="outline" onClick={() => download("curriculo-ats.md", result.atsMarkdown, "text/markdown")}>
            <Download className="mr-2 h-4 w-4" /> Baixar Markdown
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
