# PRD — VibeMatch ATS

> Product Requirements Document do projeto do desafio da DIO: **Criando um Gerador de Currículos ATS Friendly com Lovable**

- **Produto:** VibeMatch ATS
- **Versão:** 1.0 (MVP entregue)
- **Aplicação publicada:** https://vibematchats.lovable.app

---

## 1. Problema

Muitas empresas usam um ATS (*Applicant Tracking System*) que ranqueia candidatos antes de qualquer pessoa do RH ler o currículo. Bons profissionais são descartados porque o currículo não usa os termos da vaga ou tem um formato que o sistema não consegue ler. Além disso, quem procura emprego geralmente precisa do currículo ajustado **na hora**, sem cadastro e sem espera.

## 2. Público-alvo

Pessoas em busca de emprego no Brasil, especialmente as que se candidatam a várias vagas e precisam adaptar o currículo para cada anúncio.

## 3. Objetivo do produto

Mostrar, em segundos, o quanto um currículo combina com uma vaga e gerar uma versão otimizada para ATS, pronta para baixar — tudo no navegador, sem envio de dados a servidores.

## 4. Requisitos funcionais

| # | Requisito | Status |
|---|---|---|
| RF1 | Colar o texto do currículo ou enviar arquivo (.pdf, .txt, .md) | ✅ Entregue |
| RF2 | Colar a descrição da vaga, com cargo e empresa | ✅ Entregue |
| RF3 | Calcular o score de aderência pela interseção real de palavras-chave | ✅ Entregue |
| RF4 | Exibir matriz de competências (encontrado / parcial / ausente) | ✅ Entregue |
| RF5 | Gerar sugestões "Antes vs Depois" no formato STAR, baseadas em frases reais | ✅ Entregue |
| RF6 | Montar currículo ATS em coluna única, sem tabelas nem gráficos | ✅ Entregue |
| RF7 | Ocultar CPF e endereço completo na versão gerada | ✅ Entregue |
| RF8 | Exportar o currículo em PDF e Word (.docx), gerados no navegador | ✅ Entregue |
| RF9 | Campo de link da vaga com leitura automática | ⏳ Pós-MVP (ver `melhorias.md`) |
| RF10 | Simulador de perguntas de entrevista baseado nos gaps | ⏳ Pós-MVP |

## 5. Requisitos não funcionais

- **Privacidade:** toda a análise roda no navegador; nenhum dado do currículo sai da máquina do usuário.
- **Sem login e sem banco de dados:** nada é persistido; os dados vivem apenas na memória da página.
- **Idioma:** interface em português (pt-BR).
- **Desempenho:** análise instantânea, sem chamadas de rede.
- **Compatibilidade ATS:** saída em layout de coluna única, fontes padrão, texto selecionável.

## 6. Restrições éticas

- O sistema **nunca inventa experiências**: as sugestões apenas reescrevem fatos reais do currículo.
- Quando falta um número (ex.: resultado em %), um espaço marcado é deixado para a própria pessoa preencher.
- O aviso ético é exibido de forma explícita na interface.

## 7. Métricas de sucesso (qualitativas)

- O usuário consegue ir do currículo colado ao download em menos de 2 minutos.
- O score e a matriz de competências refletem de forma verificável o texto inserido (interseção real de termos).
- O PDF/DOCX gerado é legível por ATS (texto puro, sem elementos gráficos que quebrem a leitura).

## 8. Roadmap

As ideias pós-MVP estão registradas em [`melhorias.md`](melhorias.md): campo de link da vaga, simulador de entrevista, novos modelos de exportação e histórico local de versões.
