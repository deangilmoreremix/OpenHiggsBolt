/**
 * OpenAI image models offered for storyboard panels. "Flare" is the fast one for quick iterations,
 * "Sunburst" the detailed one for busy scenes. Extra ids (for example a newer release) can be added without
 * a code change through STORYBOARD_OPENAI_MODELS, a comma-separated list such as
 * "gpt-image-2.6-flare:Flare 2.6 (fast),gpt-image-2.6-sunburst:Sunburst 2.6 (detailed)"; a model listed there
 * is also accepted by the storyboard route. STORYBOARD_OPENAI_MODEL sets the default.
 */
export type StoryboardOpenAiModel = { id: string; label: string }

const BUILT_IN: StoryboardOpenAiModel[] = [
  { id: 'gpt-image-2.5-flare', label: 'Flare (fast)' },
  { id: 'gpt-image-2.5-sunburst', label: 'Sunburst (detailed)' },
  { id: 'gpt-image-2', label: 'GPT Image 2' },
]

const ID = /^[a-z0-9][a-z0-9._-]{1,63}$/i

export function storyboardOpenAiModels(extra = process.env.STORYBOARD_OPENAI_MODELS || ''): StoryboardOpenAiModel[] {
  const added: StoryboardOpenAiModel[] = []
  for (const entry of extra.split(',')) {
    const [rawId, ...rest] = entry.split(':')
    const id = (rawId || '').trim()
    if (!ID.test(id)) continue
    added.push({ id, label: rest.join(':').trim() || id })
  }
  const byId = new Map<string, StoryboardOpenAiModel>()
  for (const m of [...added, ...BUILT_IN]) if (!byId.has(m.id)) byId.set(m.id, m)
  return [...byId.values()]
}

export function defaultStoryboardOpenAiModel(models = storyboardOpenAiModels()): string {
  const wanted = (process.env.STORYBOARD_OPENAI_MODEL || '').trim()
  return models.some((m) => m.id === wanted) ? wanted : models[0].id
}
