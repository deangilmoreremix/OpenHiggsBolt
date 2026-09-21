// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ImageEditorModal from '../image-editor/ImageEditorModal'

vi.mock('@/src/shared/api/openaiImage', () => ({
  editImage: vi.fn(),
}))

describe('ImageEditorModal', () => {
  it('renders the SmartVideo editor with contextual quick actions for a logo', () => {
    render(
      <ImageEditorModal
        open
        asset={{
          id: 'logo-1',
          name: 'Acme Logo',
          imageUrl: 'data:image/png;base64,AA==',
          category: 'logo',
          source: 'discovered',
          businessName: 'Acme Roofing',
          industry: 'Roofing',
        }}
        onClose={vi.fn()}
        onApply={vi.fn()}
      />,
    )

    expect(screen.getByText('SmartVideo Image Editor')).toBeTruthy()
    expect(screen.getAllByText('Make Video Ready').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Remove Background').length).toBeGreaterThan(0)
    expect(screen.getByText('Ask AI to Edit')).toBeTruthy()
    expect(screen.getByText('Advanced Local Editor')).toBeTruthy()
    expect(screen.getByText('Asset Protection')).toBeTruthy()
    expect(screen.getByText('Use This Asset')).toBeTruthy()
  })

  it('does not render while closed', () => {
    const { container } = render(
      <ImageEditorModal
        open={false}
        asset={null}
        onClose={vi.fn()}
        onApply={vi.fn()}
      />,
    )

    expect(container.innerHTML).toBe('')
  })
})
