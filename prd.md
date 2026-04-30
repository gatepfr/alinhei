# PRD — VagaCerta

> Avaliador de currículo + gerador de carta de apresentação + simulador de entrevista para o mercado brasileiro. Alvo: pessoas em busca ativa de emprego que precisam aumentar a taxa de resposta dos seus envios.

## 1. Visão

Em 30 segundos, qualquer candidato sobe seu currículo, cola uma vaga, e recebe um pacote completo de aplicação otimizado: diagnóstico de aderência, currículo reescrito para passar em ATS, carta de apresentação personalizada e simulado de entrevista com respostas STAR baseadas na própria experiência dele.

Funciona em modelo freemium: diagnóstico parcial é grátis (gera o "uau"), pacote completo custa R$ 9,90 via PIX.

## 2. Problema

- Brasileiro envia em média 30+ currículos sem resposta antes da primeira entrevista.
- Currículos não passam em ATS porque não têm as palavras-chave certas.
- Cartas de apresentação são genéricas ou inexistentes.
- Candidato chega despreparado para perguntas comuns que poderiam ser ensaiadas.
- Recrutadores e coaches cobram R$ 200-500 por revisão de currículo — fora do orçamento de quem está desempregado.

## 3. Solução

Plataforma web que entrega o trabalho de um coach de carreira por R$ 9,90, em menos de 1 minuto, usando IA.

## 4. Persona

- **Primária:** Profissionais de 22-45 anos em transição de carreira ou desempregados ativos. Renda familiar 2-8 salários mínimos. Buscam vagas em LinkedIn, Gupy, Catho, InfoJobs.
- **Secundária:** Recém-formados aplicando para primeiro emprego ou estágio.
- **Terciária:** Profissionais empregados que querem trocar de empresa por aumento.

## 5. Fluxo principal (happy path)

1. Usuário entra na landing → CTA "Analise seu currículo grátis"
2. Sobe PDF do currículo OU cola texto + cola descrição da vaga
3. Sistema processa em ~20s e mostra **preview grátis**:
   - Nota de aderência (0-100)
   - 1 ponto forte detalhado
   - 1 gap crítico identificado
   - Teaser do que está bloqueado: "Veja seus outros 2 pontos fortes, 2 gaps, currículo reescrito, carta de apresentação e 5 perguntas da entrevista com respostas prontas"
4. CTA "Liberar pacote completo — R$ 9,90 no PIX" (ou pacote 3 a R$ 19,90 / pacote 10 a R$ 49,90)
5. Cadastro rápido (email + senha ou Google) + checkout Mercado Pago
6. Após confirmação do PIX, libera entrega completa na tela + envia por email
7. Tela final: botão "Compartilhar minha nota no LinkedIn" (gera card visual com a nota) + CTA "Analise mais uma vaga"

## 6. Entregáveis (1 crédito)

| Item | Formato |
|------|---------|
| Diagnóstico completo | Tela web (3 pontos fortes + 3 gaps com como resolver) |
| Currículo reescrito | PDF + Markdown copiável |
| Carta versão LinkedIn | Texto copiável (300-400 chars) |
| Carta versão e-mail | Texto copiável (150-200 palavras) |
| 5 perguntas + respostas STAR | Tela web + PDF |

## 7. Modelo de cobrança

- **Avulso:** R$ 9,90 (1 crédito, válido 30 dias)
- **Pacote 3:** R$ 19,90 (3 créditos, válidos 30 dias) — desconto 33%
- **Pacote 10:** R$ 49,90 (10 créditos, válidos 90 dias) — desconto 50%
- **Indicação:** Compartilhar nota no LinkedIn ganha 1 crédito grátis (validado por screenshot ou link).

Sem assinatura no V1. Crédito reduz fricção e PIX fecha em 30 segundos.

## 8. Stack técnica

- **Frontend:** Next.js 14 (App Router) + Tailwind + shadcn/ui
- **Backend:** Next.js API routes (Node.js)
- **Auth + DB:** Supabase
- **Storage:** Supabase Storage (PDFs gerados)
- **LLM:** Anthropic API com Claude Haiku (custo ~R$ 0,10 por análise completa)
- **Pagamento:** Mercado Pago (PIX + cartão), webhook para confirmação
- **Hosting:** Vercel (free tier no V1)
- **Email transacional:** Resend (free tier 100 emails/dia)
- **PDF parsing (entrada):** pdf-parse
- **PDF generation (saída):** @react-pdf/renderer

## 9. Métricas de sucesso

| Métrica | Meta V1 (mês 1) | Meta V2 (mês 3) |
|---------|------------------|------------------|
| Visitantes únicos | 5.000 | 30.000 |
| Análises grátis iniciadas | 1.500 | 10.000 |
| Conversão grátis → pago | 8% | 12% |
| Receita mensal | R$ 1.500 | R$ 12.000 |
| CAC (orgânico) | < R$ 0 | < R$ 2 |
| Custo por análise (LLM) | < R$ 0,15 | < R$ 0,12 |
| NPS pós-entrega | > 50 | > 65 |

## 10. Out of scope no V1 (backlog V2+)

- Simulado de entrevista com voz (Whisper + áudio).
- Otimização específica para LinkedIn (headline, sobre, recomendações).
- Plano de carreira ("para chegar nessa vaga, faça X cursos").
- Integração com Gupy/Catho para aplicar direto.
- Versão B2B (RH ou outplacement de empresa).
- Versão em inglês para vagas internacionais.
- App mobile.

## 11. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Custo de LLM disparar com volume | Usar Haiku, cachear prompts comuns, limitar tamanho de input (max 8k tokens curr+vaga) |
| Usuário sobe PDF malformado/imagem | Detectar e pedir versão em texto, ou OCR no V2 |
| Candidato esperar 100% de honestidade no currículo | Prompt do sistema é explícito em nunca inventar dados |
| Mercado Pago demorar a aprovar PIX | Webhook + polling de fallback de 30s |
| Concorrente clonar | Foco em construção de marca + comunidade no LinkedIn (terreno do Paulo) |
