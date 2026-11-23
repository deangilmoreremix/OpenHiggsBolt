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
  // Read-only tools of the server-side feature set (no spend). Create/publish/delete tools are not smoke-run: they change or send real data
  // and are covered offline only; run them by hand with confirm: true against a throwaway page or workflow.
  { id: 'tool:video_pages_list', tool: 'video_pages_list', estUsd: 0, args: () => ({}) },
  { id: 'tool:assets_library_list', tool: 'assets_library_list', estUsd: 0, args: () => ({ limit: 3 }) },
  { id: 'tool:history_list', tool: 'history_list', estUsd: 0, args: () => ({ limit: 3 }) },
  { id: 'tool:social_accounts_list', tool: 'social_accounts_list', estUsd: 0, args: () => ({}) },
  { id: 'tool:edit_tools_list', tool: 'edit_tools_list', estUsd: 0, args: () => ({ query: 'upscale' }) },
  { id: 'tool:photo_studio_history', tool: 'photo_studio_history', estUsd: 0, args: () => ({ page_size: 3 }) },
  { id: 'tool:usage_info', tool: 'usage_info', estUsd: 0, args: () => ({}) },
  { id: 'tool:agent_chat', tool: 'agent_chat', needs: ['agentSlug'], estUsd: 0.05, args: (s) => ({ slug: s.agentSlug, message: 'Say hello in five words.' }) },
];

// Extra no-spend gateway checks specific to this brand.
export const extraNegatives = [
  { name: 'unknown studio is refused', path: '/studio/constructor', method: 'POST', body: {}, expect: [404] },
  { name: 'deleting through the raw route needs confirm', path: '/raw', method: 'POST', body: { method: 'DELETE', path: '/workflow/delete-workflow-def/x' }, expect: [409] },
  { name: 'publishing a page needs confirm', path: '/studio/pages', method: 'POST', body: { action: 'publish', id: 'abcdefgh12' }, expect: [409] },
  { name: 'posting to a social account needs confirm', path: '/studio/social', method: 'POST', body: { action: 'publish', platform: 'x', account_id: '1', media_url: 'https://example.com/a.mp4' }, expect: [409] },
  { name: 'raw route refuses a path outside the allow-list', path: '/raw', method: 'POST', body: { method: 'GET', path: '/account/balance' }, expect: [400] },
];
