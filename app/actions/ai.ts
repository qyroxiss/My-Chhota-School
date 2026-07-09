'use server'

export type QuestionSpec = {
  count: number
  marksPerQ: number
  difficulty: string // Easy | Medium | Hard
  type: string // MCQ | Short Answer | Long Answer | Fill in the Blanks | True/False | Mixed
}

export type GenerateInput = {
  standard: string // class / standard
  subject: string
  book: string
  chapters: string
  totalMarks: number
  duration?: string
  specs: QuestionSpec[]
  groundingText?: string // optional extracted textbook/chapter PDF text
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Free models are frequently retired or upstream-rate-limited, so we try a chain and
// fall back to `openrouter/free` (OpenRouter's auto-router over available free models).
// Set OPENROUTER_MODEL in .env to force a single specific model.
const MODEL_CHAIN = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-oss-120b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openrouter/free',
]

// The exact plain-text format our parser (lib/parser.ts) understands.
const FORMAT_SPEC = `Output the question paper as PLAIN TEXT ONLY in EXACTLY this format (no markdown, no code fences, no commentary):

Class: <class>
Subject: <subject>
MM: <total marks> | Time: <duration>

I. <Section Title> (<section marks> marks)
1. <question text> (<marks>)
   a) <option or sub-part>
   b) <option or sub-part>
2. <question text> (<marks>)

II. <Section Title> (<section marks> marks)
3. <question text> (<marks>)

RULES:
- Number questions sequentially across the whole paper (1, 2, 3, ...).
- Put each question's marks in parentheses at the END of its line, e.g. "(2)".
- For MCQ questions, list the four options as sub-parts a) b) c) d) on their own indented lines.
- For Fill in the Blanks, use "_______" where the blank goes.
- For True/False, write the statement and end the line with its marks.
- Group questions into sections by type; give each section a Roman-numeral header like "I. Multiple Choice Questions (10 marks)".
- Do NOT include an answer key.
- Do NOT add any text before "Class:" or after the last question.`

export async function generateQuestionPaper(
  input: GenerateInput
): Promise<{ text?: string; error?: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return {
      error:
        'AI is not configured. Add OPENROUTER_API_KEY to your .env file (get a free key at openrouter.ai/keys) and restart the server.',
    }
  }

  if (!input.subject.trim() || !input.chapters.trim()) {
    return { error: 'Subject and chapter/topics are required to generate questions.' }
  }

  const specLines = input.specs
    .filter(s => s.count > 0)
    .map(
      s =>
        `- ${s.count} × ${s.type} question(s), ${s.marksPerQ} mark(s) each, ${s.difficulty} difficulty`
    )
    .join('\n')

  const grounding = input.groundingText?.trim()
    ? `\n\nBase the questions STRICTLY on the following textbook content. Do not invent facts beyond it:\n"""\n${input.groundingText.slice(0, 12000)}\n"""`
    : ''

  const userPrompt = `Create a school exam question paper.

Class / Standard: ${input.standard || 'Not specified'}
Subject: ${input.subject}
Book / Textbook: ${input.book || 'Not specified'}
Chapters / Topics: ${input.chapters}
Total Marks: ${input.totalMarks}
Duration: ${input.duration || '1 Hour'}

Question distribution:
${specLines || '- A reasonable mix of question types totalling the marks above'}
${grounding}

${FORMAT_SPEC}`

  const models = process.env.OPENROUTER_MODEL ? [process.env.OPENROUTER_MODEL] : MODEL_CHAIN
  const messages = [
    {
      role: 'system',
      content:
        'You are an expert Indian school teacher who writes clear, age-appropriate exam question papers. You follow the requested output format exactly.',
    },
    { role: 'user', content: userPrompt },
  ]

  let lastError = 'AI request failed.'

  for (const model of models) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://my-chhota-school.vercel.app',
          'X-Title': 'My Chhota School - Question Generator',
        },
        body: JSON.stringify({ model, temperature: 0.7, messages }),
      })

      if (res.ok) {
        const data = await res.json()
        let text: string = data?.choices?.[0]?.message?.content ?? ''
        text = stripFences(text).trim()
        if (text) return { text }
        lastError = 'AI returned an empty response.'
        continue // try the next model
      }

      // Auth errors are fatal — no point trying other models
      if (res.status === 401)
        return { error: 'AI key rejected (401). Check your OPENROUTER_API_KEY in .env.' }

      // 404 (model unavailable/retired) and 429 (rate-limited) → fall through to next model
      const detail = await res.text().catch(() => '')
      lastError = `(${res.status}) ${detail.slice(0, 160)}`
      if (res.status === 404 || res.status === 429) continue

      return { error: `AI request failed ${lastError}` }
    } catch (err: any) {
      lastError = err.message
      continue
    }
  }

  return {
    error: `All free AI models are busy or unavailable right now. Please try again in a minute. (last: ${lastError})`,
  }
}

// Some models wrap output in ``` fences despite instructions — strip them.
function stripFences(s: string): string {
  const fence = s.match(/^```(?:\w+)?\s*\n([\s\S]*?)\n```$/)
  if (fence) return fence[1]
  return s.replace(/^```(?:\w+)?/gm, '').replace(/```$/gm, '')
}
