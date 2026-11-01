# VibeMatch ATS

> Projeto do desafio da DIO: **Criando um Gerador de Currículos ATS Friendly com Lovable**

**Aplicação publicada:** https://vibematchats.lovable.app

VibeMatch ATS compara um currículo com uma vaga, mostra o percentual de match, as palavras-chave encontradas e as que faltam, e gera uma versão do currículo ajustada para ATS, pronta para baixar em PDF ou Word (.docx).

> **Regra de ética:** a aplicação melhora a forma como a pessoa se apresenta e **nunca inventa experiências**. As sugestões só reescrevem fatos reais. Quando falta um número (por exemplo, um resultado em %), ela deixa um espaço marcado para a própria pessoa preencher.

---

## 1. Qual problema a aplicação resolve

Muitas empresas usam um ATS (*Applicant Tracking System*) que ranqueia candidatos antes de qualquer pessoa do RH ler o currículo. Um bom profissional pode ser descartado só porque o currículo não usa os termos da vaga ou tem um formato que o sistema não consegue ler.

O VibeMatch ATS mostra, em segundos:
- o quanto o currículo combina com a vaga;
- quais competências já aparecem, quais aparecem só em parte e quais faltam;
- como reescrever conquistas no formato STAR (Situação, Tarefa, Ação, Resultado);
- uma versão limpa e legível por ATS, para baixar na hora.

**Privacidade:** toda a análise roda no navegador. Nenhum dado do currículo é enviado para servidor, não há login e não há banco de dados. CPF e endereço completo são ocultados automaticamente na versão gerada.

---

## 2. O mega prompt e o que mudou

O prompt inicial foi escrito em Markdown com apoio de uma IA generativa e colado no Lovable. Resumo das seções:

1. **Visão geral e experiência:** colar ou enviar o currículo e a descrição da vaga, e receber uma análise comparativa (matchmaking) com otimização para ATS.
2. **Design system:** shadcn/ui, tema escuro neutro com acentos violeta elétrico e coral, interface em português.
3. **Painel de resultados:** score de aderência, matriz de competências (verde / âmbar / vermelho) e cartões "Antes vs Depois" no modelo STAR.
4. **Currículo ATS:** pré-visualização em layout de coluna única, sem tabelas nem gráficos, e com dados sensíveis ocultados.
5. **Ética de conteúdo:** aviso explícito de que nada é inventado.
6. **Motor de simulação:** lógica em TypeScript no navegador que calcula o score pela interseção real de palavras-chave entre o currículo e a vaga.

**O que mudou até a versão final:**
- O nome **VibeMatch ATS** foi adotado.
- A exportação em **PDF e .docx** foi incluída depois da primeira geração.
- A ideia de usar o **link da vaga** no lugar do texto foi avaliada e ficou para uma versão futura (ver `melhorias.md`), porque ler sites de vagas exigiria um servidor e quebraria a regra de privacidade.

---

## 3. Como a análise funciona

```text
Vaga colada ──┐
              ├─> Normalização e extração de termos ─> Match ─> Resultados ─> Currículo ATS ─> PDF / DOCX
Currículo ────┘     (acentos, sinônimos, stopwords)     (%)
```

1. **Entrada:** a pessoa cola o currículo (ou envia .pdf, .txt ou .md) e cola a descrição da vaga, com cargo e empresa.
2. **Normalização:** o texto é convertido para minúsculas, os acentos e as palavras sem peso (stopwords) são removidos, e sinônimos conhecidos são agrupados.
3. **Extração de requisitos:** termos e competências relevantes são identificados na vaga.
4. **Cálculo do match:** cada requisito é classificado como *encontrado*, *parcial* ou *ausente* no currículo, e o score é a proporção ponderada desses requisitos.
5. **Feedback:** a aplicação mostra mensagens contextuais e sugestões no formato STAR, sempre baseadas em frases reais do currículo.
6. **Currículo ATS:** o currículo é montado em seções padrão (Resumo, Competências, Experiência, Formação), com CPF e endereço ocultados.
7. **Exportação:** os arquivos PDF e .docx são gerados no próprio navegador.

Arquivos principais:
- `src/lib/ats-engine.ts`: motor de análise (funções puras).
- `src/lib/resume-export.ts`: geração de PDF e DOCX.
- `src/routes/index.tsx`: interface.
- `src/test/`: testes automatizados.

---

## 4. Ajustes pedidos depois da primeira geração

| Ajuste | Por quê |
|---|---|
| Download em **PDF e Word (.docx)** | Quem procura emprego precisa do currículo na hora, e o .docx permite editar antes de enviar. |
| Correções de tipagem no motor e na leitura de PDF | Garantir que a aplicação compile e se comporte de forma estável. |
| Documento **`melhorias.md`** | Registrar ideias para versões futuras sem aumentar o escopo atual. |
| Avaliação do campo "link da vaga" | Adiada para preservar a privacidade e a simplicidade (ver `melhorias.md`). |

---

## 5. Exemplo de uso

1. Abra https://vibematchats.lovable.app
2. Cole o seu currículo na coluna da esquerda.
3. Cole a descrição da vaga à direita e informe cargo e empresa.
4. Clique em **"Analisar Match & Gerar Versão ATS"**.
5. Confira o score, a matriz de competências e as sugestões STAR.
6. Baixe o currículo em **PDF** ou **DOCX**.

> Dica para o portfólio: adicione aqui prints da tela de análise (por exemplo, em `docs/prints/`).

---

## 6. Tecnologias

TanStack Start, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Vitest, docx e pdf-lib. Construído com [Lovable](https://lovable.dev).

### Rodar localmente

```sh
git clone <url-do-repositorio>
cd vibematch-ats
npm i
npm run dev
```

Para rodar os testes: `npx vitest run`
