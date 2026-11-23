// Live smoke cases for the custom (non-catalog) tools. estUsd is an assumed upper figure, not a measured price:
// the spend cap counts it, and the plan prints it as "(assumed)". `needs` names the sample inputs the run needs.
export const cases = [
  { id: 'tool:skills_list', tool: 'skills_list', estUsd: 0, args: () => ({ query: 'logo' }) },
  { id: 'tool:skill_run', tool: 'skill_run', needs: ['image'], estUsd: 0.3, args: (s) => ({ slug: 'chibi-collage-effect', inputs: { person_image: s.image } }) },
  { id: 'tool:workflows_list', tool: 'workflows_list', estUsd: 0, args: () => ({ which: 'templates' }) },
  { id: 'tool:agents_list', tool: 'agents_list', estUsd: 0, args: () => ({ which: 'featured' }) },
  { id: 'tool:viral_prompts_search', tool: 'viral_prompts_search', estUsd: 0, args: () => ({ search: 'fox', page_size: 3 }) },
  { id: 'tool:design_agent_sessions', tool: 'design_agent_sessions', estUsd: 0, args: () => ({}) },
  { id: 'tool:brands_list', tool: 'brands_list', estUsd: 0, args: () => ({}) },
  { id: 'tool:campaigns_list', tool: 'campaigns_list', estUsd: 0, args: () => ({}) },
  { id: 'tool:zackd_trends', tool: 'zackd_trends', estUsd: 0.02, args: () => ({ query: 'space' }) },
  { id: 'tool:zackd_submit', tool: 'zackd_submit', estUsd: 0.1, args: () => ({ kind: 'image', prompt: 'A small red ball on a plain white table', aspect: '1:1' }) },
  { id: 'tool:thumbnail_generate', tool: 'thumbnail_generate', estUsd: 0.1, args: () => ({ prompt: 'Bold thumbnail of a red ball', aspect_ratio: '16:9', n: 1, quality: 'low' }) },
  { id: 'tool:agent_chat', tool: 'agent_chat', needs: ['agentSlug'], estUsd: 0.05, args: (s) => ({ slug: s.agentSlug, message: 'Say hello in five words.' }) },
];

// Extra no-spend gateway checks specific to this brand.
export const extraNegatives = [
  { name: 'unknown studio is refused', path: '/studio/constructor', method: 'POST', body: {}, expect: [404] },
  { name: 'workflow delete is not reachable through the raw route', path: '/raw', method: 'POST', body: { method: 'DELETE', path: '/workflow/delete-workflow-def/x' }, expect: [400] },
  { name: 'raw route refuses a path outside the allow-list', path: '/raw', method: 'POST', body: { method: 'GET', path: '/account/balance' }, expect: [400] },
];
