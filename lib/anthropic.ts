import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

export const MODEL = 'claude-haiku-4-5-20251001'

export function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function callWithJson<T>(
  schema: z.ZodType<T>,
  opts: {
    system: string
    user: string
    temperature: number
    maxTokens: number
  },
  retries = 1
): Promise<{ data: T; inputTokens: number; outputTokens: number }> {
  const temperature = opts.temperature

  const response = await getAnthropic().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens,
    temperature,
    system: opts.system,
    messages: [{ role: 'user', content: opts.user }],
  })

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  // Remove markdown code fences if the model ignored the instruction
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonText = fenceMatch ? fenceMatch[1].trim() : raw.trim()

  let jsonValue: unknown
  try {
    jsonValue = JSON.parse(jsonText)
  } catch {
    if (retries > 0) {
      return callWithJson(schema, { ...opts, temperature: Math.max(0, temperature - 0.2) }, retries - 1)
    }
    throw new Error(`LLM retornou resposta não-JSON: ${raw.slice(0, 200)}`)
  }

  const parsed = schema.safeParse(jsonValue)
  if (parsed.success) {
    return { data: parsed.data, inputTokens, outputTokens }
  }

  if (retries > 0) {
    return callWithJson(schema, { ...opts, temperature: Math.max(0, temperature - 0.2) }, retries - 1)
  }

  throw new Error(`JSON inválido do LLM: ${parsed.error.message}`)
}
