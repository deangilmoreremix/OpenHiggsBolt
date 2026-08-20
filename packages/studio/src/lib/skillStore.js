export function getPendingRecipe(studio) {
  try {
    const r = JSON.parse(localStorage.getItem('pending_recipe') || '{}');
    return r.studio === studio ? r.slug : null;
  } catch {
    return null;
  }
}

export function setPendingRecipe(slug, studio) {
  localStorage.setItem('pending_recipe', JSON.stringify({ slug, studio }));
}

export function clearPendingRecipe(studio) {
  try {
    const r = JSON.parse(localStorage.getItem('pending_recipe') || '{}');
    if (r.studio === studio) localStorage.removeItem('pending_recipe');
  } catch {}
}
