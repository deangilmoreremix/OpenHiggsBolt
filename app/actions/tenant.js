'use server';
import { ensureUserAndWorkspace, getCurrentWorkspace } from '../../src/lib/tenantSync';

export async function provisionUserAction() {
  try {
    const result = await ensureUserAndWorkspace();
    return { ok: true, workspace: result.workspace };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function getWorkspaceAction() {
  try {
    const workspace = await getCurrentWorkspace();
    return { ok: true, workspace };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
