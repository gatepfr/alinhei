import { z } from 'zod'

export const DiagnosticoSchema = z.object({
  cargo: z.string().optional(),
  empresa: z.string().optional(),
  nota_aderencia: z.coerce.number().int().min(0).max(100),
  resumo_nota: z.string(),
  pontos_fortes: z.array(z.object({
    titulo: z.string(),
    explicacao: z.string(),
  })).min(1),
  gaps_criticos: z.array(z.object({
    titulo: z.string(),
    explicacao: z.string(),
    // modelo às vezes omite o campo — aceitar ausente e normalizar para string vazia
    como_resolver: z.preprocess(val => (typeof val === 'string' ? val : ''), z.string()),
  })).min(1),
  keywords_faltantes: z.array(z.string()).min(0).max(8).default([]),
  preview_publico: z.object({
    nota: z.coerce.number().int().min(0).max(100),
    ponto_forte_destaque: z.string(),
    gap_destaque: z.string(),
  }),
})

export type Diagnostico = z.infer<typeof DiagnosticoSchema>

function trimLinkedin(s: string, max = 300): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return lastSpace > max * 0.8 ? cut.slice(0, lastSpace) : cut
}

export const CartaSchema = z.object({
  linkedin: z.string().transform(s => trimLinkedin(s)),
  email: z.string(),
})

export type Carta = z.infer<typeof CartaSchema>

export const PerguntasSchema = z.object({
  perguntas: z.array(z.object({
    pergunta: z.string(),
    tipo: z.enum(['comportamental', 'tecnica', 'situacional']),
    por_que_pode_cair: z.string(),
    resposta_star: z.object({
      situacao: z.string(),
      tarefa: z.string(),
      acao: z.string(),
      resultado: z.string(),
    }),
    dica: z.string(),
  })).min(1),
})

export type Perguntas = z.infer<typeof PerguntasSchema>
