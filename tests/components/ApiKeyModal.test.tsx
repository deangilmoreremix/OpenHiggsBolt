import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApiKeyModal from '../../components/ApiKeyModal.js'

describe('ApiKeyModal', () => {
  it('renders the default title, subtitle, and an input field', () => {
    render(<ApiKeyModal onSave={vi.fn()} onClose={vi.fn()} overlay />)
    expect(screen.getByRole('heading', { name: /open generative ai/i })).toBeInTheDocument()
    expect(screen.getByText(/enter your/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/api access key/i)).toBeInTheDocument()
  })

  it('calls onSave with the trimmed value when the user submits a key', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ApiKeyModal onSave={onSave} onClose={vi.fn()} overlay />)

    await user.type(screen.getByLabelText(/api access key/i), '  abc-123  ')
    await user.click(screen.getByRole('button', { name: /get started/i }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('abc-123')
  })

  it('does not call onSave when the submitted key is empty', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<ApiKeyModal onSave={onSave} onClose={vi.fn()} overlay />)

    await user.click(screen.getByRole('button', { name: /get started/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText(/please enter your api key/i)).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ApiKeyModal onSave={vi.fn()} onClose={onClose} overlay />)

    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
