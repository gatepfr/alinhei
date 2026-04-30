import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MODEL = 'claude-haiku-4-5-20251001'

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

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens,
    temperature,
    system: opts.system,
    messages: [{ role: 'user', content: opts.user }],
  })

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  const parsed = schema.safeParse(JSON.parse(raw))
  if (parsed.success) {
    return { data: parsed.data, inputTokens, outputTokens }
  }

  if (retries > 0) {
    return callWithJson(schema, { ...opts, temperature: Math.max(0, temperature - 0.2) }, retries - 1)
  }

  throw new Error(`JSON inválido do LLM: ${parsed.error.message}`)
}
