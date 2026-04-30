import { z } from 'zod'

export const DiagnosticoSchema = z.object({
  nota_aderencia: z.number().int().min(0).max(100),
  resumo_nota: z.string(),
  pontos_fortes: z.array(z.object({
    titulo: z.string(),
    explicacao: z.string(),
  })).length(3),
  gaps_criticos: z.array(z.object({
    titulo: z.string(),
    explicacao: z.string(),
    como_resolver: z.string(),
  })).length(3),
  preview_publico: z.object({
    nota: z.number().int().min(0).max(100),
    ponto_forte_destaque: z.string(),
    gap_destaque: z.string(),
  }),
})

export type Diagnostico = z.infer<typeof DiagnosticoSchema>

export const CartaSchema = z.object({
  linkedin: z.string(),
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
  })).length(5),
})

export type Perguntas = z.infer<typeof PerguntasSchema>
