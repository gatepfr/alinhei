# Spec: Termos de Uso e Política de Privacidade

**Data:** 2026-05-17
**Projeto:** Alinhei (alinhei.com.br)
**Responsável legal:** PAULO FABRICIO MAGRI DOS REIS — CNPJ 66.301.043/0001-15
**Contato:** suporte@alinhei.com.br

---

## Objetivo

Criar as páginas `/termos` e `/privacidade` com conteúdo legal adequado à LGPD e ao funcionamento do Alinhei, e adicionar links para elas no footer da landing.

---

## Arquitetura

### Arquivos novos

```
app/
  termos/page.tsx       — Termos de Uso
  privacidade/page.tsx  — Política de Privacidade
```

### Arquivos modificados

```
app/page.tsx            — footer ganha links "Termos de Uso" e "Privacidade"
```

### Sem novas dependências

`@tailwindcss/typography` não está na stack atual. O prose será implementado com classes Tailwind manuais (`text-sm leading-relaxed text-muted-foreground`, headings com `font-display font-bold`, etc.) para manter consistência com o design system existente.

---

## Layout de cada página

- Nav idêntico ao da landing: sticky, logo + botão "Analisar grátis"
- Conteúdo: `max-w-3xl mx-auto px-4 py-16`
- Footer idêntico ao da landing
- Tipografia manual (sem `prose`):
  - `h1`: `font-display text-3xl font-bold mb-2`
  - `h2`: `font-display text-lg font-semibold mt-10 mb-3 text-foreground`
  - `p`: `text-sm text-muted-foreground leading-relaxed mb-4`
  - `ul/li`: `list-disc list-outside ml-5 text-sm text-muted-foreground leading-relaxed`
- Data da última atualização exibida abaixo do h1

---

## Conteúdo — Termos de Uso (`/termos`)

**Última atualização:** 17 de maio de 2026

### 1. Aceitação dos Termos
Ao acessar ou usar o Alinhei, o usuário concorda com estes Termos. Se não concordar, não deve usar o serviço.

### 2. Descrição do Serviço
O Alinhei é uma plataforma online que analisa currículos em relação a descrições de vagas usando inteligência artificial e entrega: diagnóstico de aderência com nota, pontos fortes e gaps; currículo reescrito e otimizado para ATS; carta de apresentação para LinkedIn e e-mail; e simulado de entrevista com 5 perguntas no formato STAR.

O diagnóstico inicial é gratuito e não requer cadastro. A entrega completa exige pagamento de créditos.

### 3. Conta e Créditos
- Créditos são adquiridos por pagamento e debitados no momento da geração do pacote completo.
- Créditos não utilizados expiram conforme informado no momento da compra.
- Créditos não são transferíveis entre contas.

### 4. Pagamento e Reembolso
- Pagamentos são processados pelo Mercado Pago (PIX ou cartão de crédito).
- Após a geração do pacote completo, o crédito é consumido e não há reembolso, pois o serviço foi integralmente prestado.
- Em caso de falha técnica comprovada que impeça a entrega, o crédito é estornado automaticamente ou mediante solicitação para suporte@alinhei.com.br.

### 5. Uso Aceitável
É proibido:
- Usar o serviço para fins ilegais ou fraudulentos.
- Fazer scraping, engenharia reversa ou reprodução não autorizada da plataforma.
- Revender ou sublicenciar o serviço a terceiros.
- Submeter conteúdo de terceiros sem autorização.

### 6. Propriedade Intelectual
- O conteúdo gerado pela IA (currículo reescrito, cartas, simulado) é de propriedade do usuário que o gerou.
- A plataforma, marca, código e design do Alinhei são de propriedade de PAULO FABRICIO MAGRI DOS REIS.

### 7. Isenção de Garantias e Limitação de Responsabilidade
O Alinhei é fornecido "como está". Não garantimos que o uso do serviço resultará em entrevistas ou contratações. O conteúdo gerado pela IA é uma sugestão baseada no material fornecido — a decisão final de uso é do usuário.

Não somos responsáveis por danos indiretos, perda de oportunidades ou resultados de processos seletivos.

### 8. Alterações nos Termos
Podemos alterar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou aviso na plataforma. O uso continuado após a notificação implica aceitação.

### 9. Contato e Foro
Dúvidas: suporte@alinhei.com.br

Fica eleito o foro da Comarca de São Paulo — SP para dirimir quaisquer controvérsias decorrentes destes Termos.

---

## Conteúdo — Política de Privacidade (`/privacidade`)

**Última atualização:** 17 de maio de 2026

### 1. Quem somos
O Alinhei é operado por **PAULO FABRICIO MAGRI DOS REIS**, inscrito no CNPJ sob o nº **66.301.043/0001-15**, responsável pelo tratamento dos seus dados pessoais nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

### 2. Dados coletados
Coletamos apenas o necessário para prestar o serviço:

| Dado | Origem | Finalidade |
|---|---|---|
| Endereço de e-mail | Cadastro / login social | Autenticação e e-mail transacional |
| Texto do currículo | Upload do usuário | Geração da análise pela IA |
| Descrição da vaga | Formulário | Geração da análise pela IA |
| Dados de pagamento | Mercado Pago | Processamento de cobrança (não armazenamos dados de cartão) |
| Dados de uso e navegação | Google Analytics, Meta Pixel | Análise de desempenho e marketing |

### 3. Como usamos seus dados
- Gerar o diagnóstico e o pacote completo de análise.
- Enviar e-mails transacionais (confirmação de pagamento, entrega do PDF).
- Melhorar o serviço com base em métricas de uso agregadas.
- Cumprir obrigações legais.

Não usamos seus dados para treinar modelos de IA sem consentimento explícito.

### 4. Compartilhamento com terceiros
Seus dados são compartilhados apenas com os fornecedores necessários para operar o serviço:

- **Supabase** — banco de dados e autenticação (servidores nos EUA, com cláusulas de proteção adequadas)
- **Anthropic** — processamento do texto do currículo e da vaga pela IA (dado enviado apenas no momento da análise; a Anthropic não armazena inputs por padrão)
- **Mercado Pago** — processamento de pagamento
- **Resend** — envio de e-mails transacionais

Não vendemos, alugamos ou comercializamos seus dados.

### 5. Retenção e Exclusão
- O texto do currículo é excluído automaticamente em até **30 dias** após o upload.
- Dados de conta são mantidos enquanto a conta estiver ativa.
- Você pode solicitar a exclusão da sua conta e dados a qualquer momento pelo e-mail suporte@alinhei.com.br.

### 6. Seus Direitos (LGPD — art. 18)
Você tem direito a:
- Confirmar a existência de tratamento dos seus dados.
- Acessar seus dados.
- Corrigir dados incompletos ou desatualizados.
- Solicitar anonimização, bloqueio ou exclusão.
- Revogar consentimento.
- Portabilidade dos dados.

Para exercer qualquer direito, envie e-mail para suporte@alinhei.com.br. Responderemos em até 15 dias úteis.

### 7. Cookies e Rastreamento
Usamos:
- **Google Analytics (GA4)** — métricas de tráfego e comportamento agregado.
- **Meta Pixel** — mensuração de anúncios no Facebook/Instagram.

Você pode desativar cookies pelo seu navegador ou usar extensões de bloqueio de rastreadores.

### 8. Segurança
Adotamos medidas técnicas e organizacionais para proteger seus dados: comunicação criptografada (HTTPS/TLS), acesso restrito por autenticação, Row Level Security no banco de dados.

### 9. Contato e Encarregado de Dados (DPO)
**PAULO FABRICIO MAGRI DOS REIS**
CNPJ: 66.301.043/0001-15
E-mail: suporte@alinhei.com.br

---

## Footer — alteração

Adicionar no rodapé da landing (`app/page.tsx`) dois links entre os existentes:

```tsx
<Link href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
<Link href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
```

---

## Checklist de implementação

- [ ] Verificar se `@tailwindcss/typography` está em `tailwind.config.ts`; se não, usar classes manuais
- [ ] Criar `app/termos/page.tsx` com nav, conteúdo e footer
- [ ] Criar `app/privacidade/page.tsx` com nav, conteúdo e footer
- [ ] Adicionar links no footer de `app/page.tsx`
- [ ] Verificar links funcionam em dev (`pnpm dev`)
