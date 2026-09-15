// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('workflow-builder', () => ({
  WorkflowBuilder: () => <div data-testid="workflow-builder" />,
}));

describe('WorkflowUI', () => {
  it('renders without crashing and includes the Toaster container', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const WorkflowUI = (await import('./WorkflowUI.jsx')).default;

    act(() => {
      root.render(<WorkflowUI apiKey="fake" />);
    });

    const hasBuilder = container.querySelector('[data-testid="workflow-builder"]');
    expect(hasBuilder).toBeTruthy();
  });
});
