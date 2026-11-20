// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-workflow-id' }),
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockToastError = vi.fn();
vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    error: (...args) => mockToastError(...args),
  },
}));

vi.mock('reactflow', async () => {
  const actual = await vi.importActual('reactflow');
  return {
    ...actual,
    ReactFlow: ({ children }) => <div data-testid="react-flow">{children}</div>,
    addEdge: vi.fn(),
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    Panel: () => null,
    useNodesState: (initial) => [initial, vi.fn(), vi.fn()],
    useEdgesState: (initial) => [initial, vi.fn(), vi.fn()],
    useReactFlow: () => ({
      fitView: vi.fn(),
      getNode: vi.fn(),
      setViewport: vi.fn(),
      getViewport: vi.fn(),
    }),
  };
});

vi.mock('react-icons/bs', () => ({ BsArrowUpCircleFill: () => null }));
vi.mock('react-icons/fi', () => ({ FiZoomIn: () => null, FiZoomOut: () => null, FiSun: () => null, FiMoon: () => null }));
vi.mock('react-icons/tfi', () => ({ TfiText: () => null }));
vi.mock('react-icons/md', () => ({ MdLockOutline: () => null, MdOutlineZoomOutMap: () => null, MdSave: () => null }));
vi.mock('react-icons/lu', () => ({ LuLayoutTemplate: () => null, LuMousePointer2: () => null }));
vi.mock('react-icons/fa6', () => ({ FaAngleDown: () => null, FaAngleLeft: () => null, FaCheck: () => null, FaPlay: () => null, FaPlus: () => null, FaRegHand: () => null, FaToolbox: () => null, FaUpload: () => null }));
vi.mock('react-icons/fa', () => ({ FaRegEdit: () => null, FaTelegramPlane: () => null }));
vi.mock('react-icons/io5', () => ({ IoDuplicateOutline: () => null, IoImageOutline: () => null, IoVideocamOutline: () => null }));
vi.mock('react-icons/tb', () => ({ TbArrowMerge: () => null }));
vi.mock('react-icons/ri', () => ({ RiInputMethodLine: () => null }));
vi.mock('react-icons/ai', () => ({ AiOutlineAudio: () => null }));

vi.mock('./TextNode', () => ({ default: () => null }));
vi.mock('./ImageNode', () => ({ default: () => null }));
vi.mock('./VideoNode', () => ({ default: () => null }));
vi.mock('./AudioNode', () => ({ default: () => null }));
vi.mock('./PromptConcate', () => ({ default: () => null }));
vi.mock('./VideoCombiner', () => ({ default: () => null }));
vi.mock('./ApiNode', () => ({ default: () => null }));
vi.mock('./RenderField', () => ({ default: () => null }));
vi.mock('./RenderApiField', () => ({ default: () => null }));
vi.mock('./NodesNavbar', () => ({ default: () => null }));
vi.mock('./ChatWidget', () => ({ default: () => null }));
vi.mock('./VideoPlayer', () => ({ default: () => null }));
vi.mock('./NodeSendButton', () => ({ default: () => null }));
vi.mock('./AudioPlayer', () => ({ default: () => null }));
vi.mock('./NodeOptionsMenu', () => ({ default: () => null }));
vi.mock('./useGenerationCost', () => ({ 
  useGenerationCost: () => ({ generationCost: null, isRefreshingCost: false, totalWorkflowCost: '0' }) 
}));
vi.mock('./utility', () => ({ 
  apiNodeModels: [], 
  audioModels: [], 
  concatModels: [], 
  imageModels: [], 
  textModels: [], 
  videoModels: [], 
  videoCombinerModels: [], 
  presets: [] 
}));
vi.mock('./WorkflowStore', () => ({ setWorkflowIds: vi.fn() }));

const axios = await import('axios');

function mount() {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('NodeFlow handleRunWorkflow error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.default.post.mockReset();
    mockToastError.mockClear();
  });

  it('shows a visible toast error when /api/workflow/{id}/run fails', async () => {
    const { container } = mount();
    const NodeFlow = (await import('./NodeFlow.jsx')).default;

    axios.default.post
      .mockResolvedValueOnce({ data: { workflow_id: 'saved-workflow-id' } })
      .mockRejectedValueOnce({
        response: {
          status: 500,
          data: { detail: 'Workflow run failed' },
        },
      });

    await act(async () => {
      const root = createRoot(container);
      root.render(
        <NodeFlow
          initialNodeSchemas={{ categories: {} }}
          initialWorkflowData={{
            is_owner: true,
            data: {
              nodes: [],
              edges: []
            }
          }}
        />
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const runButton = container.querySelector('button:has(.fa-play)');
    if (!runButton) {
      const buttons = Array.from(container.querySelectorAll('button'));
      const runBtn = buttons.find((btn) => btn.textContent?.includes('Run All'));
      expect(runBtn).toBeTruthy();
      runBtn.click();
    } else {
      runButton.click();
    }

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockToastError).toHaveBeenCalledWith('Failed: Workflow run failed');
    expect(axios.default.post).toHaveBeenNthCalledWith(
      2,
      '/api/workflow/saved-workflow-id/run',
      expect.objectContaining({ cost: expect.any(String) })
    );
  });
});
