'use client';

import { useCallback, useEffect, useState } from 'react';
import { listMcpKeys, createMcpKey, revokeMcpKey, rotateMcpKey, listMcpAudit, mcpInstallSnippets } from '../../../lib/mcpAccessClient.js';

// MCP access: create a key, paste it into Claude / Cursor, revoke it any time. The key uses the API key saved in Settings.
export default function McpAccessPage() {
  const [keys, setKeys] = useState(null);
  const [fresh, setFresh] = useState(null);
  const [status, setStatus] = useState({ msg: '', bad: false });
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState(null);

  const refresh = useCallback(async () => {
    try { setKeys(await listMcpKeys()); } catch (e) { setKeys([]); setStatus({ msg: e.message, bad: true }); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const onCreate = async () => {
    setBusy(true); setStatus({ msg: 'Creating…', bad: false });
    try {
      const made = await createMcpKey('MCP key');
      setFresh({ key: made.key, ...mcpInstallSnippets(made.key) });
      setStatus({ msg: 'Key created.', bad: false });
      await refresh();
    } catch (e) { setStatus({ msg: e.message, bad: true }); } finally { setBusy(false); }
  };
  const onRevoke = async (id) => {
    try { await revokeMcpKey(id); setStatus({ msg: 'Key revoked.', bad: false }); await refresh(); } catch (e) { setStatus({ msg: e.message, bad: true }); }
  };

  const onRotate = async (id) => {
    setBusy(true); setStatus({ msg: 'Rotating…', bad: false });
    try {
      const made = await rotateMcpKey(id);
      setFresh({ key: made.key, ...mcpInstallSnippets(made.key) });
      setStatus({ msg: 'New key created and the old one revoked. Copy the new key now.', bad: false });
      await refresh();
    } catch (e) { setStatus({ msg: e.message, bad: true }); } finally { setBusy(false); }
  };
  const onActivity = async () => {
    try { setEvents(await listMcpAudit()); } catch (e) { setStatus({ msg: e.message, bad: true }); }
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', color: '#fff' }} data-testid="mcp-access">
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>MCP access</h1>
      <p style={{ opacity: 0.7, margin: '8px 0 20px' }}>
        Use SmartVideo GO from Claude, Cursor and other MCP apps. Save your API key in Settings first: MCP keys use it.
      </p>
      <button onClick={onCreate} disabled={busy} style={{ padding: '10px 16px', borderRadius: 10, fontWeight: 700, background: '#fff', color: '#000' }}>Create MCP key</button>
      {status.msg && <p role="status" style={{ marginTop: 12, color: status.bad ? '#f87171' : 'inherit', opacity: status.bad ? 1 : 0.7 }}>{status.msg}</p>}

      {fresh && (
        <section style={{ marginTop: 20 }}>
          <p style={{ color: '#fcd34d', fontSize: 13 }}>Copy this now. It is shown once.</p>
          <textarea readOnly rows={10} value={`${fresh.key}\n\n# Hosted (nothing to install)\n${fresh.http}\n\n# Claude Code\n${fresh.claudeCode}\n\n# Claude Desktop / Cursor\n${fresh.json}`} style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, background: 'rgba(0,0,0,.4)', color: '#fff', padding: 10, borderRadius: 8 }} />
        </section>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 28 }}>Your keys</h2>
      {keys === null ? <p style={{ opacity: 0.6 }}>Loading…</p> : keys.length === 0 ? <p style={{ opacity: 0.6 }}>No MCP keys yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
          {keys.map((k) => (
            <li key={k.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
              <span>{k.label} · {k.prefix} · {k.last_used_at ? `used ${new Date(k.last_used_at).toLocaleDateString()}` : 'never used'}{k.expires_at ? ` · expires ${new Date(k.expires_at).toLocaleDateString()}` : ''}</span>
              <span style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => onRotate(k.id)} disabled={busy}>Rotate</button>
                <button onClick={() => onRevoke(k.id)} style={{ color: '#f87171' }}>Revoke</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 28 }}>Recent activity</h2>
      <button onClick={onActivity} style={{ marginTop: 8 }}>Show recent activity</button>
      {events && (events.length === 0 ? <p style={{ opacity: 0.6 }}>Nothing yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 8, fontSize: 13 }} data-testid="mcp-activity">
          {events.map((e, i) => <li key={i} style={{ padding: '4px 0', opacity: 0.85 }}>{new Date(e.at).toLocaleString()} · {e.tool} · {e.risk} · {e.ok ? 'ok' : 'failed'}</li>)}
        </ul>
      ))}
    </main>
  );
}
