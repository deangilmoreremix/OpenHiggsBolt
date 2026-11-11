/** JSON schemas of the director route's own modes (the plan/brief/direction/mapping/edit/retext ones live in directorPlan.ts, adapt in adaptPrompt.ts). OpenAI strict mode needs every one to be strict-valid: see strictSchema.ts and its test. */
export const FINAL_REVIEW_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items', 'summary'],
  properties: {
    items: {
      type: 'array',
      maxItems: 24,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'ok', 'seconds', 'text', 'stage'],
        properties: { id: { type: 'string' }, ok: { type: 'boolean' }, seconds: { type: 'array', items: { type: 'number' } }, text: { type: 'string' }, stage: { type: 'string', enum: ['3', '5', '6', 'none'] } },
      },
    },
    summary: { type: 'string' },
  },
} as const

export const REVIEW_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings', 'summary'],
  properties: {
    findings: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['second', 'severity', 'text'],
        properties: { second: { type: 'number' }, severity: { type: 'string', enum: ['fix', 'check'] }, text: { type: 'string' } },
      },
    },
    summary: { type: 'string' },
  },
} as const

export const CHAT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'revise'],
  properties: { reply: { type: 'string' }, revise: { type: 'boolean' } },
} as const
