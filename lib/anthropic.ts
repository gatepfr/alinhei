import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

export const MODEL = 'claude-haiku-4-5-20251001'

export function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function callWithJson<S extends z.ZodTypeAny>(
  schema: S,
  opts: {
    system: string
    user: string
    temperature: number
    maxTokens: number
  },
  retries = 1
): Promise<{ data: z.output<S>; inputTokens: number; outputTokens: number }> {
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

  // Extract JSON: strip complete code fences, or fall back to brace range
  // (handles unclosed fences where the model omits the closing ```)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  let jsonText: string
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim()
  } else {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    jsonText = start >= 0 && end > start ? raw.slice(start, end + 1) : raw.trim()
  }

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
