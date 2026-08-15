// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

// Mock the API modules BEFORE importing the component
vi.mock('@/lib/muapi', () => ({
  enhanceImage: vi.fn().mockResolvedValue('https://example.com/enhanced.png'),
}));

vi.mock('@/shared/api/openai', () => ({
  callOpenAIChat: vi.fn().mockResolvedValue('Rewritten text variant'),
}));

// Import after vi.mock
import AiAssistantModal from './AiAssistantModal';
import { enhanceImage } from '@/lib/muapi';
import { callOpenAIChat } from '@/shared/api/openai';

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });

function mountModal(props = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const defaultProps = {
    open: true,
    mode: 'image',
    allowToggle: true,
    input: 'https://example.com/input.png',
    inputKind: 'url',
    defaultValue: '',
    apiKey: 'test-key',
    openaiKey: 'test-openai-key',
    onClose: vi.fn(),
    onApply: vi.fn(),
  };

  act(() => {
    root.render(<AiAssistantModal {...defaultProps} {...props} />);
  });

  return { container, root, onClose: defaultProps.onClose, onApply: defaultProps.onApply };
}

describe('AiAssistantModal', () => {
  describe('rendering', () => {
    it('renders nothing when closed', () => {
      const { container } = mountModal({ open: false });
      expect(container.innerHTML).toBe('');
    });

    it('renders the modal when open', () => {
      const { container } = mountModal();
      expect(container.querySelector('[role="dialog"]')).toBeTruthy();
      expect(container.textContent).toContain('AI Assistant');
    });

    it('shows Image/Text toggle when allowToggle is true', () => {
      const { container } = mountModal({ allowToggle: true });
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(2);
    });

    it('hides toggle when allowToggle is false', () => {
      const { container } = mountModal({ allowToggle: false });
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(0);
    });
  });

  describe('image mode', () => {
    it('shows the input image in Before section', () => {
      const { container } = mountModal({ input: 'https://example.com/input.png' });
      const img = container.querySelector('img[alt="Original image to be enhanced by the AI Assistant"]');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('https://example.com/input.png');
    });

    it('shows tool chips for image mode', () => {
      const { container } = mountModal({ mode: 'image' });
      expect(container.textContent).toContain('Upscale');
      expect(container.textContent).toContain('Style transfer');
      expect(container.textContent).toContain('Background remove');
      expect(container.textContent).toContain('Restore');
    });

    it('calls enhanceImage when Generate is clicked for upscale', async () => {
      mountModal({ mode: 'image', tool: 'upscale' });
      const generateBtn = [...document.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Generate'),
      );
      act(() => {
        generateBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await flush();

      expect(enhanceImage).toHaveBeenCalledTimes(1);
      const [calledApiKey, endpoint, payload] = enhanceImage.mock.calls[0];
      expect(calledApiKey).toBe('test-key');
      expect(endpoint).toBe('ai-image-upscale');
      expect(payload.image_url).toBe('https://example.com/input.png');
      expect(payload.scale).toBe(2);
    });

    it('shows error when enhancement fails', async () => {
      enhanceImage.mockRejectedValueOnce(new Error('API error'));

      const { container } = mountModal({ mode: 'image', tool: 'upscale' });
      const generateBtn = [...document.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Generate'),
      );
      act(() => {
        generateBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await flush();
      await flush();

      expect(container.textContent).toContain('API error');
    });
  });

  describe('text mode', () => {
    it('shows textarea for input text', () => {
      const { container } = mountModal({ mode: 'text', inputKind: 'text', input: 'Hello world' });
      const textarea = container.querySelector('textarea');
      expect(textarea).toBeTruthy();
      expect(textarea?.getAttribute('placeholder')).toContain('Type or paste text to enhance');
    });

    it('shows tool chips for text mode', () => {
      const { container } = mountModal({ mode: 'text' });
      expect(container.textContent).toContain('Rewrite');
      expect(container.textContent).toContain('Tone');
      expect(container.textContent).toContain('Expand');
      expect(container.textContent).toContain('Summarize');
      expect(container.textContent).toContain('Translate');
    });

    it('calls OpenAI chat when Generate is clicked for rewrite', async () => {
      mountModal({ mode: 'text', tool: 'rewrite', inputKind: 'text', input: 'Hello world' });
      const generateBtn = [...document.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Generate'),
      );
      act(() => {
        generateBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await flush();
      await flush();

      expect(callOpenAIChat).toHaveBeenCalledTimes(1);
      const messages = callOpenAIChat.mock.calls[0][0];
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe('Hello world');
    });
  });

  describe('keyboard navigation', () => {
    it('closes on Escape key', () => {
      const onClose = vi.fn();
      const { container } = mountModal({ onClose });
      const dialog = container.querySelector('[role="dialog"]') as HTMLElement;

      act(() => {
        dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('does not close on Escape while processing', async () => {
      const onClose = vi.fn();
      enhanceImage.mockImplementationOnce(() => new Promise(() => {})); // never resolves

      const { container } = mountModal({ mode: 'image', tool: 'upscale', onClose });
      const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
      const generateBtn = [...document.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Generate'),
      );
      act(() => {
        generateBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      act(() => {
        dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('renders a dialog with correct ARIA attributes', () => {
      const { container } = mountModal();
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
      expect(dialog?.getAttribute('aria-labelledby')).toBe('ai-title');
    });
  });
});
