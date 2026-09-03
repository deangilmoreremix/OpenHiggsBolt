import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/apps/design-agent/DesignAgent.tsx'),
  'utf8',
);

describe('SmartVideo Design Agent parity', () => {
  it('requires user approval for proposed execution plans', () => {
    expect(source).toContain('GO-AI EXECUTION PLAN');
    expect(source).toContain("handlePlanAction('approve')");
    expect(source).toContain("handlePlanAction('reject')");
    expect(source).toContain('/api/design-agent/approve');
    expect(source).toContain('/api/design-agent/reject');
    expect(source).not.toContain('No plan-approval UI');
  });

  it('supports registered multi-reference media', () => {
    expect(source).toContain('MAX_ATTACHMENTS = 14');
    expect(source).toContain('/api/v1/get_upload_url');
    expect(source).toContain('/api/v1/upload-binary');
    expect(source).toContain('/api/design-agent/session-assets');
    expect(source).toContain('asset_label');
    expect(source).toContain('multiple');
  });

  it('keeps the SmartVideo UI while adding new agent controls', () => {
    expect(source).toContain('Design is easier with');
    expect(source).toContain('Recent Projects');
    expect(source).toContain('Templates');
    expect(source).toContain('Brand Kit');
    expect(source).toContain("type AgentMode = 'agent' | 'generate' | 'edit'");
  });

  it('adds generated-image actions without removing existing SmartVideo actions', () => {
    expect(source).toContain('Edit with Go-AI');
    expect(source).toContain('Upscale');
    expect(source).toContain('Remove BG');
    expect(source).toContain('Vectorize');
    expect(source).toContain('PublishStep');
    expect(source).toContain('AssistStep');
    expect(source).toContain('Download');
  });

  it('safely encodes CDN upload URLs to handle special characters', () => {
    expect(source).toContain('split');
    expect(source).toContain('encodeURIComponent');
    expect(source).toContain('cdn.muapi.ai');
  });
});
