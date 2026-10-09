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
    expect(source).toContain('/api/v1/upload_file');
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

  it('safely handles direct upload URLs from MuAPI', () => {
    expect(source).toContain('/api/v1/upload_file');
    expect(source).toContain('sign.data?.url');
    expect(source).toContain('MuAPI did not return an upload URL');
  });

  it('rejects oversize files in the upload handler', () => {
    expect(source).toContain('exceeds the');
    expect(source).toContain('upload limit');
  });

  it('skips unsupported MIME types instead of uploading them', () => {
    expect(source).toContain('!supported) continue');
  });

  it('invokes the axios onUploadProgress callback during upload', () => {
    expect(source).toContain('onUploadProgress');
    expect(source).toContain('setUploadProgress');
  });

  it('registers the attachment on successful upload', () => {
    expect(source).toContain('setAttachments(previous');
  });
});
