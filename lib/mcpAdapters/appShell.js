/**
 * App-level tab tools: where the user is, and moving between studios. Navigation only changes which studio is on screen.
 * @param {{ tabs: { id: string, label: string }[], getActive: () => string, navigate: (id: string) => void }} deps
 */
export function appShellTools({ tabs, getActive, navigate }) {
  const ids = () => tabs.map((x) => x.id);
  return [
    { name: 'app_state', description: 'Which studio is open in this tab and which studios exist.', risk: 'read', schema: { type: 'object', properties: {} }, run: async () => ({ active: getActive(), studios: tabs.map((x) => ({ id: x.id, label: x.label })) }) },
    {
      name: 'app_navigate', description: 'Open a studio in this tab (ids from app_state). Studios with tab tools (storyboard, motion-director, layers) offer them while open.', risk: 'write',
      schema: { type: 'object', properties: { studio: { type: 'string', maxLength: 60 } }, required: ['studio'] },
      run: async (a) => {
        if (!ids().includes(a.studio)) throw new Error(`Unknown studio "${String(a.studio).slice(0, 40)}".`);
        navigate(a.studio);
        await new Promise((r) => setTimeout(r, 30));
        return { active: getActive() };
      },
    },
  ];
}
